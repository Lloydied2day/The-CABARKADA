import { Users, Heart } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  if (isAdminPage) return null;

  const isEventsPage = location.pathname === "/events";
  const isProfilePage = location.pathname === "/profile";
  const shouldHideLinks = isEventsPage || isProfilePage;

  return (
    <footer className="bg-slate-950 text-slate-400 py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green via-brand-red to-brand-blue" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-baseline font-black text-3xl tracking-tighter mb-8">
              <span className="text-brand-green">C</span>
              <span className="text-brand-red">A</span>
              <span className="text-brand-dark-blue">B</span>
              <span className="text-brand-blue">arkada</span>
            </div>
            <p className="max-w-md mb-8 text-lg leading-relaxed">
              The official event information system for the youth of New Cabalan. 
              Connecting barkadas through meaningful experiences and community engagement.
            </p>
          </div>
          {!shouldHideLinks && (
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li><a href="/" className="hover:text-brand-blue transition-all font-bold">Home</a></li>
                <li><a href="/#highlights" className="hover:text-brand-blue transition-all font-bold">Posts</a></li>
                <li><a href="/#about" className="hover:text-brand-blue transition-all font-bold">About Us</a></li>
              </ul>
            </div>
          )}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Contact</h4>
            <p className="text-base font-bold text-slate-300">New Cabalan, Olongapo City</p>
            <p className="text-base mt-2 font-bold text-brand-blue">info@cabarkada.gov</p>
          </div>
        </div>
        <div className="border-t border-slate-900 pt-10 text-center text-sm">
          <p className="flex items-center justify-center gap-2 font-bold">
            © 2026 CABarkada. Built with <Heart size={16} className="text-brand-red fill-brand-red" /> for New Cabalan Youth.
          </p>
        </div>
      </div>
    </footer>
  );
}
