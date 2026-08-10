import { useApiQuery } from '../../hooks/useApi';
import { transportService } from '../../services/auth';
import { Users, Bus, Play, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { useState } from 'react';

export default function StudentTracking() {
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    
    const { data: studentsData, isLoading, refetch } = useApiQuery(
        ['all-students-tracking'],
        () => transportService.getAllStudentsTracking()
    );

    const students = studentsData?.data || [];

    const filteredStudents = students.filter(s => {
        const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
        const matchesClass = filterClass ? s.class?.name === filterClass : true;
        return matchesSearch && matchesClass;
    });

    const uniqueClasses = [...new Set(students.map(s => s.class?.name).filter(Boolean))];

    const getStatusBadge = (status) => {
        switch(status) {
            case 'in_progress':
                return { color: 'bg-green-100 text-green-700', text: 'En route', icon: Play };
            case 'completed':
                return { color: 'bg-blue-100 text-blue-700', text: 'Arrivé', icon: CheckCircle };
            default:
                return { color: 'bg-gray-100 text-gray-600', text: 'En attente', icon: Clock };
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    Suivi des Trajets Scolaires
                </h2>
                <p className="text-sm text-purple-500 mt-1">
                    Visualisez l'état des trajets de tous les étudiants
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un étudiant..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                >
                    <option value="">Toutes les classes</option>
                    {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Étudiants</p>
                            <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-pink-400" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">En Route</p>
                            <p className="text-2xl font-bold text-green-600">
                                {students.filter(s => s.trip_status === 'in_progress').length}
                            </p>
                        </div>
                        <Play className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Arrivés</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {students.filter(s => s.trip_status === 'completed').length}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Étudiant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parents</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chauffeur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        Chargement...
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        Aucun étudiant trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const statusBadge = getStatusBadge(student.trip_status);
                                    const StatusIcon = statusBadge.icon;
                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
                                                        {student.first_name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{student.student_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{student.class?.name || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {student.parents?.map(parent => (
                                                        <span key={parent.id} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                                            {parent.name}
                                                        </span>
                                                    ))}
                                                    {(!student.parents || student.parents.length === 0) && (
                                                        <span className="text-xs text-gray-400">Aucun parent</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{student.driver_name || 'Non assigné'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusBadge.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}