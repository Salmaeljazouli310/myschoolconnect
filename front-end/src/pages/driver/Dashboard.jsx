import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { transportService } from '../../services/auth';
import { 
  Bus, Users, Play, CheckCircle, Clock, RefreshCw, 
  User, AlertCircle, Calendar, Sun, Moon, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const { user, token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tripType, setTripType] = useState('morning');
  const [showTripForm, setShowTripForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busInfo, setBusInfo] = useState(null);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0 });

  // ✅ Charger les informations du bus
  const fetchBusInfo = useCallback(async () => {
    try {
      const response = await transportService.getMyBus();
      let busData = null;
      if (response?.data?.data) busData = response.data.data;
      else if (response?.data) busData = response.data;
      else if (response) busData = response;
      setBusInfo(busData);
    } catch (error) {
      console.error('Erreur chargement bus:', error);
    }
  }, []);

  // ✅ Charger les étudiants assignés
  const fetchStudents = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await transportService.getAssignedStudentsByClass();
      
      let studentsData = [];
      if (response?.data?.data) studentsData = response.data.data;
      else if (response?.data) studentsData = response.data;
      else if (Array.isArray(response)) studentsData = response;
      else if (response?.success && response?.data) studentsData = response.data;
      
      console.log('Étudiants chargés:', studentsData.length);
      setStudents(studentsData);
      
      const total = studentsData.length;
      const inProgress = studentsData.filter(s => s.today_trip_status === 'in_progress' || s.trip_status === 'in_progress').length;
      const completed = studentsData.filter(s => s.today_trip_status === 'completed' || s.trip_status === 'completed').length;
      setStats({ total, inProgress, completed });
      
    } catch (error) {
      console.error('Erreur chargement étudiants:', error);
      toast.error('Erreur de chargement des étudiants');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchBusInfo();
      fetchStudents();
    }
  }, [token, fetchBusInfo, fetchStudents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBusInfo(), fetchStudents()]);
    setRefreshing(false);
    toast.success('Données rafraîchies');
  };

  const handleStartTrip = (studentId) => {
    setSelectedStudentId(studentId);
    setShowTripForm(true);
  };

  const confirmStartTrip = async () => {
    if (!selectedStudentId) return;
    
    setSubmitting(true);
    try {
      const response = await transportService.startStudentTripWithDetails(selectedStudentId, { 
        date: selectedDate, 
        type: tripType 
      });
      
      if (response?.success) {
        toast.success('Trajet commencé !');
        await fetchStudents();
        setShowTripForm(false);
        setSelectedStudentId(null);
      } else {
        toast.error(response?.message || 'Erreur lors du démarrage');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du démarrage du trajet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndTrip = async (studentId) => {
    if (window.confirm('Terminer le trajet pour cet étudiant ? Les parents seront notifiés.')) {
      try {
        const response = await transportService.endStudentTrip(studentId);
        if (response?.success) {
          toast.success('Trajet terminé !');
          await fetchStudents();
        } else {
          toast.error(response?.message || 'Erreur lors de la fin');
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors de la fin du trajet');
      }
    }
  };

  const getStatusBadge = (student) => {
    const status = student.today_trip_status || student.trip_status || 'not_started';
    switch(status) {
      case 'in_progress':
      case 'started':
        return { color: 'bg-green-100 text-green-700', text: 'En route', icon: Play };
      case 'completed':
      case 'arrived':
        return { color: 'bg-blue-100 text-blue-700', text: 'Arrivé', icon: CheckCircle };
      default:
        return { color: 'bg-gray-100 text-gray-600', text: 'En attente', icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Bus className="w-7 h-7 text-pink-500" />
                Tableau de Bord Chauffeur
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Bienvenue, {user?.name} • {stats.total} étudiant(s) à prendre en charge
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/driver/profile" 
                className="flex items-center gap-2 px-3 py-2 bg-pink-100 rounded-xl text-pink-600 hover:bg-pink-200 transition"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Mon profil</span>
              </Link>
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition"
              >
                <RefreshCw className={`w-5 h-5 text-pink-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Cartes d'information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Carte du bus */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Bus className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Mon bus assigné</p>
                {busInfo ? (
                  <p className="font-semibold text-gray-800">{busInfo.plate_number}</p>
                ) : (
                  <p className="text-sm text-gray-500">Aucun bus assigné</p>
                )}
              </div>
              <Link to="/driver/bus" className="text-xs text-pink-500 hover:text-pink-600">
                Voir →
              </Link>
            </div>
          </div>

          {/* Carte de l'itinéraire */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Itinéraire du jour</p>
                <p className="font-semibold text-gray-800">Trajet programmé</p>
              </div>
              <Link to="/driver/route" className="text-xs text-purple-500 hover:text-purple-600">
                Voir →
              </Link>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm mb-6 border border-pink-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTripType('morning')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                  tripType === 'morning' 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sun className="w-4 h-4" /> Matin
              </button>
              <button
                onClick={() => setTripType('afternoon')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                  tripType === 'afternoon' 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Moon className="w-4 h-4" /> Après-midi
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-pink-100">
            <Users className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-500">Total étudiants</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-pink-100">
            <Play className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">En route</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-pink-100">
            <CheckCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Arrivés</p>
          </div>
        </div>

        {/* Liste des étudiants */}
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-pink-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun étudiant assigné</h3>
            <p className="text-gray-500 text-sm">Aucune classe n'est assignée à votre compte chauffeur.</p>
            <p className="text-xs text-gray-400 mt-2">Contactez l'administration pour assigner une classe.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => {
              const statusBadge = getStatusBadge(student);
              const StatusIcon = statusBadge.icon;
              const isInProgress = student.today_trip_status === 'in_progress' || student.trip_status === 'in_progress';
              const isCompleted = student.today_trip_status === 'completed' || student.trip_status === 'completed';
              
              return (
                <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                        {student.first_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">
                            {student.first_name} {student.last_name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full">
                            {student.class?.name || 'Classe'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Code: {student.student_code}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color} flex items-center gap-1 shadow-sm`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.text}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4 pt-3 border-t border-pink-100">
                      {!isCompleted && (
                        <>
                          {!isInProgress ? (
                            <button
                              onClick={() => handleStartTrip(student.id)}
                              disabled={submitting}
                              className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Play className="w-4 h-4" />
                              Démarrer le trajet
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEndTrip(student.id)}
                              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Terminer le trajet
                            </button>
                          )}
                        </>
                      )}
                      {isCompleted && (
                        <div className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-center text-sm flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Trajet terminé
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal pour démarrer le trajet */}
        {showTripForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Bus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Démarrer le trajet</h3>
                <p className="text-gray-500 text-sm mt-1">Confirmez les détails du trajet</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  <span className="text-gray-800">{new Date(selectedDate).toLocaleDateString('fr-FR')}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setTripType('morning')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                      tripType === 'morning' 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Matin
                  </button>
                  <button
                    onClick={() => setTripType('afternoon')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                      tripType === 'afternoon' 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Après-midi
                  </button>
                </div>
                
                <div className="bg-pink-50 rounded-xl p-3">
                  <p className="text-sm text-pink-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Les parents seront automatiquement notifiés.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTripForm(false);
                    setSelectedStudentId(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmStartTrip}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:scale-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Démarrage...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message d'information */}
        <div className="mt-6 bg-pink-50 rounded-xl p-4 border border-pink-200">
          <p className="text-sm text-pink-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Les parents seront notifiés à chaque étape du trajet (départ, arrivée à l'école, retour à la maison).
          </p>
        </div>
      </div>
    </div>
  );
}