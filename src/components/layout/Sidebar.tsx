import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, Users, Calendar, History, Settings, LogOut, ShieldCheck, ClipboardCheck, Wallet, FileText, ChevronDown } from "lucide-react";
// ... (keep your existing imports)

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // ... (keep your existing state and useEffect hooks)

  return (
    <>
      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0B0F1A] border-b border-white/10 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold">
             {orgData?.name ? orgData.name.substring(0, 2).toUpperCase() : "OC"}
           </div>
           <span className="font-bold text-white truncate max-w-[200px]">{orgData?.name || "Loading..."}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE OVERLAY DIMMER */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* THE SIDEBAR (Hidden on mobile unless toggled, fixed on desktop) */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 bg-[#0B0F1A] border-r border-border/40 w-64 flex flex-col h-full shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* ... Paste your existing Sidebar Dropdown and Nav Links Here ... */}
        
        {/* Add this to your Nav Links so the menu closes when a user taps a link on mobile */}
        {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)} // Closes menu on tap
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group",
                  isActive ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" /> {/* Slightly larger icons for touch */}
                {item.label}
              </Link>
            );
        })}
      </div>
    </>
  );
}