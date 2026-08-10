import { NavLink } from 'react-router-dom';
import { Home, Users, Bus, MessageCircle, LogOut } from 'lucide-react';

// Add to navigation items:
const NAV_ITEMS = [
  { path: '/parent', label: 'Dashboard', icon: Home },
  { path: '/parent/children', label: 'Mes Enfants', icon: Users },
  { path: '/parent/transport', label: 'Transport', icon: Bus },
  { path: '/messages', label: 'Messages', icon: MessageCircle }, // Add this
];