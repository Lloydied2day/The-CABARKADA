import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowRight, Sparkles, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";

const RECENT_EVENTS = [
  { id: 1, image: "https://picsum.photos/seed/empty1/800/600?grayscale&blur=10", title: " " },
  { id: 2, image: "https://picsum.photos/seed/empty2/800/600?grayscale&blur=10", title: " " },
  { id: 3, image: "https://picsum.photos/seed/empty3/800/600?grayscale&blur=10", title: " " },
];

const HIGHLIGHT_EVENTS = [
  {
    id: 101,
    title: " ",
    date: " ",
    location: " ",
    image: "https://picsum.photos/seed/empty4/800/400?grayscale&blur=10",
    description: " "
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const [adminClicks, setAdminClicks] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/events");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (adminClicks === 15) {
      navigate("/admin-portal");
    }
    const timer = setTimeout(() => setAdminClicks(0), 3000);
    return () => clearTimeout(timer);
  }, [adminClicks, navigate]);

  const handleAdminTrigger = () => {
    setAdminClicks(prev => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section id="home" className="relative py-24 md:py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6 px-6 py-2 bg-brand-blue/10 rounded-full border border-brand-blue/20 cursor-default select-none"
              onClick={handleAdminTrigger}
            >
              <span className="text-brand-blue font-bold tracking-wide uppercase text-sm">Official Youth Portal</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]"
            >
              Empowering the Youth of <span className="text-brand-blue">New Cabalan</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto"
            >
              Join the barkada, discover your passions, and make a real impact in our community.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-6"
            >
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto px-10 h-16 text-xl bg-brand-blue hover:bg-brand-dark-blue rounded-3xl shadow-2xl shadow-brand-blue/30 transition-all hover:scale-105 active:scale-95">
                  Login to Account
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 h-16 text-xl border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5 rounded-3xl transition-all hover:scale-105 active:scale-95">
                  Create New Account
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Lively Background Accents */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-brand-green/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,white_100%)] z-0" />
      </section>

      {/* Past Highlights Section - Image Strip */}
      <section id="highlights" className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Past <span className="text-brand-red">Highlights</span></h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">A glimpse into our vibrant community events.</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row w-full h-[400px] md:h-[500px]">
          {RECENT_EVENTS.map((event) => (
            <motion.div
              key={event.id}
              whileHover={{ flex: 1.5 }}
              className="relative flex-1 group overflow-hidden cursor-pointer transition-all duration-500 ease-in-out"
            >
              <img 
                src={event.image} 
                alt={event.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                <h3 className="text-3xl font-black text-white mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{event.title}</h3>
                <p className="text-white/80 font-bold uppercase tracking-widest text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">Successfully held in New Cabalan</p>
              </div>
              {/* Static overlay for mobile or non-hover */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent md:hidden">
                <h3 className="text-xl font-black text-white">{event.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Community Section (Posts) */}
      <section id="posts" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">Our <span className="text-brand-green">Community</span></h2>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-12">
            Join a vibrant community of youth in New Cabalan. Share your experiences, learn from others, and grow together. Our platform is designed to keep you informed and connected.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl">
              <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue mb-6 mx-auto">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-black mb-4">Stay Updated</h3>
              <p className="text-slate-600">Get real-time notifications about upcoming events and community news.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl">
              <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green mb-6 mx-auto">
                <UserIcon size={24} />
              </div>
              <h3 className="text-xl font-black mb-4">Connect</h3>
              <p className="text-slate-600">Meet fellow youth members who share your interests and passions.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl">
              <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center text-brand-red mb-6 mx-auto">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-black mb-4">Participate</h3>
              <p className="text-slate-600">Easily register for events and track your participation history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">About <span className="text-brand-blue">CABarkada</span></h2>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                CABarkada is the premier event information system dedicated to the youth of New Cabalan. Our mission is to foster community engagement, personal growth, and lasting friendships by providing a centralized platform for discovering and participating in local activities.
              </p>
              <p className="text-xl text-slate-600 leading-relaxed mb-12">
                Whether you're interested in sports, arts, education, or community service, CABarkada connects you with the opportunities that matter most to you. Join our growing community today and start making an impact.
              </p>
              <Link to="/register">
                <Button size="lg" className="bg-brand-blue hover:bg-brand-dark-blue rounded-2xl h-16 px-10 text-lg font-black shadow-xl shadow-brand-blue/20">
                  Join the Barkada Now
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/community/800/800" 
                  alt="Community" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-brand-green p-8 rounded-[2rem] shadow-2xl text-white max-w-xs">
                <p className="text-2xl font-black mb-2">500+</p>
                <p className="font-bold text-green-50">Active youth members in New Cabalan</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
