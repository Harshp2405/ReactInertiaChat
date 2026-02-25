<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('name')->nullable();
            $table->boolean('is_group')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnDelete();

            $table->dropColumn(['user_one_id', 'user_two_id']); // remove old structure
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
