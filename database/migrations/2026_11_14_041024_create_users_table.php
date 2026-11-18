<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('user_id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('full_name')->default('');
            $table->text('email')->unique('users_email_key');
            $table->text('role')->default('user');
            $table->text('status')->default('active');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->nullable();
            $table->text('password')->nullable();
            $table->string('remember_token', 100)->nullable();
            $table->timestampTz('email_verified_at')->nullable();
            $table->text('google_id')->nullable();
            $table->text('avatar_url')->nullable();
        });

        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user','admin'))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','inactive'))");
        DB::statement('CREATE UNIQUE INDEX users_google_id_key ON users (google_id) WHERE google_id IS NOT NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};