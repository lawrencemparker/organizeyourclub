import { Link } from "react-router-dom";
import { 
  ShieldCheck, Users, Calendar, Wallet, FileText, 
  Mail, ArrowRight, LayoutDashboard, CheckCircle2, Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const features = [
    {
      title: "Member Roster & Roles",
      description: "Manage your entire organization in one place. Assign custom roles, track active statuses, and maintain a centralized directory.",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      title: "Dynamic Event Board",
      description: "Schedule meetings, socials, and workshops with beautiful color-coded cards. Automatically filters past and future events.",
      icon: Calendar,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    {
      title: "Treasury & Finances",
      description: "Keep a transparent ledger of all income and expenses. Track current balances, categorize transactions, and export to CSV.",
      icon: Wallet,
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    {
      title: "Cloud Document Hub",
      description: "A secure, centralized repository for chapter files. Seamlessly integrates with Google Drive to attach living documents.",
      icon: Cloud,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10"
    },
    {
      title: "Requirement Compliance",
      description: "Never miss a deadline. Track university and national chapter compliance tasks with visual progress bars and overdue alerts.",
      icon: FileText,
      color: "text-rose-400",
      bg: "bg-rose-400/10"
    },
    {
      title: "Bulk Communications",
      description: "Send professional, branded emails directly to your members. Features a complete audit trail and history log of all outgoing messages.",
      icon: Mail,
      color: "text-teal-400",
      bg: "bg-teal-400/10"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white selection:bg-[var(--primary)] selection:text-white overflow-hidden">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center font-black text-white">
              OC
            </div>
            <span className="font-bold text-lg tracking-tight">Organize Your Club</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Sign In
            </Link>
            <Button asChild className="bg-[var(--primary)] text-white hover:opacity-90 rounded-full px-6">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--primary)]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
            </span>
            The Ultimate Management Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
            Run your organization <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              like a well-oiled machine.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Replace scattered spreadsheets, messy group chats, and lost files with a single, secure platform built specifically for chapters, clubs, and student organizations.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-8 text-base bg-[var(--primary)] text-white hover:opacity-90 rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] w-full sm:w-auto">
              <Link to="/register">Start Organizing Free <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 hover:bg-white/5 text-white rounded-full w-full sm:w-auto">
              <Link to="/login">View Live Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW (MOCKUP) */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl border border-white/10 p-2 shadow-2xl bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                <Button variant="secondary" className="bg-white text-black hover:bg-gray-200 rounded-full font-bold shadow-2xl">
                   <LayoutDashboard className="w-4 h-4 mr-2" /> Explore the Dashboard
                </Button>
             </div>
             {/* Abstract representation of the UI to look cool behind the blur */}
             <div className="h-[400px] w-full rounded-xl bg-[#0B0F1A] border border-white/5 p-6 flex gap-6">
                <div className="w-48 hidden md:flex flex-col gap-3">
                   <div className="h-4 w-24 bg-white/10 rounded mb-4" />
                   {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-full bg-white/5 rounded" />)}
                </div>
                <div className="flex-1 flex flex-col gap-6">
                   <div className="h-12 w-full bg-white/5 rounded-xl" />
                   <div className="grid grid-cols-3 gap-4">
                     {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5" />)}
                   </div>
                   <div className="flex-1 bg-white/5 rounded-xl border border-white/5" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 px-6 relative border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Everything you need, <br/>nothing you don't.</h2>
            <p className="text-muted-foreground text-lg">Powerful features wrapped in a beautiful, intuitive interface that your members will actually want to use.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="glass-card p-8 rounded-2xl border border-white/5 hover:border-[var(--primary)]/30 transition-all duration-300 group hover:-translate-y-1 bg-gradient-to-br from-white/[0.03] to-transparent">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/5 transition-colors", feature.bg, feature.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RBAC / SECURITY SPOTLIGHT */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--primary)]/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Enterprise-Grade Security
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Strict isolation and <br/>granular permissions.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Not every member needs access to the treasury, and not every officer needs to edit the roster. Our advanced Role-Based Access Control (RBAC) lets you dial in exact permissions.
            </p>
            
            <ul className="space-y-4">
              {[
                "Strict CRUD (Create, Read, Update, Delete) matrix.",
                "Organization-level data isolation prevents ghost-data bleeding.",
                "Real-time URL routing security to prevent unauthorized access."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[var(--primary)] shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 w-full">
            <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-2xl relative">
              {/* Mockup of the Permissions Matrix we built */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <p className="font-bold text-sm">Boomer Parker</p>
                    <p className="text-xs text-muted-foreground">Member</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/30">
                    Permissions Saved
                  </div>
                </div>
                {[
                  { name: "Finances", c: false, r: false, u: false, d: false },
                  { name: "Events", c: true, r: true, u: false, d: false },
                  { name: "Members", c: false, r: true, u: false, d: false }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-sm font-medium">{row.name}</span>
                    <div className="flex gap-2">
                       {['Read', 'Create', 'Update'].map((action, j) => (
                         <div key={j} className={cn("w-6 h-6 rounded flex items-center justify-center border text-[10px] font-bold", row.c || row.r ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-transparent text-muted-foreground")}>
                            {action[0]}
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-24 px-6 border-t border-white/5 relative text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Ready to transform your club?</h2>
          <p className="text-xl text-muted-foreground">Join the organizations that have already streamlined their operations, secured their data, and engaged their members.</p>
          <Button asChild size="lg" className="h-14 px-10 text-lg bg-[var(--primary)] text-white hover:opacity-90 rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)]">
            <Link to="/register">Create Your Organization</Link>
          </Button>
        </div>
      </section>

      <footer className="py-8 border-t border-white/5 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Organize Your Club. All rights reserved.</p>
      </footer>

    </div>
  );
}