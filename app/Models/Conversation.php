<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = [
        'name',
        'is_group',
        'created_by'
    ];
    protected $casts = [
        'is_group' => 'boolean',
    ];

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'conversation_user',
            'conversation_id',
            'user_id'
        );
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lastMessage():HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    }
