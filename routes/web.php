<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth:sanctum', 'verified'])->name('dashboard');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');


    // Route::get('/chat/{user}', [ChatController::class, 'show'])
    //     ->name('chat.show');

    // Send message
    Route::post('/chat/{conversation}/send', [ChatController::class, 'send'])
        ->name('chat.send');

    Route::get('/chats', [ChatController::class, 'index'])
        ->name('chat.index');

    Route::get('/chat/conversation/{conversation}', [ChatController::class, 'show'])
        ->name('chat.show');

    Route::post('/chat/start/{user}', [ChatController::class, 'startConversation']);
        
    Route::post('/chat/group/create', [ChatController::class, 'createGroup'])
            ->name('chat.group.create');
// Leave Group
    Route::post('/chat/{conversation}/leave', [ChatController::class, 'leaveGroup']);

    // Delete group 
    Route::delete('/chat/{conversation}/delete', [ChatController::class, 'deleteGroup']);

    // Add Members
    Route::post('/chat/{conversation}/add-members', [ChatController::class, 'addMembers']);

    // Remove Member
    Route::post('/chat/{conversation}/remove-member', [ChatController::class, 'removeMember']);
    });

require __DIR__.'/auth.php';
