<?php

namespace App\Http\Controllers;

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
                    'last_message' => $conversation->lastMessage
                ];
            });

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'users' => User::where('id', '!=', auth()->id())->get()
        ]);
    }


    public function show(Conversation $conversation)
    {
        $authId = auth()->id();

        if (!$conversation->users->contains(auth()->id())) {
            abort(403);
        }

        $messages = $conversation->messages()
            ->with(['sender' , 'attachments'])
            ->orderBy('created_at', 'asc')
            ->take(50)
            ->get()
            ->values();

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
}
