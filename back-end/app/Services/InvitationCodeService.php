<?php

namespace App\Services;

use App\Models\InvitationCode;
use Illuminate\Support\Str;

class InvitationCodeService
{
    public function generate(int $roleId, int $createdBy, ?int $classId = null, int $expiresInHours = 72): InvitationCode
    {
        return InvitationCode::create([
            'code' => strtoupper(Str::random(12)),
            'role_id' => $roleId,
            'created_by' => $createdBy,
            'class_id' => $classId,
            'expires_at' => now()->addHours($expiresInHours),
        ]);
    }

    public function generateBulk(int $count, int $roleId, int $createdBy, ?int $classId = null): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = $this->generate($roleId, $createdBy, $classId);
        }
        return $codes;
    }
}