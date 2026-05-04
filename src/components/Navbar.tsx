import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/src/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut, LayoutDashboard, Menu, X, Bell } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isAdminPage = location.pathname.startsWith("/admin");

  if (isAdminPage) return null;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsOpen(false);
    }
  };

  const navLinks = [
    { name: "Home", id: "home", href: "/#home" },
    { name: "Posts", id: "highlights", href: "/#highlights" },
    { name: "About Us", id: "about", href: "/#about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-24 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
        <Link to={user ? "/events" : "/"} className="flex items-baseline font-black text-3xl tracking-tighter group">
          <span className="text-brand-green group-hover:scale-110 transition-transform">C</span>
          <span className="text-brand-red group-hover:scale-110 transition-transform">A</span>
          <span className="text-brand-dark-blue group-hover:scale-110 transition-transform">B</span>
          <span className="text-brand-blue group-hover:scale-110 transition-transform">arkada</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-10">
          {!["/events", "/profile", "/admin", "/admin-portal"].includes(location.pathname) && (
            <>
              {navLinks.map((link) => (
                <Link 
                  key={link.id}
                  to={link.href} 
                  onClick={(e) => handleNavClick(e, link.id)}
                  className="text-slate-600 hover:text-brand-blue font-black tracking-tight text-lg transition-all hover:scale-105"
                >
                  {link.name}
                </Link>
              ))}
            </>
          )}
          {user && !["/", "/admin", "/admin-portal"].includes(location.pathname) && (
            <Link 
              to="/events" 
              className={`font-black tracking-tight text-lg transition-all hover:scale-105 ${location.pathname === '/events' ? 'text-brand-blue' : 'text-slate-600 hover:text-brand-blue'}`}
            >
              Events
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && <NotificationBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-900 leading-none">{user.firstName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {user.id === 0 ? "Guest" : "Member"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
                    <UserCircle size={24} />
                  </div>
                </motion.button>
              } />
              <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 shadow-2xl border-none mt-2">
                <div className="px-4 py-4 border-b border-slate-50 mb-2">
                  <p className="font-black text-slate-900 text-lg">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-slate-500 truncate">{user.email}</p>
                  {user.id === 0 && (
                    <Badge className="mt-2 bg-brand-blue/10 text-brand-blue border-none font-bold">
                      Guest Account
                    </Badge>
                  )}
                </div>
                <DropdownMenuItem 
                  onClick={() => navigate("/profile")}
                  className="rounded-xl h-12 px-4 font-bold gap-3 cursor-pointer hover:bg-slate-50"
                >
                  <UserCircle size={18} className="text-brand-red" />
                  My Barkada Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/events")}
                  className="rounded-xl h-12 px-4 font-bold gap-3 cursor-pointer hover:bg-slate-50 mt-1"
                >
                  <LayoutDashboard size={18} className="text-brand-blue" />
                  Events Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={logout} 
                  className="text-brand-red font-bold rounded-xl h-12 px-4 gap-3 cursor-pointer hover:bg-brand-red/5 mt-1"
                >
                  <LogOut size={18} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="hidden sm:block">
              <Button className="bg-brand-blue hover:bg-brand-dark-blue rounded-xl font-black px-6 h-12 shadow-lg shadow-brand-blue/20">
                LOGIN
              </Button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="md:hidden rounded-xl bg-slate-50 border border-slate-100">
                <Menu size={24} className="text-brand-blue" />
              </Button>
            } />
            <SheetContent side="right" className="w-[300px] bg-white border-none rounded-l-[3rem] p-8">
              <SheetHeader className="mb-10">
                <SheetTitle className="flex items-baseline font-black text-3xl tracking-tighter">
                  <span className="text-brand-green">C</span>
                  <span className="text-brand-red">A</span>
                  <span className="text-brand-dark-blue">B</span>
                  <span className="text-brand-blue">arkada</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-6">
                {!["/events", "/profile", "/admin", "/admin-portal"].includes(location.pathname) && (
                  <>
                    {navLinks.map((link) => (
                      <Link 
                        key={link.id}
                        to={link.href} 
                        onClick={(e) => handleNavClick(e, link.id)}
                        className="text-2xl font-black text-slate-900 hover:text-brand-blue transition-colors"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </>
                )}
                {user && (
                  <>
                    <Link 
                      to="/events" 
                      onClick={() => setIsOpen(false)}
                      className="text-2xl font-black text-slate-900 hover:text-brand-blue transition-colors"
                    >
                      Events
                    </Link>
                    <Link 
                      to="/profile" 
                      onClick={() => setIsOpen(false)}
                      className="text-2xl font-black text-slate-900 hover:text-brand-blue transition-colors"
                    >
                      My Dashboard
                    </Link>
                  </>
                )}
                {!user && (
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-brand-blue hover:bg-brand-dark-blue rounded-2xl font-black h-14 text-lg shadow-xl shadow-brand-blue/20">
                      LOGIN
                    </Button>
                  </Link>
                )}
                {user && (
                  <Button 
                    variant="ghost" 
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full justify-start gap-4 text-brand-red font-black text-xl hover:bg-brand-red/5 rounded-2xl h-14"
                  >
                    <LogOut size={24} />
                    Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
