<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
class Role extends Model
{
    protected $fillable = ['name', 'guard_name'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function invitationCodes()
    {
        return $this->hasMany(InvitationCode::class);
    }
}