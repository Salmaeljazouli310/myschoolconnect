import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from 'lucide-react';

// ✅ ADD THIS DEBUG LOG
console.log('✅ ImportStudents component loaded!');

const ImportStudents = () => {
    console.log('✅ ImportStudents rendering!');
    
    const [file, setFile] = useState(null);
    const [classId, setClassId] = useState('');
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        console.log('✅ ImportStudents useEffect running!');
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            console.log('🔄 Loading classes...');
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:8000/api/v1/admin/classes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            console.log('📚 Classes loaded:', data);
            setClasses(data?.data?.data || []);
        } catch (error) {
            console.error('❌ Erreur:', error);
            toast.error('Erreur lors du chargement des classes');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        console.log('📁 File selected:', selectedFile);
        if (selectedFile) {
            const extension = selectedFile.name.split('.').pop().toLowerCase();
            if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
                setFile(selectedFile);
                setResult(null);
                toast.success(`Fichier sélectionné: ${selectedFile.name}`);
            } else {
                toast.error('Format non supporté. Utilisez .csv, .xlsx ou .xls');
                e.target.value = '';
            }
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        console.log('🔄 Starting import...');
        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('file', file);
            if (classId) formData.append('class_id', classId);

            console.log('📤 Sending import request...');
            const response = await fetch('http://localhost:8000/api/v1/admin/students/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            console.log('📥 Import response:', data);
            
            if (response.ok && data.success) {
                setResult({
                    success: true,
                    importedCount: data.imported_count || 0,
                    errors: data.errors || []
                });
                toast.success(`${data.imported_count} étudiants importés !`);
                setFile(null);
                document.getElementById('file-input').value = '';
            } else {
                throw new Error(data.message || 'Erreur lors de l\'import');
            }
        } catch (error) {
            console.error('❌ Import error:', error);
            setResult({
                success: false,
                message: error.message || 'Erreur lors de l\'import',
                errors: []
            });
            toast.error(error.message);
        } finally {
            setLoading(false);
            console.log('✅ Import finished');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            console.log('📥 Downloading template...');
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:8000/api/v1/admin/students/template', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_import_etudiants.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Template téléchargé!');
            console.log('✅ Template downloaded');
        } catch (error) {
            console.error('❌ Template download error:', error);
            toast.error('Erreur lors du téléchargement du template');
        }
    };

    return (
        <div className="py-6">
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                        Importer des étudiants
                    </h1>
                    <p className="text-gray-600">Fichiers CSV ou Excel acceptés</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-rose-50 to-purple-50">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-rose-500" />
                            Importer
                        </h2>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fichier *
                            </label>
                            <input
                                id="file-input"
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                            />
                            {file && (
                                <p className="text-sm text-green-600 mt-1">
                                    ✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Classe (optionnelle)
                            </label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                            >
                                <option value="">-- Sélectionner une classe --</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                            {classes.length === 0 && (
                                <p className="text-sm text-amber-600 mt-1">
                                    ⚠️ Aucune classe disponible. Veuillez d'abord créer des classes.
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className={`w-full py-2.5 rounded-lg font-medium transition
                                ${!file || loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:scale-105 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Import en cours...
                                </span>
                            ) : (
                                'Importer'
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={handleDownloadTemplate}
                        className="text-rose-500 hover:text-rose-600 text-sm font-medium transition flex items-center justify-center gap-1 mx-auto"
                    >
                        <Download className="w-4 h-4" />
                        Télécharger le modèle
                    </button>
                </div>

                {result && (
                    <div className={`mt-6 p-4 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {result.success 
                                        ? `✅ ${result.importedCount} étudiant(s) importé(s) avec succès`
                                        : `❌ ${result.message}`}
                                </p>
                                {result.errors && result.errors.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-red-600 font-medium">Erreurs:</p>
                                        <ul className="text-sm text-red-500 list-disc list-inside">
                                            {result.errors.map((err, index) => (
                                                <li key={index}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-start gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>
                            <strong>Format du fichier:</strong> Le fichier doit contenir les colonnes suivantes:
                            <br />
                            <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                                first_name, last_name, date_of_birth, gender, student_code, class_id
                            </code>
                            <br />
                            <span className="text-xs text-blue-600">* date_of_birth format: YYYY-MM-DD</span>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ImportStudents;