import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { userService, transportService } from '../../services/auth';
import { 
  User, Mail, Phone, Bus, Calendar, 
  Edit2, Save, X, Camera, CheckCircle, AlertCircle,
  UserCircle, Clock, Shield, TrendingUp, Award, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverProfile() {
  const { user, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // ✅ Correction des appels API avec gestion de la structure de réponse
  const { data: busResponse, isLoading: busLoading } = useApiQuery(
    ['driver-bus'],
    () => transportService.getMyBus(),
    { enabled: !!token }
  );
  
  const { data: tripsResponse } = useApiQuery(
    ['driver-trips-stats'],
    () => transportService.getDriverTrips({ per_page: 100 }),
    { enabled: !!token }
  );

  const { data: studentsResponse } = useApiQuery(
    ['driver-assigned-students'],
    () => transportService.getAssignedStudents(),
    { enabled: !!token }
  );

  const { data: completedResponse } = useApiQuery(
    ['driver-completed-trips'],
    () => transportService.getDriverTrips({ status: 'completed', per_page: 100 }),
    { enabled: !!token }
  );

  const { data: inProgressResponse } = useApiQuery(
    ['driver-inprogress-trips'],
    () => transportService.getDriverTrips({ status: 'in_progress', per_page: 100 }),
    { enabled: !!token }
  );

  // ✅ Extraction correcte des données
  const bus = busResponse?.data?.data || busResponse?.data || busResponse || null;
  const trips = tripsResponse?.data?.data || tripsResponse?.data || tripsResponse || [];
  const students = studentsResponse?.data?.data || studentsResponse?.data || studentsResponse || [];
  const completedTrips = completedResponse?.data?.data || completedResponse?.data || completedResponse || [];
  const inProgressTrips = inProgressResponse?.data?.data || inProgressResponse?.data || inProgressResponse || [];

  // Calcul des statistiques
  const totalTrips = trips.length;
  const totalCompleted = completedTrips.length;
  const totalInProgress = inProgressTrips.length;
  const totalStudents = students.length;
  
  const todayTrips = trips.filter(trip => {
    if (!trip.created_at) return false;
    const tripDate = new Date(trip.created_at).toDateString();
    const today = new Date().toDateString();
    return tripDate === today;
  }).length;

  // Mise à jour du profil
  const updateProfileMutation = useApiMutation(
    (data) => userService.update(user?.id, data),
    {
      successMessage: 'Profil mis à jour avec succès',
      onSuccess: () => {
        setIsEditing(false);
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage'));
      }
    }
  );

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Le nom est requis');
      return;
    }
    if (!formData.email) {
      toast.error('L\'email est requis');
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    const avatarFormData = new FormData();
    avatarFormData.append('avatar', file);
    
    setUploading(true);
    try {
      const response = await userService.updateAvatar(avatarFormData);
      if (response.success) {
        toast.success('Photo de profil mise à jour');
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur avatar:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getMemberSince = () => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Date non disponible';
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatar) {
      if (user.avatar.startsWith('http')) return user.avatar;
      return `http://localhost:8000/storage/${user.avatar}`;
    }
    return null;
  };

  if (busLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <User className="w-7 h-7 text-pink-500" />
                Mon Profil
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gérez vos informations personnelles
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-pink-100 rounded-full hover:bg-pink-200 transition"
              >
                <Edit2 className="w-5 h-5 text-pink-600" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition"
                >
                  <Save className="w-5 h-5 text-green-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-pink-500 to-purple-600 relative">
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()}
                      alt={user?.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                      {getInitials(user?.name)}
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-16 pb-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="+212 6XX XXX XXX"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="w-4 h-4 text-pink-500" />
                        {user?.email}
                      </p>
                      {user?.phone && (
                        <p className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-4 h-4 text-pink-500" />
                          {user?.phone}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                  <Shield className="w-4 h-4" />
                  Chauffeur
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Actif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalTrips}</p>
                <p className="text-sm text-gray-500">Trajets total</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalCompleted}</p>
                <p className="text-sm text-gray-500">Terminés</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalInProgress}</p>
                <p className="text-sm text-gray-500">En cours</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
                <p className="text-sm text-gray-500">Étudiants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Bus Information */}
        {bus ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bus className="w-5 h-5" />
                Mon Bus Assigné
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Bus className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Immatriculation</p>
                    <p className="text-lg font-bold text-gray-800">{bus.plate_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Modèle</p>
                    <p className="text-lg font-bold text-gray-800">{bus.model || 'Non spécifié'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Capacité</p>
                    <p className="text-lg font-bold text-gray-800">{bus.capacity} places</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigné depuis</p>
                    <p className="text-lg font-bold text-gray-800">
                      {bus.created_at ? new Date(bus.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bus className="w-5 h-5" />
                Mon Bus Assigné
              </h2>
            </div>
            <div className="p-6 text-center">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun bus assigné pour le moment</p>
              <p className="text-xs text-gray-400 mt-1">Contactez l'administration</p>
            </div>
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-gray-600" />
              Informations du compte
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Rôle</span>
              <span className="font-medium text-gray-800">Chauffeur scolaire</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Statut du compte</span>
              <span className="inline-flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Actif
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Membre depuis</span>
              <span className="font-medium text-gray-800">{getMemberSince()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Trajets aujourd'hui</span>
              <span className="font-medium text-gray-800">{todayTrips}</span>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-6 bg-pink-50 rounded-xl p-4 border border-pink-200">
          <p className="text-sm text-pink-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Pour toute modification de vos informations personnelles, veuillez contacter l'administration.
          </p>
        </div>
      </div>
    </div>
  );
}