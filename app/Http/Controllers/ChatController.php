<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{

    public function index()
        {
        $authId = auth()->id();

            $conversations = Conversation::query()
                ->where('user_one_id', $authId)
                ->orWhere('user_two_id', $authId)
                ->with(['messages' => function ($query) {
                    $query->latest()->limit(1);
                }])
                ->get()
                ->map(function ($conversation) use ($authId) {
                    $otherUser = $conversation->user_one_id == $authId
                        ? $conversation->userTwo
                        : $conversation->userOne;

                    $lastMessage = $conversation->messages->first();

                    $unreadCount = $conversation->messages()
                        ->whereNull('read_at')
                        ->where('receiver_id', $authId)
                        ->count();

                    return [
                        'conversation_id' => $conversation->id,
                        'user' => $otherUser,
                        'last_message' => $lastMessage,
                        'unread_count' => $unreadCount,
                        'updated_at' => $conversation->updated_at,
                    ];
                })
                ->sortByDesc('updated_at')
                ->values();
        $userId = auth()->id();

        $users = User::where('users.id', '!=', $userId)
            ->leftJoin('messages', function ($join) use ($userId) {
                $join->on(function ($query) use ($userId) {
                    $query->whereColumn('messages.sender_id', 'users.id')
                        ->where('messages.receiver_id', $userId);
                })->orOn(function ($query) use ($userId) {
                    $query->whereColumn('messages.receiver_id', 'users.id')
                        ->where('messages.sender_id', $userId);
                });
            })
            ->select('users.*', DB::raw('MAX(messages.created_at) as last_message_at'))
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('last_message_at')
            ->orderBy('users.name')
            ->get();

            return inertia('Chat/Index', [
                'conversations' => $conversations,
                'user' => auth()->user(),
            'chatUser' => $users,
            ]);
        }
    private function getOrCreateConversation($userA, $userB)
    {
        $userOne = min($userA, $userB);
        $userTwo = max($userA, $userB);

        return Conversation::firstOrCreate([
            'user_one_id' => $userOne,
            'user_two_id' => $userTwo,
        ]);
    }

    public function show(User $user)
    {
        $authId = auth()->id();

        $conversation = $this->getOrCreateConversation($authId, $user->id);

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
            'file' => 'nullable',
            'file.*' => 'file|max:10240',
        ]);

        if (!$request->filled('body') && !$request->hasFile('file')) {
            return response()->json(['error' => 'Message or file required'], 422);
        }

        $authId = auth()->id();

        // Check user belongs to conversation
        if (!in_array($authId, [
            $conversation->user_one_id,
            $conversation->user_two_id
        ])) {
            abort(403);
        }

        $receiverId = $conversation->user_one_id == $authId
            ? $conversation->user_two_id
            : $conversation->user_one_id;

        $message = $conversation->messages()->create([
            'sender_id' => $authId,
            'receiver_id' => $receiverId,
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
}
