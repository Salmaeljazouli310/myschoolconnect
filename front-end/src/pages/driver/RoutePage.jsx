import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { transportService } from '../../services/auth';
import { MapPin, Bus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverRoutePage() {
  const { token } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await transportService.getMyRoute();
        
        let routeData = null;
        if (response?.data?.data) routeData = response.data.data;
        else if (response?.data) routeData = response.data;
        else if (response) routeData = response;
        
        setRoute(routeData);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoute();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen p-6">
        <div className="bg-white rounded-2xl p-8 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">Aucun itinéraire</h3>
          <p className="text-gray-500 text-sm">Aucun itinéraire n'est assigné à votre bus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-pink-500" />
            Mon Itinéraire
          </h1>
          <p className="text-gray-500 mt-1">{route.name}</p>
        </div>

        {/* Carte de l'itinéraire */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bus className="w-5 h-5" />
              {route.name}
            </h2>
          </div>
          
          <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              📍 Arrêts ({route.stops?.length || 0})
            </h3>
            
            {route.stops && route.stops.length > 0 ? (
              <div className="space-y-0">
                {route.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-start gap-4 p-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-semibold">
                        {index + 1}
                      </div>
                      {index < route.stops.length - 1 && (
                        <div className="w-px h-6 bg-pink-200 my-1"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{stop.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                Aucun arrêt défini
              </div>
            )}
          </div>
        </div>

        {/* Message info */}
        <div className="mt-6 bg-pink-50 rounded-xl p-4 text-center">
          <p className="text-sm text-pink-600">
            📢 Les parents seront notifiés à chaque arrêt
          </p>
        </div>
      </div>
    </div>
  );
}