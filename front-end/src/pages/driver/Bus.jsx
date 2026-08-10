import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { transportService } from '../../services/auth';
import { Bus, Users, Wrench, Calendar, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverBus() {
  const { token } = useAuth();
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBus = async () => {
      if (!token) {
        console.log('Pas de token, chargement annulé');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Appel API: getMyBus()');
        const response = await transportService.getMyBus();
        console.log('Réponse brute:', response);
        
        // ✅ Gestion multiple des formats de réponse
        let busData = null;
        
        if (response?.data?.data) {
          busData = response.data.data;
        } else if (response?.data) {
          busData = response.data;
        } else if (response?.success && response?.data) {
          busData = response.data;
        } else if (response && typeof response === 'object' && !response.success) {
          busData = response;
        }
        
        console.log('Bus extrait:', busData);
        setBus(busData);
        
        if (!busData) {
          console.log('Aucune donnée bus trouvée');
        }
      } catch (error) {
        console.error('Erreur chargement bus:', error);
        setError(error.message || 'Erreur de chargement');
        toast.error('Impossible de charger les informations du bus');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBus();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-red-200">
            <Bus className="w-16 h-16 text-red-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-pink-100">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun bus assigné</h3>
            <p className="text-gray-500 text-sm">Vous n'avez pas encore de bus assigné.</p>
            <p className="text-xs text-gray-400 mt-2">Contactez l'administration pour obtenir un bus.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Bus className="w-6 h-6 text-pink-500" />
            Mon Bus
          </h1>
          <p className="text-gray-500 mt-1">Détails de votre véhicule assigné</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">{bus.name || 'Bus scolaire'}</h2>
            <p className="text-pink-100 text-sm">Immatriculation: {bus.plate_number}</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacité</p>
                  <p className="text-xl font-bold text-gray-800">{bus.capacity} places</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Modèle</p>
                  <p className="text-xl font-bold text-gray-800">{bus.model || 'Non spécifié'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bus.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {bus.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Actif
                      </>
                    ) : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Assigné depuis</p>
                <p className="text-sm font-medium text-gray-700">
                  {bus.created_at ? new Date(bus.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-pink-50 rounded-xl p-4 border border-pink-200">
          <p className="text-sm text-pink-700">
            💡 Pour toute question concernant votre bus, veuillez contacter l'administration scolaire.
          </p>
        </div>
      </div>
    </div>
  );
}