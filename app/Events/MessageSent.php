<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */

    public $message;

    public function __construct($message)
    {
        $this->message = $message->load('sender');
    }

    public function broadcastOn()
    {
        return new PrivateChannel('chat.' . $this->message->conversation_id);
    }
    public function broadcastWith()
    {
        return [
            'message' => $this->message->load('sender'),
        ];
    }
    public function broadcastAs()
    {
        return 'message.sent';
    }
}


// public function index()
//     {

//         $conversations = Conversation::query()
//             ->where('user_one_id', $this->authId)
//             ->orWhere('user_two_id', $this->authId)
//             ->with(['messages' => function ($query) {
//                 $query->latest()->limit(1);
//             }])
//             ->get()
//             ->map(function ($conversation) {
//                 $authId = $this->authId;
//                 $otherUser = $conversation->user_one_id == $authId
//                     ? $conversation->userTwo
//                     : $conversation->userOne;

//                 $lastMessage = $conversation->messages->first();

//                 $unreadCount = $conversation->messages()
//                     ->whereNull('read_at')
//                     ->where('receiver_id', $authId)
//                     ->count();

//                 return [
//                     'conversation_id' => $conversation->id,
//                     'user' => $otherUser,
//                     'last_message' => $lastMessage,
//                     'unread_count' => $unreadCount,
//                     'updated_at' => $conversation->updated_at,
//                 ];
//             })
//             ->sortByDesc('updated_at')
//             ->values();

//         return inertia('Chat/Index', [
//             'conversations' => $conversations,
//             'user' => auth()->user(),
//         ]);
//     }