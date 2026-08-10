import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { parentService, transportService } from '../../services/auth';
import { io } from 'socket.io-client';
import { 
  Bus, Bell, CheckCircle, AlertCircle, 
  Play, Calendar, User, Clock, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ParentTransport() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const pollingInterval = useRef(null);

  // Charger les enfants avec leur statut de trajet
  const fetchChildrenWithStatus = async () => {
    try {
      const response = await parentService.getMyChildren();
      
      let childrenData = [];
      if (response?.data?.data) {
        childrenData = response.data.data;
      } else if (response?.data) {
        childrenData = response.data;
      } else if (Array.isArray(response)) {
        childrenData = response;
      }
      
      // Pour chaque enfant, récupérer le statut du trajet du jour via la route parent
      for (const child of childrenData) {
        try {
          // ✅ Utiliser la nouvelle route parent
          const tripResponse = await parentService.getStudentTrip(child.id);
          
          const tripData = tripResponse?.data;
          
          child.today_trip_status = tripData?.status || 'not_started';
          child.trip_started_at = tripData?.started_at;
          child.trip_completed_at = tripData?.completed_at;
          child.trip = tripData;
        } catch (error) {
          console.error(`Erreur pour enfant ${child.id}:`, error);
          child.today_trip_status = 'not_started';
          child.trip = null;
        }
      }
      
      setChildren(childrenData);
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
    }
  };

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      const response = await transportService.getNotifications();
      const notificationsList = response?.data?.notifications?.data || [];
      const unread = response?.data?.unread_count || 0;
      
      setNotifications(notificationsList);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchChildrenWithStatus();
      await fetchNotifications();
      setLoading(false);
    };
    
    if (token) {
      loadData();
    }
  }, [token]);

  // Polling pour les mises à jour (toutes les 10 secondes)
  useEffect(() => {
    if (token) {
      pollingInterval.current = setInterval(() => {
        fetchChildrenWithStatus();
        fetchNotifications();
      }, 10000);
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [token]);

  // Socket.io pour les mises à jour en temps réel
  useEffect(() => {
    if (token && !socketRef.current) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
      
      socketRef.current = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Parent transport socket connected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.log('Socket connection error:', error);
      });

      socketRef.current.on('student-trip-update', (data) => {
        console.log('🚌 Real-time trip update:', data);
        toast.success(data.message);
        fetchChildrenWithStatus();
        fetchNotifications();
      });

      socketRef.current.on('trip-update', (data) => {
        console.log('📢 Trip update:', data);
        toast.info(data.body || 'Mise à jour du trajet');
        fetchChildrenWithStatus();
        fetchNotifications();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  const markAsRead = async (notificationId) => {
    try {
      await transportService.markNotificationRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await transportService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChildrenWithStatus();
    await fetchNotifications();
    setRefreshing(false);
    toast.success('Données rafraîchies');
  };

  const getTripStatusBadge = (status) => {
    switch(status) {
      case 'in_progress':
        return { color: 'bg-green-100 text-green-700', text: 'En route', icon: Play };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-700', text: 'Arrivé', icon: CheckCircle };
      default:
        return { color: 'bg-gray-100 text-gray-600', text: 'En attente', icon: Clock };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'trip_started':
        return <Play className="w-5 h-5 text-green-500" />;
      case 'trip_completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                <Bus className="w-6 h-6 text-pink-500" />
                Transport Scolaire
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Suivez les trajets de vos enfants en temps réel
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition"
              >
                <RefreshCw className={`w-4 h-4 text-pink-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold shadow-md">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Children Section */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Bus className="w-4 h-4 text-pink-500" />
            Mes enfants ({children.length})
          </h2>
          
          {children.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-pink-100">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun enfant</p>
              <p className="text-xs text-gray-400 mt-1">Aucun enfant n'est lié à votre compte parent.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map(child => {
                const statusBadge = getTripStatusBadge(child.today_trip_status || 'not_started');
                const StatusIcon = statusBadge.icon;
                
                return (
                  <div 
                    key={child.id} 
                    className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedChild(child)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                        {child.first_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {child.first_name} {child.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">{child.class?.name}</p>
                        {child.trip_started_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Départ: {new Date(child.trip_started_at).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-pink-500" />
              <h2 className="font-semibold text-gray-800">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                  {unreadCount} non lue(s)
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-pink-500 hover:text-pink-600"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          
          <div className="divide-y divide-pink-100 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Aucune notification</p>
                <p className="text-xs text-gray-300 mt-1">Les notifications apparaîtront ici</p>
              </div>
            ) : (
              notifications.map(notif => {
                let notifData = {};
                try {
                  if (notif.data) {
                    notifData = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
                  }
                } catch(e) {}
                
                const isUnread = !notif.is_read;
                
                return (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition cursor-pointer ${isUnread ? 'bg-pink-50/50' : 'hover:bg-gray-50'}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notif.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{notif.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(notif.created_at)}
                          </span>
                          {notifData.driver_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {notifData.driver_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Le statut des trajets se met à jour automatiquement toutes les 10 secondes.
          </p>
        </div>
      </div>

      {/* Child Details Modal */}
      {showDetails && selectedChild && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowDetails(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-xl font-bold">
                  {selectedChild.first_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedChild.first_name} {selectedChild.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedChild.class?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-full">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Statut du trajet</span>
                  <span className="text-sm font-medium text-pink-600">
                    {selectedChild.today_trip_status === 'in_progress' ? 'En route' : 
                     selectedChild.today_trip_status === 'completed' ? 'Arrivé' : 'En attente'}
                  </span>
                </div>
                {selectedChild.trip_started_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Heure de départ</span>
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(selectedChild.trip_started_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {selectedChild.trip_completed_at && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">Heure d'arrivée</span>
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(selectedChild.trip_completed_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  💡 Le chauffeur peut démarrer/terminer le trajet depuis son application.
                  Les notifications apparaîtront ici en temps réel.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}