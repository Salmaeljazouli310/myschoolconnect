<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\StudentsImport;

class StudentImportController extends Controller
{
    use ApiResponse;

    public function import(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:5120',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $import = new StudentsImport($request->class_id, $request->user()->id);
            Excel::import($import, $request->file('file'));

            // ✅ Retourner le format attendu par le frontend
            return response()->json([
                'success' => true,
                'imported_count' => $import->getImportedCount(),
                'errors' => $import->getErrors(),
                'message' => $import->getImportedCount() . " étudiant(s) importé(s)"
            ]);

        } catch (\Exception $e) {
            Log::error('Import error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'import: ' . $e->getMessage(),
                'imported_count' => 0,
                'errors' => []
            ], 500);
        }
    }

    public function downloadTemplate()
    {
        try {
            $content = "first_name,last_name,date_of_birth,gender,student_code,class_id\n";
            $content .= "Ahmed,Benali,2010-05-12,male,STU001,1\n";
            $content .= "Fatima,Zahra,2011-08-20,female,STU002,1\n";

            return response($content, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="template_import_etudiants.csv"');
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement'
            ], 500);
        }
    }
}