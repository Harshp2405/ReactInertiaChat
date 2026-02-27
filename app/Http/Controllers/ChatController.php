<?php

namespace App\Http\Controllers;

use App\Events\GroupCreated;
use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChatController extends Controller
{

    public function index()
    {
        $conversations = auth()->user()
            ->conversations()
            ->with(['users', 'lastMessage.sender'])
            ->latest()
            ->get()
            ->map(function ($conversation) {

                // Private chat → show other user's name
                if (!$conversation->is_group) {
                    $otherUser = $conversation->users
                        ->where('id', '!=', auth()->id())
                        ->first();

                    $conversation->name = $otherUser?->name;
                }

                return [
                    'conversation_id' => $conversation->id,
                    'name' => $conversation->name,
                    'is_group' => $conversation->is_group,
                    'users' => $conversation->users,
                    'createdby'=>$conversation->created_by,
                    'last_message' => $conversation->lastMessage,
                    'unreadCount'=>$conversation->messages()->whereNull("read_at")->where("sender_id" , "!=" , auth()->id())->count()
                ];
            })->sortBy(function ($conversation) {
                return $conversation['last_message'] ? $conversation['last_message']['created_at'] : null;
            }, SORT_REGULAR, true)->values();



        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'users' => User::where('id', '!=', auth()->id())->get()
        ]);
    }

    public function show(Conversation $conversation)
    {
        

        if (!$conversation->users->contains(auth()->id())) {
            abort(403);
        }

        
        $messages = $conversation->messages()
            ->with(['sender' , 'attachments'])
            ->orderBy('created_at', 'asc')
            ->take(50)
            ->get()
            ->values();
            

        $this->markAsRead($conversation);

        return response()->json([
            'conversation_id' => $conversation->id,
            'getmessages' => $messages,
        ]);
    }

    public function send(Request $request, Conversation $conversation)
    {
        $request->validate([
            'body' => 'nullable|string',
            'file' => 'nullable|array',
            'file.*' => 'file|max:10240',
        ]);

        if (!$request->filled('body') && !$request->hasFile('file')) {
            return response()->json(['error' => 'Message or file required'], 422);
        }

        $authId = auth()->id();

        // Check user belongs to conversation
        if (!$conversation->users->contains($authId)) {
            abort(403);
        }


        $message = $conversation->messages()->create([
            'sender_id' => $authId,
            'body' => $request->body,
        ]);


        if ($request->hasFile('file')) {
            foreach ($request->file('file') as $file) {
                $path = $file->store("chat_files/{$authId}/{$conversation->id}", 'public');

                $message->attachments()->create([
                    'file_path' => $path,
                    'file_type' => $file->getMimeType(),
                ]);
            }
        }

        $message->load('attachments', 'sender');

        broadcast(new MessageSent($message))->toOthers();

        return response()->json(['message' => $message]);
    }

    public function createGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'users' => 'required|array|min:1',
            'users.*' => 'exists:users,id'
        ]);

        $conversation = Conversation::create([
            'name' => $request->name,
            'is_group' => true,
            'created_by' => auth()->id(),
        ]);

        $allUsers = array_unique(
            array_merge($request->users, [auth()->id()])
        );

        $conversation->users()->attach($allUsers);

        $conversation->load('users');

        broadcast(new GroupCreated($conversation))->toOthers();

        return response()->json([
            'conversation' => [
                'conversation_id' => $conversation->id,
                'name' => $conversation->name,
                'is_group' => $conversation->is_group,
                'users' => $conversation->users,
                'last_message' => null
            ]
        ]);
    }

    public function startConversation(User $user)
    {
        $authUser = auth()->user();

        // Prevent self chat
        if ($authUser->id === $user->id) {
            return response()->json(['error' => 'Cannot chat with yourself'], 400);
        }

        // Check if conversation already exists
        $conversation = Conversation::where('is_group', false)
            ->whereHas('users', function ($q) use ($authUser) {
                $q->where('user_id', $authUser->id);
            })
            ->whereHas('users', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->first();

        if (!$conversation) {
            // Create new conversation
            $conversation = Conversation::create([
                'is_group' => false,
            ]);

            $conversation->users()->attach([
                $authUser->id,
                $user->id
            ]);
        }

        return response()->json([
            'conversation_id' => $conversation->id
        ]);
    }


    public function leaveGroup(Conversation $conversation)
    {
        $user = auth()->user();

        if (!$conversation->is_group) {
            return response()->json(['error' => 'Not a group'], 400);
        }

        if (!$conversation->users->contains($user->id)) {
            return response()->json(['error' => 'Not a member'], 403);
        }

        DB::transaction(function () use ($conversation, $user) {

            // Remove user from group
            $conversation->users()->detach($user->id);

            // Reload members
            $conversation->load('users');

            // 2️⃣ If no members left → delete entire group
            if ($conversation->users->count() === 0) {

                // Delete messages
                $conversation->messages()->delete();

                // Delete conversation
                $conversation->delete();

                return;
            }

            // Create system message
            $message = $conversation->messages()->create([
                'sender_id' => $user->id,
                'body' => $user->name . ' left the group',
                'type' => 'system' // optional column if you want
            ]);

            $message->load('sender');

            broadcast(new MessageSent($message))->toOthers();
        });

        return response()->json([
            'success' => true,
            'conversation_id' => $conversation->id
        ]);
    }

    public function deleteGroup(Conversation $conversation)
    {
        $user = auth()->user();

        if (!$conversation->is_group) {
            return response()->json(['error' => 'Not a group'], 400);
        }

        if (!$conversation->users->contains($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        DB::transaction(function () use ($conversation) {

            $conversationId = $conversation->id;

            // Broadcast delete event BEFORE deleting
            // broadcast(new GroupDeleted($conversationId))->toOthers();

            // Delete conversation (cascade will remove messages + pivot)
            $conversation->delete();
        });

        return response()->json([
            'success' => true,
            'conversation_id' => $conversation->id
        ]);
    }

    public function addMembers(Request $request, Conversation $conversation)
    {
        $request->validate([
            'users' => 'required|array|min:1',
            'users.*' => 'exists:users,id'
        ]);

        $authUser = auth()->user();

        if (!$conversation->is_group) {
            return response()->json(['error' => 'Not a group'], 400);
        }

        // Only admin can add
        if ($conversation->created_by !== $authUser->id) {
            return response()->json(['error' => 'Only admin can add members'], 403);
        }

        $existingUserIds = $conversation->users()->pluck('users.id')->toArray();

        $newUserIds = array_diff($request->users, $existingUserIds);

        if (empty($newUserIds)) {
            return response()->json(['error' => 'Users already in group'], 422);
        }

        // Attach new users
        $conversation->users()->attach($newUserIds);

        $conversation->load('users');

        // Create system message
        $addedUsers = User::whereIn('id', $newUserIds)->pluck('name')->implode(', ');

        $systemMessage = $conversation->messages()->create([
            'sender_id' => $authUser->id,
            'body' => "{$authUser->name} added {$addedUsers} to the group",
            'type' => 'system'
        ]);

        $systemMessage->load('sender');

        broadcast(new MessageSent($systemMessage))->toOthers();

        return response()->json([
            'conversation' => $conversation,
            'message' => $systemMessage
        ]);
    }

    public function removeMember(Request $request, Conversation $conversation)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $authUser = auth()->user();

        if (!$conversation->is_group) {
            return response()->json(['error' => 'Not a group'], 400);
        }

        // ✅ Only admin can remove
        if ($conversation->created_by !== $authUser->id) {
            return response()->json(['error' => 'Only admin can remove members'], 403);
        }

        // ❌ Prevent admin removing himself
        if ($request->user_id == $authUser->id) {
            return response()->json(['error' => 'Admin cannot remove himself'], 400);
        }

        // ❌ Prevent removing non-member
        if (!$conversation->users()->where('users.id', $request->user_id)->exists()) {
            return response()->json(['error' => 'User not in group'], 400);
        }

        $removedUser = User::find($request->user_id);

        // Remove from pivot
        $conversation->users()->detach($request->user_id);

        // Create system message
        $systemMessage = $conversation->messages()->create([
            'sender_id' => $authUser->id,
            'body' => "{$authUser->name} removed {$removedUser->name} from the group",
            'type' => 'system'
        ]);

        $systemMessage->load('sender');

        broadcast(new MessageSent($systemMessage))->toOthers();

        return response()->json([
            'message' => $systemMessage,
            'removed_user_id' => $request->user_id
        ]);
    }

    public function markAsRead(Conversation $conversation)
    {
        $authId = auth()->id();

        if (!$conversation->users->contains($authId)) {
            abort(403);
        }

        $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $authId)
            ->update([
                'read_at' => now()
            ]);

        broadcast(new MessageRead($conversation->id, $authId))->toOthers();

        return response()->json(['success' => true]);
    }
}
