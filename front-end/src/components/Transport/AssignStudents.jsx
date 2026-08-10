import { useState, useEffect } from 'react';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { transportService, studentService, classService } from '../../services/auth';
import { Users, Bus, Check, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignStudents() {
    const [selectedBus, setSelectedBus] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [search, setSearch] = useState('');

    // Fetch buses
    const { data: busesData, isLoading: busesLoading } = useApiQuery(
        ['admin-buses'],
        () => transportService.getBuses()
    );
    const buses = busesData?.data?.data || [];

    // Fetch classes
    const { data: classesData } = useApiQuery(
        ['admin-classes'],
        () => classService.getAll({ per_page: 100 })
    );
    const classes = classesData?.data?.data || [];

    // Fetch students
    const { data: studentsData, isLoading: studentsLoading, refetch } = useApiQuery(
        ['admin-students', { class_id: selectedClass, search }],
        () => studentService.getAll({ class_id: selectedClass, search, per_page: 100 })
    );
    const students = studentsData?.data?.data || [];

    // Mutation to assign students to bus
    const assignMutation = useApiMutation(
        (data) => transportService.assignStudentsToBus(data),
        {
            successMessage: 'Étudiants assignés au bus avec succès',
            onSuccess: () => {
                setSelectedStudents([]);
                setSelectedBus('');
                refetch();
            }
        }
    );

    const handleAssign = () => {
        if (!selectedBus) {
            toast.error('Veuillez sélectionner un bus');
            return;
        }
        if (selectedStudents.length === 0) {
            toast.error('Veuillez sélectionner au moins un étudiant');
            return;
        }

        assignMutation.mutate({
            bus_id: selectedBus,
            student_ids: selectedStudents,
        });
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigner des étudiants à un bus
                </h3>
                <p className="text-white/80 text-sm mt-1">
                    Sélectionnez un bus, puis choisissez les étudiants à assigner
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Panel - Configuration */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Bus className="w-4 h-4 text-rose-500" />
                        1. Sélection du bus
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bus *
                            </label>
                            <select
                                value={selectedBus}
                                onChange={(e) => setSelectedBus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">-- Sélectionner un bus --</option>
                                {buses.map(bus => (
                                    <option key={bus.id} value={bus.id}>
                                        {bus.name || bus.plate_number} - {bus.capacity} places ({bus.model || 'Modèle inconnu'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedBus && (
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-500">Bus sélectionné</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {buses.find(b => b.id == selectedBus)?.name || 'Bus'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Students Selection */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-rose-500" />
                        2. Sélection des étudiants
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filtrer par classe
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">Toutes les classes</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher un étudiant..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                            />
                        </div>

                        {studentsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                Aucun étudiant trouvé
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={selectAll}
                                        className="text-sm text-rose-500 hover:text-rose-600"
                                    >
                                        {selectedStudents.length === students.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                                    </button>
                                    <span className="text-xs text-gray-400">
                                        {selectedStudents.length} sélectionné(s)
                                    </span>
                                </div>
                                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-xl p-2">
                                    {students.map(student => (
                                        <label
                                            key={student.id}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => toggleStudent(student.id)}
                                                className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">
                                                    {student.first_name} {student.last_name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {student.class?.name} • {student.student_code}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => {
                        setSelectedBus('');
                        setSelectedStudents([]);
                        setSelectedClass('');
                    }}
                    className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                >
                    Réinitialiser
                </button>
                <button
                    onClick={handleAssign}
                    disabled={assignMutation.isPending || !selectedBus || selectedStudents.length === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-medium hover:scale-105 transition disabled:opacity-50"
                >
                    {assignMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    ) : (
                        <Check className="w-4 h-4 inline mr-2" />
                    )}
                    Assigner {selectedStudents.length} étudiant(s)
                </button>
            </div>

            {/* Info message */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700">
                    💡 Les étudiants assignés à un bus apparaîtront automatiquement dans le tableau de bord du chauffeur.
                </p>
            </div>
        </div>
    );
}