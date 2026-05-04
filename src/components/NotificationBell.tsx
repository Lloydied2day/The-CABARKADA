import { useState, useEffect } from "react";
import { Bell, Info, CheckCircle2, Calendar, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'event_reminder' | 'registration_success';
  is_read: number;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.id !== 0) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/notifications`);
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const clearAll = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/notifications`, { method: "DELETE" });
      if (response.ok) {
        setNotifications([]);
        toast.success("Notifications cleared");
      }
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'registration_success': return <CheckCircle2 size={16} className="text-brand-green" />;
      case 'event_reminder': return <Calendar size={16} className="text-brand-red" />;
      default: return <Info size={16} className="text-brand-blue" />;
    }
  };

  if (!user || user.id === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:text-brand-blue hover:bg-slate-100 transition-all"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-brand-red text-white border-2 border-white rounded-full text-[10px] font-black">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </motion.button>
      } />
      <DropdownMenuContent align="end" className="w-[380px] rounded-[2rem] p-0 shadow-2xl border-none mt-2 overflow-hidden bg-white">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-lg">Notifications</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Updates for {user.firstName}
            </p>
          </div>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-red hover:bg-brand-red/5 rounded-lg gap-1.5"
            >
              <Trash2 size={12} /> Clear All
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {notifications.map((n) => (
                  <motion.div 
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => markAsRead(n.id)}
                    className={`p-5 flex gap-4 cursor-pointer transition-all hover:bg-slate-50 group relative ${n.is_read ? 'opacity-60' : 'bg-brand-blue/[0.02]'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === 'registration_success' ? 'bg-brand-green/10' : 
                      n.type === 'event_reminder' ? 'bg-brand-red/10' : 'bg-brand-blue/10'
                    }`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="space-y-1 pr-4">
                      <p className={`text-sm leading-tight ${n.is_read ? 'font-bold text-slate-600' : 'font-black text-slate-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 leading-normal">{n.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-brand-blue" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                <Bell size={32} />
              </div>
              <p className="font-bold text-slate-400 text-sm">No notifications yet.</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
