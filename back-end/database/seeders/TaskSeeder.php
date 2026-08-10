<?php

namespace Database\Seeders;

use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run()
    {
        $tasks = [
            ['name' => 'Devoirs', 'default_points' => 5, 'icon' => '📚', 'color' => 'emerald', 'max_points' => 10],
            ['name' => 'Lecture', 'default_points' => 3, 'icon' => '📖', 'color' => 'blue', 'max_points' => 10],
            ['name' => 'Écoute', 'default_points' => 2, 'icon' => '👂', 'color' => 'cyan', 'max_points' => 10],
            ['name' => 'Comportement', 'default_points' => 1, 'icon' => '🙋', 'color' => 'yellow', 'max_points' => 10],
            ['name' => 'Participation', 'default_points' => 2, 'icon' => '💬', 'color' => 'purple', 'max_points' => 10],
        ];
        
        foreach ($tasks as $task) {
            Task::firstOrCreate(
                ['name' => $task['name']],
                $task
            );
        }
        
        $this->command->info('✅ Tasks seeded successfully!');
    }
}