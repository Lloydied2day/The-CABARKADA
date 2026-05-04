import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Search, 
  MapPin, 
  Sparkles,
  Clock,
  User as UserIcon,
  Phone,
  Info,
  ChevronDown,
  UserCircle,
  PlusCircle,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  AlertCircle,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/src/contexts/AuthContext";
import { CATEGORIES } from "@/src/constants";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<number[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestion, setSuggestion] = useState({ title: "", description: "" });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToRegister, setEventToRegister] = useState<any | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const limit = 6;

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [page, selectedCategory, searchQuery, user]);

  useEffect(() => {
    if (user && user.id !== 0) {
      fetchUserRegistrations();
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user || user.id === 0) return;
    try {
      const response = await fetch(`/api/events/recommendations?userId=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setRecommendedEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events);
        setTotal(data.total);
      } else {
        setFetchError(true);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setFetchError(true);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/users/${user?.id}/events`);
      const data = await response.json();
      if (response.ok) {
        setIsRegistered(data.map((e: any) => e.id));
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={48} />
      </div>
    );
  }


  const handleRegisterClick = (event: any) => {
    if (user?.id === 0) {
      toast.error("Guest Account", {
        description: "Please create an account to register for events!",
      });
      return;
    }
    if (isRegistered.includes(event.id)) return;
    setEventToRegister(event);
    setShowConfirmModal(true);
  };

  const confirmRegistration = async () => {
    if (!eventToRegister) return;
    
    const eventId = eventToRegister.id;
    // Optimistic Update
    setIsRegistered(prev => [...prev, eventId]);
    setShowConfirmModal(false);
    
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id,
          additionalNotes 
        }),
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Registration Successful", {
          description: "You're all set! See you at the event.",
        });
        fetchEvents();
        setAdditionalNotes("");
      } else {
        setIsRegistered(prev => prev.filter(id => id !== eventId));
        toast.error("Registration Failed", {
          description: data.error || "Something went wrong.",
        });
      }
    } catch (error) {
      setIsRegistered(prev => prev.filter(id => id !== eventId));
      toast.error("Network Error", {
        description: "Could not connect to the server.",
      });
    }
  };

  const getEventImages = (imageUrl: string) => {
    if (!imageUrl) return ["https://picsum.photos/seed/event/800/400"];
    if (imageUrl.startsWith('[')) {
      try {
        return JSON.parse(imageUrl);
      } catch (e) {
        return [imageUrl];
      }
    }
    return [imageUrl];
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-white pb-20 pt-24">
      {/* Top Bar & Search */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Welcome back, <span className="text-brand-blue">{user.firstName}!</span>
              </h1>
              <p className="text-slate-500 font-medium">Find and register for the latest youth activities in New Cabalan.</p>
            </div>
            
            <div className="flex w-full md:w-auto gap-3">
              <Button 
                onClick={() => setIsSuggestModalOpen(true)}
                variant="outline" 
                className="h-12 px-6 border-brand-green text-brand-green hover:bg-brand-green/5 rounded-xl font-bold gap-2"
              >
                <PlusCircle size={18} /> Suggest Event
              </Button>
              <div className="relative flex-grow md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search events..." 
                  className="pl-11 h-12 bg-white border-slate-200 rounded-xl text-base focus:ring-brand-blue shadow-sm"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-20">
        {/* Featured Section (First page only) */}
        {page === 1 && !selectedCategory && !searchQuery && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="text-brand-red" size={24} />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Featured Activities</h2>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {loading ? (
                <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
              ) : events.slice(0, 1).map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-slate-900 text-white border-none rounded-[2.5rem] p-10 flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-red/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 space-y-6 flex-grow">
                      <div className="space-y-2">
                        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">{event.title}</h3>
                        <div className="flex flex-wrap gap-6 text-slate-400 font-bold uppercase tracking-widest text-sm pt-4">
                          <span className="flex items-center gap-2"><Calendar size={18} className="text-brand-blue" /> {event.event_date}</span>
                          <span className="flex items-center gap-2"><MapPin size={18} className="text-brand-blue" /> {event.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 pt-4">
                        <Button 
                          onClick={() => handleRegisterClick(event)}
                          className={`h-14 px-10 rounded-2xl font-black uppercase transition-all hover:scale-105 active:scale-95 shadow-xl ${
                            isRegistered.includes(event.id) 
                              ? "bg-brand-green hover:bg-brand-green/90 text-white shadow-brand-green/20" 
                              : "bg-brand-blue hover:bg-brand-dark-blue text-white shadow-brand-blue/30"
                          }`}
                        >
                          {isRegistered.includes(event.id) ? "REGISTERED" : "REGISTER NOW"}
                        </Button>
                        <Button 
                          onClick={() => setSelectedEvent(event)}
                          className="h-14 px-10 rounded-2xl font-black uppercase transition-all hover:scale-105 active:scale-95 bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
                        >
                          EVENT DETAILS
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative z-10 w-full lg:w-1/3 aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10 group/feat-carousel">
                      <AnimatePresence mode="wait">
                        <motion.img 
                          key={currentImageIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          src={getEventImages(event.image_url)[currentImageIndex]} 
                          alt={event.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          referrerPolicy="no-referrer" 
                        />
                      </AnimatePresence>
                      
                      {getEventImages(event.image_url).length > 1 && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              const images = getEventImages(event.image_url);
                              setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-none opacity-0 group-hover/feat-carousel:opacity-100 transition-opacity"
                          >
                            <ChevronLeft size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              const images = getEventImages(event.image_url);
                              setCurrentImageIndex(prev => (prev + 1) % images.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-none opacity-0 group-hover/feat-carousel:opacity-100 transition-opacity"
                          >
                            <ChevronRight size={18} />
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Personalized Recommendations */}
        {user && user.id !== 0 && recommendedEvents.length > 0 && !selectedCategory && !searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Heart className="text-brand-red fill-brand-red animate-pulse" size={24} />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Recommended for You</h2>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Based on your interests</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedEvents.map((event) => (
                <motion.div
                  key={`rec-${event.id}`}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 group cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={getEventImages(event.image_url)[0]} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <Badge className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white border-none font-bold">
                      {CATEGORIES.find(c => c.id === event.category)?.name}
                    </Badge>
                  </div>
                  <div className="p-6 space-y-3">
                    <h4 className="font-black text-slate-900 truncate leading-none uppercase">{event.title}</h4>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                      <Calendar size={12} className="text-brand-blue" /> {event.event_date}
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full mt-2 h-10 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                    >
                      Quick View
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Main List Section */}
        <section>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Explore All</h2>
            <div className="h-1 flex-grow mx-8 bg-slate-100 rounded-full hidden md:block" />
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="text-slate-600 hover:bg-slate-100 font-black uppercase tracking-widest gap-2 rounded-xl">
                  {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.name : "ALL CATEGORIES"} <ChevronDown size={20} />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-3 shadow-2xl border-none">
                <DropdownMenuItem onClick={() => {setSelectedCategory(null); setPage(1);}} className="font-bold rounded-xl h-12 px-4">All Categories</DropdownMenuItem>
                {CATEGORIES.map(cat => (
                  <DropdownMenuItem key={cat.id} onClick={() => {setSelectedCategory(cat.id); setPage(1);}} className="font-bold rounded-xl h-12 px-4 gap-3">
                    <cat.icon size={18} className="text-brand-blue" />
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-16">
            {loading ? (
              <div className="space-y-12">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-[300px] w-full rounded-[3rem]" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {events.map((event, idx) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ 
                      duration: 0.6, 
                      delay: idx * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    className="bg-slate-50 p-10 rounded-[3rem] flex flex-col lg:flex-row gap-12 relative group hover:bg-slate-100 transition-colors duration-500 border border-slate-100"
                  >
                    <div className="flex-grow space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-slate-700 font-black uppercase tracking-tight text-sm">
                        <div className="space-y-1">
                          <p className="text-brand-blue text-xs tracking-widest mb-2">EVENT TITLE</p>
                          <p className="text-2xl leading-none">{event.title}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-brand-blue text-xs tracking-widest mb-2">DATE & TIME</p>
                          <p className="text-xl leading-none">{event.event_date}</p>
                          <p className="text-slate-500 text-xs mt-1">{event.event_time}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-brand-blue text-xs tracking-widest mb-2">LOCATION</p>
                          <p className="text-xl leading-none">{event.location}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-brand-blue text-xs tracking-widest mb-2">ORGANIZER</p>
                          <p className="text-xl leading-none">{event.organizer_name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">DESCRIPTION</p>
                        <p className="text-slate-600 leading-relaxed max-w-2xl text-lg line-clamp-2">{event.description}</p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button 
                          onClick={() => handleRegisterClick(event)}
                          className={`h-14 px-12 rounded-2xl font-black uppercase transition-all hover:scale-105 active:scale-95 shadow-xl ${
                            isRegistered.includes(event.id) 
                              ? "bg-brand-green hover:bg-brand-green/90 text-white" 
                              : "bg-brand-blue hover:bg-brand-dark-blue shadow-brand-blue/20"
                          }`}
                        >
                          {isRegistered.includes(event.id) ? "REGISTERED" : "REGISTER"}
                        </Button>
                        <Button 
                          onClick={() => setSelectedEvent(event)}
                          className="bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 h-14 px-8 rounded-2xl font-black uppercase transition-all shadow-md hover:shadow-lg"
                        >
                          DETAILS
                        </Button>
                      </div>
                    </div>

                    <div className="lg:w-[450px] aspect-[4/3] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white transition-transform duration-700 group-hover:scale-[1.02]">
                      <img src={getEventImages(event.image_url)[0]} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-16">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-xl h-12 w-12 p-0"
              >
                <ChevronLeft size={20} />
              </Button>
              <span className="font-black text-slate-900 uppercase tracking-widest text-sm">
                Page {page} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-xl h-12 w-12 p-0"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          )}

          {fetchError && (
            <div className="text-center py-20 bg-red-50 rounded-[3rem] border-2 border-dashed border-red-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-lg">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Connection Error</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">We're having trouble connecting to the server. Please check your internet connection.</p>
              <Button 
                onClick={fetchEvents}
                className="h-14 px-10 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-blue/20 gap-2"
              >
                <RefreshCcw size={20} /> Try Again
              </Button>
            </div>
          )}

          {!loading && !fetchError && events.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,74,173,0.03)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 text-brand-blue border border-slate-100 transform -rotate-6">
                  <Search size={48} />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">No events found</h3>
                <p className="text-slate-500 text-xl max-w-md mx-auto font-medium leading-relaxed">
                  We couldn't find any activities matching your filters. Why not suggest one to the SK?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
                  <Button 
                    onClick={() => {setSearchQuery(""); setSelectedCategory(null); setPage(1);}}
                    variant="outline"
                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest border-2 border-slate-200 hover:bg-white"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => setIsSuggestModalOpen(true)}
                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest bg-brand-green hover:bg-brand-green/90 text-white shadow-xl shadow-brand-green/20"
                  >
                    Suggest Activity
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </section>
      </div>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => {
        if (!open) {
          setSelectedEvent(null);
          setCurrentImageIndex(0);
        }
      }}>
        <DialogContent 
          showCloseButton={false}
          className="sm:max-w-5xl rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden bg-white"
        >
          {selectedEvent && (
            <div className="flex flex-col lg:flex-row min-h-[600px]">
              {/* Custom Close Button */}
              <Button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-6 right-6 z-50 w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/10"
              >
                <PlusCircle size={24} className="rotate-45" />
              </Button>

              {/* Left Side: Image & Title */}
              <div className="lg:w-2/5 relative min-h-[400px] lg:min-h-full group/carousel">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={getEventImages(selectedEvent.image_url)[currentImageIndex]} 
                    alt={selectedEvent.title} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                </AnimatePresence>
                
                {getEventImages(selectedEvent.image_url).length > 1 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const images = getEventImages(selectedEvent.image_url);
                        setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white border-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={24} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const images = getEventImages(selectedEvent.image_url);
                        setCurrentImageIndex(prev => (prev + 1) % images.length);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white border-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={24} />
                    </Button>
                    
                    {/* Dots */}
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {getEventImages(selectedEvent.image_url).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-10 left-10 right-10 pointer-events-none">
                  <Badge className="bg-brand-blue text-white mb-4 rounded-full px-4 py-1 font-black tracking-widest border-none">
                    {CATEGORIES.find(c => c.id === selectedEvent.category)?.name.toUpperCase()}
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">{selectedEvent.title}</h2>
                </div>
              </div>
              
              {/* Right Side: Details */}
              <div className="lg:w-3/5 p-10 lg:p-14 space-y-10 overflow-y-auto max-h-[90vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">When</p>
                    <div className="space-y-2">
                      <p className="font-black text-slate-900 flex items-center gap-3 text-xl"><Calendar size={20} className="text-brand-blue" /> {selectedEvent.event_date}</p>
                      <p className="font-bold text-slate-500 flex items-center gap-3 text-lg"><Clock size={20} className="text-brand-blue" /> {selectedEvent.event_time}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Where</p>
                    <p className="font-black text-slate-900 flex items-center gap-3 text-xl"><MapPin size={20} className="text-brand-red" /> {selectedEvent.location}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">About the Event</p>
                  <p className="text-slate-600 leading-relaxed text-lg">{selectedEvent.description}</p>
                </div>

                {/* Social Proof: Who's Going? */}
                <div className="space-y-6 pt-8 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Who's Going?</p>
                    <p className="text-xs font-bold text-brand-blue">{selectedEvent.registrations || 0} barkadas attending</p>
                  </div>
                  <div className="flex items-center -space-x-3 overflow-hidden">
                    {[...Array(Math.min(6, selectedEvent.registrations || 0))].map((_, i) => (
                      <div key={i} className="inline-block h-14 w-14 rounded-2xl ring-4 ring-white bg-slate-100 border border-slate-200 overflow-hidden">
                        <img 
                          src={`https://i.pravatar.cc/150?u=${selectedEvent.id + i}`} 
                          alt="Attendee" 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                    {(selectedEvent.registrations || 0) > 6 && (
                      <div className="flex items-center justify-center h-14 w-14 rounded-2xl ring-4 ring-white bg-brand-blue/10 text-brand-blue text-sm font-black border border-brand-blue/20">
                        +{(selectedEvent.registrations || 0) - 6}
                      </div>
                    )}
                    <p className="ml-6 text-sm font-bold text-slate-500 italic">Join them and make new friends!</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-10 border-t border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                      <UserIcon size={28} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hosted By</p>
                      <p className="font-black text-slate-900 text-xl">{selectedEvent.organizer_name}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      if (!isRegistered.includes(selectedEvent.id)) {
                        handleRegisterClick(selectedEvent);
                      }
                    }}
                    className={`h-16 px-14 rounded-[1.5rem] font-black uppercase text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto ${
                      isRegistered.includes(selectedEvent.id) 
                        ? "bg-brand-green hover:bg-brand-green/90 text-white shadow-brand-green/20" 
                        : "bg-brand-blue hover:bg-brand-dark-blue shadow-brand-blue/20"
                    }`}
                  >
                    {isRegistered.includes(selectedEvent.id) ? "REGISTERED" : "REGISTER NOW"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suggest Event Modal */}
      <Dialog open={isSuggestModalOpen} onOpenChange={setIsSuggestModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl bg-white">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green mx-auto">
              <PlusCircle size={32} />
            </div>
            <DialogTitle className="text-3xl font-black text-center text-slate-900 tracking-tight">Suggest an Event</DialogTitle>
            <DialogDescription className="text-center text-slate-500 font-medium">
              Have a great idea for a youth activity in New Cabalan? Let us know and we'll help make it happen!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
              <Input 
                placeholder="e.g. Youth Art Festival" 
                className="h-14 rounded-2xl border-slate-200 focus:ring-brand-green"
                value={suggestion.title}
                onChange={(e) => setSuggestion({...suggestion, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tell us more</label>
              <Textarea 
                placeholder="Describe your event idea..." 
                className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-brand-green p-4"
                value={suggestion.description}
                onChange={(e) => setSuggestion({...suggestion, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                toast.success("Suggestion Sent", {
                  description: "Thank you! Your idea has been sent to the SK admins for review.",
                });
                setIsSuggestModalOpen(false);
                setSuggestion({ title: "", description: "" });
              }}
              disabled={!suggestion.title || !suggestion.description}
              className="w-full h-16 bg-brand-green hover:bg-brand-green/90 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-green/20 gap-3"
            >
              <Send size={18} /> Send Suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden">
          {eventToRegister && (
            <div className="flex flex-col">
              <div className="bg-brand-blue p-8 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight">Confirm Registration</DialogTitle>
                  <DialogDescription className="text-white/80 font-medium">
                    Please review your saved profile details for <span className="text-white font-bold">{eventToRegister.title}</span>.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Details</p>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <UserIcon size={16} className="text-brand-blue" /> {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Calendar size={16} className="text-brand-blue" /> {user?.birthday} ({user?.age} years old)
                      </p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <UserIcon size={16} className="text-brand-blue" /> {user?.gender}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Location</p>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Phone size={16} className="text-brand-blue" /> {user?.mobileNumber}
                      </p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <MapPin size={16} className="text-brand-blue" /> {user?.street}, {user?.purok}
                      </p>
                    </div>
                  </div>
                </div>

                {user?.age && user.age < 18 && (
                  <div className="p-4 bg-brand-red/5 border border-brand-red/10 rounded-2xl">
                    <p className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-2">Guardian Info Attached</p>
                    <p className="text-sm font-bold text-slate-700">{user.parentName} ({user.parentContact})</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Additional Information (Optional)</label>
                  <Textarea 
                    placeholder="e.g. Food allergies, medical conditions, or any questions for the organizer..." 
                    className="min-h-[100px] rounded-2xl border-slate-200 p-4 focus:ring-brand-blue"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 font-medium">To update your saved details, visit your Profile page.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 h-14 rounded-2xl text-lg font-bold text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={confirmRegistration}
                    className="flex-[2] h-14 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl text-lg font-bold shadow-lg shadow-brand-blue/20"
                  >
                    Confirm Registration
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
