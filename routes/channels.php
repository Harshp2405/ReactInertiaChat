<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {

    $conversation = Conversation::find($conversationId);

    if (!$conversation) {
        return false;
    }

    // Allow only users who belong to conversation
    return $conversation->users()->where('user_id', $user->id)->exists();
});