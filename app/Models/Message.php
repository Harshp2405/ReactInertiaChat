<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'receiver_id',
        'body',
        'read_at',
        'type',
        'is_deleted',
        'deleted_at',
    ];


    public function getBodyAttribute($value)
    {
        if (!$value) return null;

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return [
                "error" => $e
            ];
        }
    }

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }
}
