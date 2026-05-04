import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  ImagePlus,
  Upload,
  Users, 
  Calendar, 
  TrendingUp, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  Edit2, 
  Trash2, 
  Search,
  X,
  CheckCircle2,
  Megaphone,
  UserCheck,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  BarChart3,
  FileText,
  ShieldCheck,
  CalendarDays,
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Filter,
  History,
  Database as DatabaseIcon,
  HardDrive
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { useAuth } from "@/src/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import { toast } from "sonner";

const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM",
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

// Initial mock data for events
const INITIAL_EVENTS = [
  {
    id: 1,
    title: "New Cabalan Youth Basketball Open",
    category: "sports",
    date: "2026-04-15",
    time: "8:00 AM - 5:00 PM",
    location: "New Cabalan Covered Court",
    organizer: "SK New Cabalan",
    description: "Annual basketball tournament for youth aged 15-24.",
    image: "https://picsum.photos/seed/basketball/800/400",
    attendees: 45,
    registrations: 52,
    status: "Active"
  },
  {
    id: 2,
    title: "Community Clean-up Drive",
    category: "volunteer",
    date: "2026-04-20",
    time: "6:00 AM - 10:00 AM",
    location: "Barangay Hall Grounds",
    organizer: "Barangay Council",
    description: "Join us in keeping our barangay clean and green.",
    image: "https://picsum.photos/seed/cleanup/800/400",
    attendees: 28,
    registrations: 35,
    status: "Active"
  }
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "events" | "members" | "organizers" | "reports" | "calendar" | "settings" | "audit" | "system">("dashboard");
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [newCategory, setNewCategory] = useState("");

  const [selectedEventForManagement, setSelectedEventForManagement] = useState<any>(null);
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [eventAnnouncements, setEventAnnouncements] = useState<any[]>([]);
  const [announcementFormData, setAnnouncementFormData] = useState({ title: "", message: "" });
  const [managingTab, setManagingTab] = useState<"participants" | "announcements">("participants");

  const [formData, setFormData] = useState({
    title: "",
    category: "sports",
    date: "",
    time: "",
    location: "",
    description: "",
    status: "Active",
    capacity: 100,
    images: ["https://picsum.photos/seed/newevent/800/400"]
  });

  const [adminFormData, setAdminFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminType: "Youth Organizer",
    organizationName: ""
  });

  useEffect(() => {
    fetchEvents();
    fetchMembers();
    
    const isHigherAdmin = user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin";
    
    if (isHigherAdmin) {
      fetchAdmins();
      fetchReports();
    }
    
    if (user?.adminType === "System Admin") {
      fetchAuditLogs();
      fetchSystemSettings();
    }
  }, [user]);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch("/api/system/audit-logs");
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs");
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/system/settings");
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings");
    }
  };

  const handleUpdateCategories = async (categories: string[]) => {
    try {
      const response = await fetch("/api/system/settings/event_categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: categories }),
      });
      if (response.ok) {
        toast.success("Categories updated");
        fetchSystemSettings();
      }
    } catch (error) {
      toast.error("Failed to update categories");
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch("/api/system/backup", { method: "POST" });
      if (response.ok) {
        toast.success("Backup successful");
      }
    } catch (error) {
      toast.error("Backup failed");
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports/engagement");
      if (response.ok) {
        const data = await response.json();
        setReportsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports");
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error("Failed to fetch admins");
    }
  };

  const handleSaveAdmin = async () => {
    if (adminFormData.password !== adminFormData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const url = editingAdmin ? `/api/admins/${editingAdmin.id}` : "/api/admins";
    const method = editingAdmin ? "PUT" : "POST";
    
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...adminFormData, creatorId: user.id }),
      });

      if (response.ok) {
        fetchAdmins();
        setIsAdminModalOpen(false);
        setEditingAdmin(null);
        toast.success(editingAdmin ? "Organizer updated" : "Organizer created");
        setAdminFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          adminType: "Youth Organizer",
          organizationName: ""
        });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save organizer");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<{id: number, name: string} | null>(null);

  const confirmDeleteAdmin = (admin: any) => {
    setAdminToDelete({ id: admin.id, name: `${admin.first_name} ${admin.last_name}` });
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      const response = await fetch(`/api/admins/${adminToDelete.id}?adminId=${user.id}`, { method: "DELETE" });
      if (response.ok) {
        fetchAdmins();
        toast.success("Organizer removed");
        setIsDeleteConfirmOpen(false);
        setAdminToDelete(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove organizer");
      }
    } catch (error) {
      toast.error("Failed to delete admin");
    }
  };

  const handleUpdateAdminStatus = async (adminId: number, status: string) => {
    try {
      const response = await fetch(`/api/admins/${adminId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminId: user.id }),
      });

      if (response.ok) {
        toast.success(`Admin account ${status.toLowerCase()}`);
        fetchAdmins();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events?limit=100");
      const data = await response.json();
      if (response.ok) {
        setEvents(Array.isArray(data) ? data : (data.events || []));
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        // Map database fields to camelCase and filter members
        const mapped = Array.isArray(data) ? data.map((m: any) => ({
          ...m,
          firstName: m.first_name || m.firstName,
          lastName: m.last_name || m.lastName,
          mobileNumber: m.mobile_number || m.mobileNumber,
          barangay: m.barangay
        })) : [];
        setMembers(mapped.filter((m: any) => (m.role || 'member') === 'member'));
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const handleToggleEventStatus = async (eventId: number, currentStatus: string) => {
    const statuses = ["Draft", "Active", "Completed", "Cancelled"];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminId: user.id }),
      });
      if (response.ok) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: nextStatus } : e));
        toast.success(`Event marked as ${nextStatus}`);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm("Are you sure you want to remove this member? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/users/${memberId}`, { method: "DELETE" });
      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast.success("Member removed successfully");
      }
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  // Filter events based on role
  const isSuperAdmin = user.adminType === "SK Official" || user.adminType === "Barangay Admin" || user.adminType === "System Admin";
  const filteredEvents = isSuperAdmin 
    ? events 
    : events.filter((e: any) => e.organizer_id === user.id);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSave = async () => {
    const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
    const method = editingEvent ? "PUT" : "POST";
    
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: JSON.stringify(formData.images),
          organizerId: user.id,
          organizerType: user.adminType,
          organizerName: user.organizationName,
          adminId: user.id
        }),
      });

      if (response.ok) {
        fetchEvents();
        setIsModalOpen(false);
        setEditingEvent(null);
        toast.success(editingEvent ? "Event updated" : "Event created");
        setFormData({
          title: "",
          category: "sports",
          date: "",
          time: "",
          location: "",
          description: "",
          status: "Active",
          capacity: 100,
          images: ["https://picsum.photos/seed/newevent/800/400"]
        });
      } else {
        toast.error("Failed to save event");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newImages = [...formData.images];
      newImages[index] = base64String;
      setFormData({ ...formData, images: newImages });
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      category: event.category,
      date: event.event_date,
      time: event.event_time,
      location: event.location,
      description: event.description,
      status: event.status || "Active",
      capacity: event.capacity || 100,
      images: event.image_url ? (event.image_url.startsWith('[') ? JSON.parse(event.image_url) : [event.image_url]) : [event.image]
    });
    setIsModalOpen(true);
  };

  const handleManageEvent = async (event: any) => {
    setSelectedEventForManagement(event);
    setManagingTab("participants");
    fetchEventParticipants(event.id);
    fetchEventAnnouncements(event.id);
  };

  const fetchEventParticipants = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/members`);
      if (response.ok) {
        const data = await response.json();
        setEventParticipants(data);
      }
    } catch (error) {
      console.error("Failed to fetch participants");
    }
  };

  const fetchEventAnnouncements = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/announcements`);
      if (response.ok) {
        const data = await response.json();
        setEventAnnouncements(data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements");
    }
  };

  const handleUpdateAttendance = async (userId: number, status: string) => {
    if (!selectedEventForManagement) return;
    try {
      const response = await fetch(`/api/events/${selectedEventForManagement.id}/members/${userId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminId: user.id }),
      });
      if (response.ok) {
        setEventParticipants(prev => prev.map(p => p.id === userId ? { ...p, attendance_status: status } : p));
        toast.success(`Attendance marked as ${status}`);
      }
    } catch (error) {
      toast.error("Failed to update attendance");
    }
  };

  const handlePostAnnouncement = async () => {
    if (!selectedEventForManagement || !announcementFormData.title || !announcementFormData.message) {
      toast.error("Please fill in both title and message");
      return;
    }
    try {
      const response = await fetch(`/api/events/${selectedEventForManagement.id}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcementFormData),
      });
      if (response.ok) {
        toast.success("Announcement posted & notifications sent!");
        setAnnouncementFormData({ title: "", message: "" });
        fetchEventAnnouncements(selectedEventForManagement.id);
      }
    } catch (error) {
      toast.error("Failed to post announcement");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/events/${id}?adminId=${user.id}`, { method: "DELETE" });
      if (response.ok) {
        fetchEvents();
        toast.success("Event deleted");
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const totalParticipants = filteredEvents.reduce((acc, curr) => acc + (curr.attendees || 0), 0);
  const totalRegistrations = filteredEvents.reduce((acc, curr) => acc + (curr.registrations || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-8">
          <div className="flex items-baseline font-black text-2xl tracking-tighter mb-10">
            <span className="text-brand-green">C</span>
            <span className="text-brand-red">A</span>
            <span className="text-white">B</span>
            <span className="text-brand-blue">Admin</span>
          </div>

          <nav className="space-y-2">
            {(user?.adminType === "Youth Organizer" || user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("dashboard")}
                className={`w-full justify-start gap-3 rounded-xl ${activeTab === "dashboard" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
              >
                <LayoutDashboard size={20} /> Dashboard
              </Button>
            )}
            
            {(user?.adminType === "Youth Organizer" || user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("events")}
                className={`w-full justify-start gap-3 rounded-xl ${activeTab === "events" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
              >
                <Calendar size={20} /> Event Management
              </Button>
            )}

            {(user?.adminType === "Youth Organizer" || user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("calendar")}
                className={`w-full justify-start gap-3 rounded-xl ${activeTab === "calendar" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
              >
                <CalendarDays size={20} /> Calendar
              </Button>
            )}

            {(user?.adminType === "Youth Organizer" || user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("members")}
                className={`w-full justify-start gap-3 rounded-xl ${activeTab === "members" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
              >
                <Users size={20} /> User Management
              </Button>
            )}

            {(user?.adminType === "Youth Organizer" || user?.adminType === "SK Official" || user?.adminType === "System Admin") && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("organizers")}
                className={`w-full justify-start gap-3 rounded-xl ${activeTab === "organizers" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
              >
                <ShieldCheck size={20} /> Youth Organizer / SK Official
              </Button>
            )}

            {(user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("reports")}
                className={`w-full justify-start gap-3 rounded-xl ${activeTab === "reports" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
              >
                <BarChart3 size={20} /> Program Reports
              </Button>
            )}

            {user?.adminType === "System Admin" && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab("audit")}
                  className={`w-full justify-start gap-3 rounded-xl ${activeTab === "audit" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
                >
                  <History size={20} /> Audit Logs
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab("system")}
                  className={`w-full justify-start gap-3 rounded-xl ${activeTab === "system" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
                >
                  <DatabaseIcon size={20} /> System Config
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("settings")}
              className={`w-full justify-start gap-3 rounded-xl ${activeTab === "settings" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
            >
              <Settings size={20} /> Settings
            </Button>
          </nav>
        </div>

        <div className="mt-auto p-8">
          <div className="mb-6 p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Logged in as</p>
            <p className="font-bold text-white truncate">{user.organizationName}</p>
            <Badge className="mt-2 bg-brand-blue/10 text-brand-blue border-none">{user.adminType}</Badge>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={20} /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight capitalize">
              {activeTab} <span className="text-brand-blue">Portal</span>
            </h1>
            <p className="text-slate-400 mt-1">
              {activeTab === "dashboard" && `Welcome back, ${user.firstName}. Here's what's happening.`}
              {activeTab === "events" && "Manage and organize your community activities."}
              {activeTab === "members" && "View and manage registered youth members."}
              {activeTab === "organizers" && "View and manage Youth Organizers and SK Officials."}
              {activeTab === "reports" && "Visual evaluation of youth engagement and participation."}
              {activeTab === "calendar" && "Centralized schedule of all youth programs."}
              {activeTab === "audit" && "Track administrative actions and system events for accountability."}
              {activeTab === "system" && "Manage system-wide configurations, categories, and maintenance."}
              {activeTab === "settings" && "Configure your administrative preferences."}
            </p>
          </div>
          {(activeTab === "dashboard" || activeTab === "events") && (
            <Button 
              onClick={() => {
                setEditingEvent(null);
                setFormData({
                  title: "",
                  category: "sports",
                  date: "",
                  time: "",
                  location: "",
                  description: "",
                  status: "Active",
                  capacity: 100,
                  images: ["https://picsum.photos/seed/newevent/800/400"]
                });
                setIsModalOpen(true);
              }}
              className="bg-brand-blue hover:bg-brand-dark-blue h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-brand-blue/20"
            >
              <Plus size={20} /> Create New Event
            </Button>
          )}
          {user?.adminType === "System Admin" && activeTab === "organizers" && (
            <Button 
               onClick={() => {
                setEditingAdmin(null);
                setAdminFormData({
                  firstName: "",
                  lastName: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                  adminType: "Youth Organizer",
                  organizationName: ""
                });
                setIsAdminModalOpen(true);
              }}
              className="bg-brand-green hover:bg-brand-dark-green h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-brand-green/20"
            >
              <Plus size={20} /> Add Organizer
            </Button>
          )}
        </header>

        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Participants</p>
                <p className="text-3xl font-black text-white">{totalParticipants}</p>
              </Card>
              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Registrations</p>
                <p className="text-3xl font-black text-white">{totalRegistrations}</p>
              </Card>
              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Events</p>
                <p className="text-3xl font-black text-white">{filteredEvents.length}</p>
              </Card>
              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Youth Members</p>
                <p className="text-3xl font-black text-white">{members.length}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
                <CardTitle className="text-xl font-black text-white mb-8 flex items-center gap-2">
                  <TrendingUp className="text-brand-blue" /> Registration Trends
                </CardTitle>
                <div className="h-64">
                   {reportsData?.registrationsTrend ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={reportsData.registrationsTrend}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                         <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => format(parseISO(val), 'MMM d')} />
                         <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                         <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                         <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                       </LineChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="h-full flex items-center justify-center text-slate-600 font-bold">No trend data available</div>
                   )}
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
                <CardTitle className="text-xl font-black text-white mb-8 flex items-center gap-2">
                  <Filter className="text-brand-green" /> Engagement by Category
                </CardTitle>
                <div className="h-64">
                  {reportsData?.participationByCategory ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportsData.participationByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} cursor={{ fill: '#1e293b' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 font-bold">No categorical data available</div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800 p-8">
                <CardTitle className="text-xl font-black text-white">Recent Activity Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800">
                  {filteredEvents.length > 0 ? filteredEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-6 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg">{event.title}</p>
                          <p className="text-slate-400">{event.registrations || 0} people registered so far</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-brand-blue text-brand-blue">Active</Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
                        <Calendar size={32} />
                      </div>
                      <p className="text-slate-400 font-bold">No recent activity to show.</p>
                      <p className="text-slate-600 text-sm mt-1">Create your first event to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

            {(user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && activeTab === "reports" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
                <CardTitle className="text-xl font-black text-white mb-8 flex items-center gap-2">
                  Attendance Outcomes
                </CardTitle>
                <div className="h-64">
                   {reportsData?.attendanceSummary ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={reportsData.attendanceSummary}
                           cx="50%"
                           cy="50%"
                           labelLine={false}
                           outerRadius={80}
                           fill="#8884d8"
                           dataKey="count"
                           nameKey="attendance_status"
                         >
                           {reportsData.attendanceSummary.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={entry.attendance_status === 'Attended' ? '#10b981' : entry.attendance_status === 'Absent' ? '#ef4444' : '#64748b'} />
                           ))}
                         </Pie>
                         <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                         <Legend />
                       </PieChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="h-full flex items-center justify-center text-slate-600 font-bold">No attendance data</div>
                   )}
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
                <CardTitle className="text-xl font-black text-white mb-8">Program Participation Trends</CardTitle>
                <div className="space-y-4">
                  {reportsData?.participationByCategory?.map((cat: any) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>{cat.category}</span>
                        <span>{cat.count} Regs</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-blue" 
                          style={{ width: `${totalRegistrations > 0 ? (cat.count / totalRegistrations) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!reportsData?.participationByCategory || reportsData.participationByCategory.length === 0) && (
                    <div className="text-center py-12 text-slate-600 italic">No participation data to display.</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {(user?.adminType === "Youth Organizer" || user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && activeTab === "organizers" && (
           <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl overflow-hidden">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
               <CardTitle className="text-xl font-black text-white">Youth Organizer / SK Official</CardTitle>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="border-b border-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest">
                     <th className="px-8 py-4">Name</th>
                     <th className="px-8 py-4">Organization</th>
                     <th className="px-8 py-4">Type</th>
                     <th className="px-8 py-4 text-center">Status</th>
                     <th className="px-8 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {admins.map((admin) => (
                     <tr key={admin.id} className="hover:bg-slate-900/50 transition-colors group">
                       <td className="px-8 py-6">
                         <p className="font-bold text-white">{admin.first_name} {admin.last_name}</p>
                         <p className="text-slate-500 text-sm">{admin.email}</p>
                       </td>
                       <td className="px-8 py-6 font-bold text-slate-300">{admin.organization_name}</td>
                       <td className="px-8 py-6">
                         <Badge className={`${admin.admin_type.includes('SK') ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-800 text-slate-400'} border-none font-bold`}>
                           {admin.admin_type}
                         </Badge>
                       </td>
                       <td className="px-8 py-6 text-center">
                         <Badge className={`${
                           admin.status === 'Approved' ? 'bg-brand-green/10 text-brand-green' : 
                           admin.status === 'Rejected' ? 'bg-brand-red/10 text-brand-red' : 
                           'bg-amber-500/10 text-amber-500'
                         } border-none font-bold`}>
                           {admin.status || 'Pending'}
                         </Badge>
                       </td>
                       <td className="px-8 py-6 text-right">
                         <div className="flex justify-end gap-2">
                           {user?.adminType === 'System Admin' && admin.status !== 'Approved' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => handleUpdateAdminStatus(admin.id, 'Approved')}
                               className="border-brand-green/50 text-brand-green hover:bg-brand-green/10 h-8 rounded-lg"
                             >
                               Approve
                             </Button>
                           )}
                           {user?.adminType === 'System Admin' && admin.status === 'Pending' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => handleUpdateAdminStatus(admin.id, 'Rejected')}
                               className="border-brand-red/50 text-brand-red hover:bg-brand-red/10 h-8 rounded-lg"
                             >
                               Reject
                             </Button>
                           )}
                           {user?.adminType === 'System Admin' && (
                             <>
                               <Button variant="ghost" size="icon" onClick={() => {
                                 setEditingAdmin(admin);
                                 setAdminFormData({
                                   firstName: admin.first_name,
                                   lastName: admin.last_name,
                                   email: admin.email,
                                   password: "",
                                   confirmPassword: "",
                                   adminType: admin.admin_type,
                                   organizationName: admin.organization_name
                                 });
                                 setIsAdminModalOpen(true);
                               }} 
                               className="text-slate-400 hover:text-brand-blue"
                               >
                                 <Edit2 size={18} />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => confirmDeleteAdmin(admin)} className="text-slate-400 hover:text-brand-red">
                                 <Trash2 size={18} />
                               </Button>
                             </>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                   {admins.length === 0 && (
                     <tr>
                       <td colSpan={4} className="p-12 text-center text-slate-500 font-bold">No other organizers found.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </Card>
        )}

        {activeTab === "events" && (
          <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-800 p-8 flex flex-row justify-between items-center">
              <CardTitle className="text-xl font-black text-white">Event Management</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input placeholder="Search events..." className="pl-10 bg-slate-900 border-slate-800 text-white rounded-xl h-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest">
                      <th className="px-8 py-4">Event Details</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Cap</th>
                      <th className="px-8 py-4">Regs</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-900/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                              <img 
                                src={event.image_url ? (event.image_url.startsWith('[') ? JSON.parse(event.image_url)[0] : event.image_url) : event.image} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                              />
                            </div>
                            <div>
                              <p className="font-bold text-white text-lg">{event.title}</p>
                              <p className="text-slate-500 text-sm">{event.event_date} • {event.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleToggleEventStatus(event.id, event.status)}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Badge className={`${
                              event.status === 'Active' ? 'bg-brand-green/10 text-brand-green' : 
                              event.status === 'Completed' ? 'bg-brand-blue/10 text-brand-blue' :
                              event.status === 'Cancelled' ? 'bg-brand-red/10 text-brand-red' :
                              'bg-slate-800 text-slate-400'
                            } border-none font-bold`}>
                              {event.status}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-white">{event.capacity || 100}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-slate-500" />
                            <span className="font-bold text-white">{event.registrations || 0}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleManageEvent(event)}
                              className="text-brand-blue hover:bg-brand-blue/10 rounded-lg gap-2"
                            >
                              Manage
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(event)}
                              className="text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg"
                            >
                              <Edit2 size={18} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(event.id)}
                              className="text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                            <Calendar size={40} />
                          </div>
                          <h3 className="text-2xl font-black text-white mb-2">No events found</h3>
                          <p className="text-slate-500 mb-8 max-w-xs mx-auto">You haven't created any events yet. Start by creating your first community activity!</p>
                          <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-brand-blue hover:bg-brand-dark-blue h-12 px-8 rounded-xl font-bold"
                          >
                            Create Your First Event
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

            {(user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && activeTab === "members" && (
          <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-800 p-8 flex flex-row justify-between items-center">
              <CardTitle className="text-xl font-black text-white">Registered Members</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input placeholder="Search members..." className="pl-10 bg-slate-900 border-slate-800 text-white rounded-xl h-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest">
                      <th className="px-8 py-4">Member Name</th>
                      <th className="px-8 py-4">Email</th>
                      <th className="px-8 py-4">Joined Date</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-900/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black overflow-hidden">
                              {member.profilePicture ? (
                                <img src={member.profilePicture} alt={member.firstName || "Member"} className="w-full h-full object-cover" />
                              ) : (
                                (member.firstName || "?").charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white">{member.firstName} {member.lastName}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{member.barangay || "No Barangay"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-slate-400">{member.email}</td>
                        <td className="px-8 py-6 text-slate-400">{member.mobileNumber || "N/A"}</td>
                        <td className="px-8 py-6">
                          <Badge className="bg-brand-green/10 text-brand-green border-none">
                            Active
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedMember(member)}
                              className="text-brand-blue hover:bg-brand-blue/10"
                            >
                              View Profile
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-slate-500 hover:text-brand-red hover:bg-brand-red/10 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                            <Users size={40} />
                          </div>
                          <h3 className="text-2xl font-black text-white mb-2">No members found</h3>
                          <p className="text-slate-500 max-w-xs mx-auto">When youths register for your events, they will appear here in your member directory.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {(user?.adminType === "SK Official" || user?.adminType === "Barangay Admin" || user?.adminType === "System Admin") && activeTab === "calendar" && (
          <div className="space-y-6">
            <Card className="p-8 bg-slate-950 border-slate-800 rounded-3xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white">{format(currentDate, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="border-slate-800 text-slate-400 h-10 w-10">
                    <ChevronLeft size={20} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="border-slate-800 text-slate-400 h-10 w-10">
                    <ChevronRightIcon size={20} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-800 border border-slate-800 rounded-2xl">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-slate-900 p-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">{day}</div>
                ))}
                {eachDayOfInterval({
                  start: startOfWeek(startOfMonth(currentDate)),
                  end: endOfWeek(endOfMonth(currentDate))
                }).map((day, i) => {
                  const dayEvents = events.filter(e => e.event_date && isSameDay(parseISO(e.event_date), day));
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "relative bg-slate-950 min-h-[130px] p-3 flex flex-col gap-1 transition-all duration-500 ease-out hover:bg-slate-900 hover:-translate-y-12 hover:scale-[1.8] hover:z-50 hover:shadow-[0_30px_100px_-15px_rgba(59,130,246,0.7)] rounded-xl border border-dotted border-transparent hover:border-brand-blue/50 cursor-default group",
                        !isSameMonth(day, currentDate) && "opacity-20"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-black transition-colors",
                        isSameDay(day, new Date()) ? 'text-brand-blue' : 'text-slate-600',
                        "group-hover:text-slate-200 group-hover:text-sm"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="space-y-1 group-hover:mt-2 transition-all">
                        {dayEvents.map(e => (
                          <div key={e.id} className={cn(
                            "text-[8px] p-1 rounded font-bold truncate transition-all duration-300 group-hover:text-[10px] group-hover:py-1.5 group-hover:px-2 group-hover:mb-1",
                            e.category === 'sports' ? 'bg-brand-green/10 text-brand-green group-hover:bg-brand-green/20' :
                            e.category === 'education' ? 'bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue/20' :
                            e.category === 'volunteer' ? 'bg-brand-red/10 text-brand-red group-hover:bg-brand-red/20' :
                            'bg-slate-800 text-slate-400'
                          )}>
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
              <CardTitle className="text-xl font-black text-white mb-8">Organization Profile</CardTitle>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Organization Name</label>
                  <Input defaultValue={user.organizationName} className="bg-slate-900 border-slate-800 text-white rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Contact Email</label>
                  <Input defaultValue={user.email} className="bg-slate-900 border-slate-800 text-white rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Admin Type</label>
                  <Input defaultValue={user.adminType} disabled className="bg-slate-900 border-slate-800 text-slate-500 rounded-xl h-12" />
                </div>
                <Button className="w-full h-12 bg-brand-blue hover:bg-brand-dark-blue rounded-xl font-bold">Update Profile</Button>
              </div>
            </Card>

            <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
              <CardTitle className="text-xl font-black text-white mb-8">Security & Access</CardTitle>
              <div className="space-y-6">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Add an extra layer of security</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-800 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full" />
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Login Notifications</p>
                    <p className="text-xs text-slate-500">Get notified of new sign-ins</p>
                  </div>
                  <div className="w-12 h-6 bg-brand-blue/20 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-brand-blue rounded-full" />
                  </div>
                </div>
                <Button variant="outline" className="w-full h-12 border-slate-800 text-white hover:bg-slate-800 rounded-xl font-bold">Change Password</Button>
              </div>
            </Card>
          </div>
        )}

        {user?.adminType === "System Admin" && (
          <>
            {activeTab === "audit" && (
              <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800 p-8 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <History className="text-brand-blue" />
                    <CardTitle className="text-xl font-black text-white">System Audit Trail</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchAuditLogs} className="text-slate-400 hover:text-white">Refresh</Button>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest">
                        <th className="px-8 py-4">Timestamp</th>
                        <th className="px-8 py-4">User</th>
                        <th className="px-8 py-4">Action</th>
                        <th className="px-8 py-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-8 py-4 text-slate-400 text-xs font-mono">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-8 py-4 text-white font-bold text-sm">
                            {log.user_name}
                            <Badge className="ml-2 text-[8px] bg-slate-800 text-slate-500 border-none uppercase">{log.user_type}</Badge>
                          </td>
                          <td className="px-8 py-4">
                            <Badge className={`font-black text-[10px] border-none ${
                              log.action.includes('CREATE') ? 'bg-brand-green/10 text-brand-green' :
                              log.action.includes('DELETE') ? 'bg-brand-red/10 text-brand-red' :
                              'bg-brand-blue/10 text-brand-blue'
                            }`}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-8 py-4 text-slate-400 text-xs max-w-xs truncate">{log.details}</td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-600 italic">No logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === "system" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
                  <CardTitle className="text-xl font-black text-white mb-8 flex items-center gap-2">
                    <DatabaseIcon className="text-brand-green" /> Managed Categories
                  </CardTitle>
                  <div className="space-y-6">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="New category..." 
                        className="bg-slate-900 border-slate-800 h-10 rounded-xl"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        className="bg-brand-blue hover:bg-brand-dark-blue rounded-xl"
                        onClick={() => {
                          if (!newCategory) return;
                          const current = systemSettings?.event_categories || [];
                          handleUpdateCategories([...current, newCategory.toLowerCase()]);
                          setNewCategory("");
                        }}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {systemSettings?.event_categories?.map((cat: string) => (
                        <Badge key={cat} className="bg-slate-900 text-slate-300 border-slate-800 p-2 pl-3 gap-2 flex items-center group font-bold">
                          {cat}
                          <X 
                            size={14} 
                            className="cursor-pointer text-slate-600 hover:text-brand-red opacity-0 group-hover:opacity-100" 
                            onClick={() => {
                              const updated = systemSettings.event_categories.filter((c: string) => c !== cat);
                              handleUpdateCategories(updated);
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="rounded-3xl border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-xl p-8">
                  <CardTitle className="text-xl font-black text-white mb-8 flex items-center gap-2">
                    <HardDrive className="text-brand-red" /> Data Maintenance
                  </CardTitle>
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">System Database Backup</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Status: Operational</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-brand-blue hover:bg-brand-blue/10 font-bold"
                        onClick={handleBackup}
                      >
                        Run Now
                      </Button>
                    </div>
                    
                    <div className="p-6 bg-brand-red/5 rounded-2xl border border-brand-red/20">
                      <p className="text-brand-red font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                        <AlertCircle size={14} /> Critical Zone
                      </p>
                      <p className="text-slate-400 text-xs mb-4">Wiping system logs or resetting defaults is irreversible. Use with extreme caution.</p>
                      <Button variant="ghost" className="text-brand-red hover:bg-brand-red/10 w-full rounded-xl font-bold border border-brand-red/20">
                        Purge Audit Logs
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create/Edit Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-white rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Event Title</label>
              <Input 
                placeholder="e.g. Youth Summit 2026" 
                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
              <select 
                className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-12 px-4 focus:ring-brand-blue capitalize"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {(systemSettings?.event_categories || ['sports', 'music', 'arts', 'volunteer', 'education']).map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full bg-slate-950 border-slate-800 text-white rounded-xl h-12 justify-start text-left font-normal",
                        !formData.date && "text-slate-500"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.date ? format(parseISO(formData.date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0 border-slate-800 bg-slate-950" align="start">
                  <UICalendar
                    mode="single"
                    selected={formData.date ? parseISO(formData.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, date: format(date, "yyyy-MM-dd") });
                      }
                    }}
                    initialFocus
                    className="bg-slate-950 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Time Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase ml-1">Start</label>
                  <Select 
                    value={formData.time.split(" - ")[0] || ""} 
                    onValueChange={(val) => {
                      const parts = formData.time.split(" - ");
                      const end = parts[1] || "";
                      setFormData({ ...formData, time: val + (end ? ` - ${end}` : "") });
                    }}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white rounded-xl h-11 w-full flex justify-between">
                      <SelectValue placeholder="Start Time" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                      {TIME_OPTIONS.map(time => (
                        <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase ml-1">End</label>
                  <Select 
                    value={formData.time.split(" - ")[1] || ""} 
                    onValueChange={(val) => {
                      const parts = formData.time.split(" - ");
                      const start = parts[0] || "";
                      setFormData({ ...formData, time: (start ? `${start} - ` : "") + val });
                    }}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white rounded-xl h-11 w-full flex justify-between">
                      <SelectValue placeholder="End Time" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                      {TIME_OPTIONS.map(time => (
                        <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Capacity</label>
              <Input 
                type="number"
                placeholder="e.g. 100"
                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                value={isNaN(formData.capacity) ? "" : formData.capacity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({...formData, capacity: isNaN(val) ? 0 : val});
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
              <select 
                className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-12 px-4 focus:ring-brand-blue text-sm"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Location</label>
              <Input 
                placeholder="e.g. New Cabalan Covered Court"
                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
              <Textarea 
                placeholder="Tell us more about the event..."
                className="bg-slate-950 border-slate-800 text-white rounded-xl min-h-[100px] p-4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="space-y-4 md:col-span-2 border-t border-slate-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Event Posters / Images</label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFormData({...formData, images: [...formData.images, ""]})}
                  className="text-brand-blue hover:bg-brand-blue/10 h-8 px-2 rounded-lg text-[10px] font-black uppercase"
                >
                  <Plus size={14} className="mr-1" /> Add More Slots
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group p-4 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[150px] flex flex-col items-center justify-center">
                    {img ? (
                      <>
                        <img src={img} alt={`Preview ${idx}`} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" referrerPolicy="no-referrer" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                           <div className="p-2 bg-slate-900/80 rounded-xl backdrop-blur-sm border border-slate-700">
                             <CheckCircle2 size={24} className="text-brand-green" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-white shadow-sm">Image Uploaded</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-600">
                        <Upload size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Select Image</p>
                      </div>
                    )}
                    
                    <label className="absolute inset-0 cursor-pointer opacity-0 z-20">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleEventImageUpload(e, idx)} 
                      />
                    </label>

                    {formData.images.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== idx);
                          setFormData({...formData, images: newImages});
                        }}
                        className="absolute top-2 right-2 z-30 h-8 w-8 bg-black/50 hover:bg-brand-red text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-2">* Clicking a slot will open your file manager to select an image.</p>
            </div>
          </div>

          <DialogFooter className="gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              className="h-12 px-8 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="h-12 px-10 bg-brand-blue hover:bg-brand-dark-blue rounded-xl font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20"
            >
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manage Event Modal */}
      <Dialog open={!!selectedEventForManagement} onOpenChange={(open) => !open && setSelectedEventForManagement(null)}>
        <DialogContent className="sm:max-w-4xl bg-slate-900 border-slate-800 text-white rounded-[2rem] p-0 overflow-hidden h-[80vh] flex flex-col">
          <div className="p-8 pb-4 border-b border-slate-800 shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                  {selectedEventForManagement?.title}
                </DialogTitle>
                <p className="text-slate-500 text-sm mt-1">
                  {selectedEventForManagement?.event_date} • {selectedEventForManagement?.location}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedEventForManagement(null)}
                className="text-slate-500 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>

            <nav className="flex gap-8 mt-8">
              <button 
                onClick={() => setManagingTab("participants")}
                className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${managingTab === "participants" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500 hover:text-white"}`}
              >
                Participants ({eventParticipants.length})
              </button>
              <button 
                onClick={() => setManagingTab("announcements")}
                className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${managingTab === "announcements" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500 hover:text-white"}`}
              >
                Announcements
              </button>
            </nav>
          </div>

          <ScrollArea className="flex-1 p-8">
            {managingTab === "participants" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance Rate</p>
                      <p className="font-bold text-white">
                        {eventParticipants.length > 0 
                          ? Math.round((eventParticipants.filter(p => p.attendance_status === 'Attended').length / eventParticipants.length) * 100) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered</p>
                      <p className="font-bold text-white">{eventParticipants.length} / {selectedEventForManagement?.capacity || 100}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attended</p>
                      <p className="font-bold text-brand-green">{eventParticipants.filter(p => p.attendance_status === 'Attended').length}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800 pb-4">
                        <th className="pb-4">Participant</th>
                        <th className="pb-4">Contact</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Tracking</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {eventParticipants.map((p) => (
                        <tr key={p.id} className="group hover:bg-slate-800/20">
                          <td className="py-4">
                            <p className="font-bold text-white">{p.first_name} {p.last_name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{p.barangay || "New Cabalan"}</p>
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-400">
                            {p.email} <br /> {p.mobile_number || "No Phone"}
                          </td>
                          <td className="py-4">
                            <Badge className={`${
                              p.attendance_status === 'Attended' ? 'bg-brand-green/10 text-brand-green' : 
                              p.attendance_status === 'Absent' ? 'bg-brand-red/10 text-brand-red' : 
                              'bg-slate-800 text-slate-500'
                            } border-none`}>
                              {p.attendance_status}
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2 shrink-0">
                              <Button 
                                size="sm" 
                                variant={p.attendance_status === 'Attended' ? 'secondary' : 'outline'}
                                onClick={() => handleUpdateAttendance(p.id, 'Attended')}
                                className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.attendance_status === 'Attended' ? 'bg-brand-green text-white border-none' : 'border-slate-700 text-slate-400 hover:text-brand-green hover:border-brand-green'}`}
                              >
                                {p.attendance_status === 'Attended' ? 'Attended' : 'Mark Present'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateAttendance(p.id, 'Absent')}
                                className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.attendance_status === 'Absent' ? 'bg-brand-red/10 text-brand-red border-brand-red/20' : 'border-slate-700 text-slate-400 hover:text-brand-red hover:border-brand-red'}`}
                              >
                                {p.attendance_status === 'Absent' ? 'Absent' : 'Mark Absent'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {eventParticipants.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <p className="text-slate-500 font-bold">No participants registered yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {managingTab === "announcements" && (
              <div className="space-y-12">
                <Card className="bg-slate-950 border-slate-800 p-8 rounded-[2rem]">
                  <h4 className="text-lg font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
                    <Megaphone className="text-brand-blue" /> New Announcement
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject</label>
                      <Input 
                        placeholder="e.g. Schedule Change or Reminder"
                        className="bg-slate-900 border-slate-800 text-white rounded-2xl h-12"
                        value={announcementFormData.title}
                        onChange={(e) => setAnnouncementFormData({...announcementFormData, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Message</label>
                      <Textarea 
                        placeholder="Type your announcement here..."
                        className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[120px] p-4"
                        value={announcementFormData.message}
                        onChange={(e) => setAnnouncementFormData({...announcementFormData, message: e.target.value})}
                      />
                      <p className="text-[10px] text-slate-600 italic mt-1 font-bold">
                        * This will be sent as a notification to all registered participants.
                      </p>
                    </div>
                    <Button 
                      onClick={handlePostAnnouncement}
                      className="w-full h-12 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20"
                    >
                      Post & Notify Participants
                    </Button>
                  </div>
                </Card>

                <div className="space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Recent Announcements</h4>
                  <div className="space-y-4">
                    {eventAnnouncements.map((ann) => (
                      <div key={ann.id} className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <h5 className="font-black text-white">{ann.title}</h5>
                          <span className="text-[10px] font-bold text-slate-600">
                            {new Date(ann.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">{ann.message}</p>
                      </div>
                    ))}
                    {eventAnnouncements.length === 0 && (
                      <div className="py-12 text-center text-slate-600 italic text-sm">
                        No announcements posted for this event.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Admin Management Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={(open) => !open && setIsAdminModalOpen(false)}>
        <DialogContent className="sm:max-w-md bg-slate-950 border border-slate-800 text-white rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(59,130,246,0.2)]">
          <div className="bg-brand-blue/10 px-8 py-6 border-b border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-brand-blue">
                <ShieldCheck size={28} />
                {editingAdmin ? "Edit Organizer" : "Add New Organizer"}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                <Input 
                  className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-all placeholder:text-slate-700"
                  value={adminFormData.firstName}
                  onChange={(e) => setAdminFormData({...adminFormData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                <Input 
                  className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-all placeholder:text-slate-700"
                  value={adminFormData.lastName}
                  onChange={(e) => setAdminFormData({...adminFormData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <Input 
                className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-all placeholder:text-slate-700"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({...adminFormData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Password {editingAdmin && <span className="text-slate-600 normal-case font-normal">(Leave blank to keep current)</span>}
              </label>
              <Input 
                type="password"
                className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-all placeholder:text-slate-700"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Re-enter Password
              </label>
              <Input 
                type="password"
                className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-all placeholder:text-slate-700"
                value={adminFormData.confirmPassword}
                onChange={(e) => setAdminFormData({...adminFormData, confirmPassword: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Type</label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-900 border-slate-800 text-white rounded-xl h-12 px-4 focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-all text-sm appearance-none"
                  value={adminFormData.adminType}
                  onChange={(e) => setAdminFormData({...adminFormData, adminType: e.target.value as any})}
                >
                  <option value="Youth Organizer">Youth Organizer</option>
                  <option value="SK Official">SK Official</option>
                  <option value="Barangay Admin">Barangay Admin</option>
                  <option value="System Admin">System Admin</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Organization Name</label>
              <Input 
                 placeholder="e.g. SK New Cabalan"
                className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-all placeholder:text-slate-700"
                value={adminFormData.organizationName}
                onChange={(e) => setAdminFormData({...adminFormData, organizationName: e.target.value})}
              />
            </div>
          </div>

          <div className="p-8 pt-0 flex flex-col gap-3">
            <Button onClick={handleSaveAdmin} className="w-full bg-brand-blue hover:bg-brand-dark-blue h-12 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-blue/20">
              {editingAdmin ? "Save Changes" : "Create Organizer"}
            </Button>
            <Button variant="ghost" onClick={() => setIsAdminModalOpen(false)} className="w-full text-slate-400 hover:text-white h-12 rounded-xl">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-slate-950 border border-slate-800 text-white rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(239,68,68,0.2)]">
          <div className="bg-brand-red/10 px-8 py-6 border-b border-slate-800 flex items-center justify-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-brand-red flex items-center gap-3">
                <AlertCircle size={28} />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red mx-auto border-2 border-brand-red/20">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <p className="text-white text-lg font-bold">Remove Organizer?</p>
              <p className="text-slate-400 text-sm leading-relaxed px-4">
                Are you sure you want to remove <span className="text-white font-black underline decoration-brand-red underline-offset-4">{adminToDelete?.name}</span>? This action is irreversible and will revoke all access instantly.
              </p>
            </div>
          </div>

          <div className="p-8 pt-0 flex flex-col gap-3">
            <Button onClick={executeDeleteAdmin} className="w-full bg-brand-red hover:bg-brand-red/80 h-12 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-red/20">
              Delete Organizer
            </Button>
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} className="w-full text-slate-400 hover:text-white h-12 rounded-xl">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Member Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-slate-950 text-white">
          {selectedMember && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-blue/10 rounded-[2rem] flex items-center justify-center text-brand-blue mx-auto mb-6 border-2 border-brand-blue/20 overflow-hidden">
                  {selectedMember.profilePicture ? (
                    <img src={selectedMember.profilePicture} alt={selectedMember.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={40} />
                  )}
                </div>
                <h2 className="text-2xl font-black tracking-tight">{selectedMember.firstName} {selectedMember.lastName}</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedMember.barangay || "New Cabalan"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold truncate">{selectedMember.email}</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mobile</p>
                  <p className="text-sm font-bold">{selectedMember.mobileNumber || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Birthday</p>
                  <p className="text-sm font-bold">{selectedMember.birthday || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-sm font-bold">{selectedMember.gender || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.interests && selectedMember.interests.length > 0 ? (
                    selectedMember.interests.map((id: string) => (
                      <Badge key={id} className="bg-slate-900 text-slate-400 border-slate-800 font-bold">
                        {id}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 italic">No interests listed.</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => setSelectedMember(null)}
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold"
              >
                Close Profile
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
