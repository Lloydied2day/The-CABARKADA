import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Settings, 
  LogOut,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  CheckCircle2,
  X,
  Camera,
  Plus,
  Trophy,
  Zap,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/src/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProfilePage() {
  const { user, logout, updateUser, updateInterests } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    mobileNumber: user?.mobileNumber || "",
    barangay: user?.barangay || "",
    birthday: user?.birthday || "",
    gender: user?.gender || "",
    age: user?.age || 0,
    purok: user?.purok || "",
    street: user?.street || "",
    parentName: user?.parentName || "",
    parentContact: user?.parentContact || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedInterests(user.interests || []);
      setEditData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        mobileNumber: user.mobileNumber || "",
        barangay: user.barangay || "",
        birthday: user.birthday || "",
        gender: user.gender || "",
        age: user.age || 0,
        purok: user.purok || "",
        street: user.street || "",
        parentName: user.parentName || "",
        parentContact: user.parentContact || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && user.id !== 0) {
      fetchUserEvents();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserEvents = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/events`);
      const data = await response.json();
      setRegisteredEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        updateUser({ ...user, ...editData });
        toast.success("Profile Updated", {
          description: "Your changes have been saved successfully.",
        });
        setShowEdit(false);
      } else {
        toast.error("Update Failed", {
          description: "Could not save your changes. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, we'd upload to a server/S3
    // For now, we'll use a FileReader to get a base64 string
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateUser({ profilePicture: base64String });
      toast.success("Profile Picture Updated", {
        description: "Your new avatar looks great!",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInterestsUpdate = async () => {
    await updateInterests(selectedInterests);
    setShowInterests(false);
    toast.success("Interests Updated", {
      description: "We'll show you events based on your new preferences.",
    });
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Sidebar - Profile Info */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-brand-blue/10" />
              <div className="relative z-10">
                <div className="relative w-32 h-32 mx-auto mb-6 group">
                  <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-brand-blue border-4 border-white overflow-hidden">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={64} />
                    )}
                  </div>
                  {user.id !== 0 && (
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-brand-dark-blue transition-colors border-2 border-white">
                      <Camera size={18} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
                    </label>
                  )}
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.firstName} {user.lastName}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
                  {user.id === 0 ? "Guest Account" : "Official Member"}
                </p>
                
                <div className="mt-10 space-y-4 text-left">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-blue shadow-sm">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-green shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</p>
                      <p className="text-sm font-bold text-slate-700">{user.mobileNumber || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-red shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{user.street ? `${user.street}, ` : ""}{user.purok || user.barangay || "Not set"}</p>
                    </div>
                  </div>
                  {user.age && user.age < 18 && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-blue shadow-sm">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guardian</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{user.parentName || "Not set"}</p>
                      </div>
                    </div>
                  )}
                </div>

                {user.id !== 0 && (
                  <Button 
                    onClick={() => setShowEdit(true)}
                    variant="outline" 
                    className="w-full mt-10 h-14 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-xs gap-2 hover:bg-slate-50"
                  >
                    <Settings size={16} /> Edit Profile
                  </Button>
                )}
                
                <Button 
                  onClick={logout}
                  variant="ghost" 
                  className="w-full mt-2 h-14 rounded-2xl text-brand-red hover:bg-brand-red/5 font-black uppercase tracking-widest text-xs gap-2"
                >
                  <LogOut size={16} /> Logout
                </Button>
              </div>
            </motion.div>

            {/* Participation Milestones */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100"
            >
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3 mb-8">
                <Trophy className="text-yellow-500" /> Milestones
              </h3>
              <div className="space-y-6">
                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${registeredEvents.length >= 1 ? "border-brand-blue bg-brand-blue/5" : "border-slate-50 bg-slate-50/50 opacity-40 grayscale"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${registeredEvents.length >= 1 ? "bg-brand-blue text-white" : "bg-slate-200 text-slate-400"}`}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">First Step</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined your 1st event</p>
                  </div>
                  {registeredEvents.length >= 1 && <CheckCircle2 size={20} className="ml-auto text-brand-green" />}
                </div>

                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${registeredEvents.filter(e => e.attendance_status === 'Attended').length >= 3 ? "border-brand-green bg-brand-green/5" : "border-slate-50 bg-slate-50/50 opacity-40 grayscale"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${registeredEvents.filter(e => e.attendance_status === 'Attended').length >= 3 ? "bg-brand-green text-white" : "bg-slate-200 text-slate-400"}`}>
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">Active Member</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attended 3 events</p>
                  </div>
                  {registeredEvents.filter(e => e.attendance_status === 'Attended').length >= 3 && <CheckCircle2 size={20} className="ml-auto text-brand-green" />}
                </div>

                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${registeredEvents.length >= 10 ? "border-brand-red bg-brand-red/5" : "border-slate-50 bg-slate-50/50 opacity-40 grayscale"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${registeredEvents.length >= 10 ? "bg-brand-red text-white" : "bg-slate-200 text-slate-400"}`}>
                    <Award size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">Cabarkada Elite</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined 10 events</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 rounded-full blur-3xl" />
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                <Award className="text-brand-blue" /> My Barkada Stats
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="text-3xl font-black text-brand-blue">{registeredEvents.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Events Joined</p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="text-3xl font-black text-brand-green">
                    {registeredEvents.filter(e => e.attendance_status === 'Attended').length}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Attended</p>
                </div>
              </div>
            </motion.div>

            {/* Interests Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
                  <Heart className="text-brand-red" /> My Interests
                </h3>
                {user.id !== 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowInterests(true)}
                    className="text-brand-blue hover:bg-brand-blue/5 rounded-xl"
                  >
                    <Settings size={18} />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map(interestId => {
                    const category = CATEGORIES.find(c => c.id === interestId);
                    return (
                      <Badge key={interestId} className="bg-slate-50 text-slate-600 border-slate-100 px-4 py-2 rounded-xl font-bold gap-2">
                        {category?.icon && <category.icon size={14} />}
                        {category?.name || interestId}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-400 font-bold italic">No interests selected yet.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Main Content - Bento Grid Dashboard */}
          <div className="lg:col-span-2 space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">My <span className="text-brand-blue">Barkada</span> Dashboard</h2>
                <Link to="/events">
                  <Button variant="ghost" className="font-black uppercase tracking-widest text-xs gap-2 text-brand-blue hover:bg-brand-blue/5">
                    Browse More Events <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Large Card: Registered Events */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="md:col-span-6 bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-400 flex items-center gap-3">
                        <Calendar size={20} className="text-brand-red" /> My Events
                      </h3>
                      <Badge className="bg-brand-blue/10 text-brand-blue border-none font-black px-4 py-1 rounded-full text-[10px] tracking-widest">
                        {registeredEvents.length} TOTAL
                      </Badge>
                    </div>
                    
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2].map(i => (
                          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                        ))}
                      </div>
                    ) : registeredEvents.length > 0 ? (
                      <div className="space-y-4">
                        {registeredEvents.map((event) => (
                          <div key={event.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                              <img src={event.image_url || "https://picsum.photos/seed/event/800/400"} alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-black text-slate-900 text-lg truncate">{event.title}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{event.event_date} • {event.location}</p>
                              <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${event.attendance_status === 'Attended' ? 'bg-brand-green' : 'bg-brand-blue'}`} />
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    Status: {event.attendance_status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${event.status === 'Active' ? 'bg-brand-green/10 text-brand-green' : 'bg-slate-100 text-slate-400'} border-none font-bold`}>
                                {event.status}
                              </Badge>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-blue transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                          <Calendar size={32} />
                        </div>
                        <p className="font-bold text-slate-400">You haven't registered for any events yet.</p>
                        <Link to="/events">
                          <Button className="bg-brand-blue rounded-xl font-bold">Find Events</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Impact Card */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="md:col-span-3 bg-brand-blue rounded-[3rem] p-8 shadow-xl shadow-brand-blue/20 text-white flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <Heart size={32} className="text-white/40" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Impact</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-5xl font-black">{registeredEvents.length * 2}h</p>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Estimated Impact Hours</p>
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="md:col-span-3 bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100"
                >
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-400 flex items-center gap-3 mb-6">
                    <Clock size={20} className="text-brand-green" /> Recent Activity
                  </h3>
                  <div className="space-y-6">
                    {registeredEvents.slice(0, 2).map((event, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">Registered for {event.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.registration_date}</p>
                        </div>
                      </div>
                    ))}
                    {registeredEvents.length === 0 && (
                      <p className="text-sm text-slate-400 font-bold">No recent activity.</p>
                    )}
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Edit Profile</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update your personal information below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">First Name</label>
                <Input 
                  value={editData.firstName}
                  onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                  className="h-12 rounded-xl border-slate-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Last Name</label>
                <Input 
                  value={editData.lastName}
                  onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                  className="h-12 rounded-xl border-slate-200"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Birthday</label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-12 rounded-xl border-slate-200 justify-start text-left font-normal",
                          !editData.birthday && "text-slate-500"
                        )}
                      >
                        <Calendar size={16} className="mr-2 text-brand-blue" />
                        {editData.birthday ? format(parseISO(editData.birthday), "PPP") : <span>Pick a date</span>}
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0 border-slate-200 bg-white" align="start">
                    <UICalendar
                      mode="single"
                      selected={editData.birthday ? parseISO(editData.birthday) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const dob = format(date, "yyyy-MM-dd");
                          const birthDate = date;
                          const today = new Date();
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          setEditData({ ...editData, birthday: dob, age });
                        }
                      }}
                      initialFocus
                      className="bg-white"
                      captionLayout="dropdown"
                      startMonth={new Date(1900, 0)}
                      endMonth={new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Gender</label>
                <Select 
                  value={editData.gender || ""} 
                  onValueChange={(v) => setEditData({...editData, gender: v})}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
                <Input 
                  value={editData.mobileNumber}
                  onChange={(e) => setEditData({...editData, mobileNumber: e.target.value})}
                  className="h-12 rounded-xl border-slate-200"
                  placeholder="0912 345 6789"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Purok</label>
                <Select 
                  value={editData.purok || ""} 
                  onValueChange={(v) => setEditData({...editData, purok: v})}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Purok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Purok 1">Purok 1</SelectItem>
                    <SelectItem value="Purok 2">Purok 2</SelectItem>
                    <SelectItem value="Purok 3">Purok 3</SelectItem>
                    <SelectItem value="Purok 4">Purok 4</SelectItem>
                    <SelectItem value="Purok 5">Purok 5</SelectItem>
                    <SelectItem value="Purok 6">Purok 6</SelectItem>
                    <SelectItem value="Purok 7">Purok 7</SelectItem>
                    <SelectItem value="Iram">Iram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Street Address</label>
              <Input 
                value={editData.street}
                onChange={(e) => setEditData({...editData, street: e.target.value})}
                className="h-12 rounded-xl border-slate-200"
                placeholder="Street / House No."
              />
            </div>
            {editData.age < 18 && (
              <div className="space-y-4 p-4 bg-brand-red/5 rounded-2xl border border-brand-red/10">
                <p className="text-xs font-bold text-brand-red uppercase tracking-widest">Parent / Guardian Information</p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <Input 
                    value={editData.parentName}
                    onChange={(e) => setEditData({...editData, parentName: e.target.value})}
                    className="h-10 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Contact Number</label>
                  <Input 
                    value={editData.parentContact}
                    onChange={(e) => setEditData({...editData, parentContact: e.target.value})}
                    className="h-10 rounded-xl border-slate-200"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="pt-6">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowEdit(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-brand-blue hover:bg-brand-dark-blue rounded-xl font-bold px-8 shadow-lg shadow-brand-blue/20"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Interests Modal */}
      <Dialog open={showInterests} onOpenChange={setShowInterests}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="space-y-2 text-center">
              <DialogTitle className="text-3xl font-black text-slate-900">Update Interests</DialogTitle>
              <DialogDescription className="text-lg text-slate-600">
                What are you into lately? We'll use this to recommend events.
              </DialogDescription>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedInterests.includes(cat.id)
                        ? "border-brand-blue bg-brand-blue/5 text-brand-blue shadow-md"
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedInterests.includes(cat.id) ? "bg-brand-blue text-white" : "bg-white text-slate-400"
                    }`}>
                      <cat.icon size={20} />
                    </div>
                    <span className="font-bold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-4">
              <Button 
                variant="ghost"
                onClick={() => setShowInterests(false)}
                className="flex-1 h-14 rounded-2xl text-lg font-bold text-slate-400 hover:text-slate-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInterestsUpdate}
                className="flex-[2] h-14 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl text-lg font-bold shadow-lg shadow-brand-blue/20"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
