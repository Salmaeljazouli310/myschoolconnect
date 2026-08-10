<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StudentsImport implements ToCollection, WithHeadingRow
{
    protected $classId;
    protected $adminId;
    protected $importedCount = 0;
    protected $errors = [];

    public function __construct($classId = null, $adminId = null)
    {
        $this->classId = $classId;
        $this->adminId = $adminId;
    }

    public function collection(Collection $rows)
    {
        DB::beginTransaction();
        
        try {
            foreach ($rows as $index => $row) {
                try {
                    // Vérifier les champs requis
                    if (empty($row['first_name']) || empty($row['last_name'])) {
                        $this->errors[] = "Ligne " . ($index + 2) . ": first_name et last_name sont requis";
                        continue;
                    }

                    // Créer ou trouver le parent
                    $parent = null;
                    if (!empty($row['parent_email'])) {
                        $parentRole = Role::where('name', 'parent')->first();
                        
                        // Generate a default password
                        $defaultPassword = 'password123';
                        
                        // Check if parent already exists
                        $parent = User::where('email', $row['parent_email'])->first();
                        
                        if (!$parent) {
                            // Create parent with default password
                            $parent = User::create([
                                'name' => $row['parent_name'] ?? $row['first_name'] . ' ' . $row['last_name'] . ' (Parent)',
                                'email' => $row['parent_email'],
                                'phone' => $row['parent_phone'] ?? null,
                                'password' => Hash::make($defaultPassword),
                                'role_id' => $parentRole->id,
                                'is_active' => true,
                            ]);
                            
                            Log::info('Parent created with default password', [
                                'email' => $row['parent_email'],
                                'password' => $defaultPassword
                            ]);
                            
                            // Add to errors as info (not error)
                            $this->errors[] = "Parent créé: " . $row['parent_email'] . " - Mot de passe par défaut: " . $defaultPassword;
                        }
                    }

                    // Créer l'étudiant
                    $student = Student::create([
                        'first_name' => $row['first_name'],
                        'last_name' => $row['last_name'],
                        'date_of_birth' => $row['date_of_birth'] ?? null,
                        'gender' => $row['gender'] ?? 'male',
                        'student_code' => $row['student_code'] ?? 'STU_' . Str::random(8) . '_' . time(),
                        'class_id' => $this->classId ?? $row['class_id'] ?? null,
                    ]);

                    // Lier le parent à l'étudiant
                    if ($parent && $student) {
                        DB::table('student_parents')->insert([
                            'student_id' => $student->id,
                            'parent_id' => $parent->id,
                            'relation' => $row['parent_relation'] ?? 'parent',
                            'is_primary' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    $this->importedCount++;
                    
                } catch (\Exception $e) {
                    Log::error('Import error: ' . $e->getMessage());
                    $this->errors[] = "Ligne " . ($index + 2) . ": " . $e->getMessage();
                }
            }
            
            DB::commit();
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import transaction error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getImportedCount()
    {
        return $this->importedCount;
    }

    public function getErrors()
    {
        return $this->errors;
    }
}