import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, Users, Calendar, Wallet, FileText, 
  Mail, ArrowRight, CheckCircle2, Cloud, Loader2, ZoomIn, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

export function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "2c56aac9-4872-4c9f-b033-ee5d99eb8ca8",
          subject: "New Inquiry from Organize Your Club",
          from_name: "Organize Your Club Landing Page",
          ...formData
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Message sent! We will be in touch shortly.");
        setIsModalOpen(false);
        setFormData({ name: "", email: "", phone: "", source: "", message: "" });
      } else {
        throw new Error(result.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { title: "Member Roster & Roles", description: "Manage your entire organization in one place. Assign custom roles, track active statuses, and maintain a centralized directory.", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", image: "/screenshots/Members.png" },
    { title: "Dynamic Event Board", description: "Schedule meetings, socials, and workshops with beautiful color-coded cards. Automatically filters past and future events.", icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-400/10", image: "/screenshots/Events.png" },
    { title: "Treasury & Finances", description: "Keep a transparent ledger of all income and expenses. Track current balances, categorize transactions, and export to CSV.", icon: Wallet, color: "text-amber-400", bg: "bg-amber-400/10", image: "/screenshots/Finances.png" },
    { title: "Cloud Document Hub", description: "A secure, centralized repository for chapter files. Seamlessly integrates with Google Drive to attach living documents.", icon: Cloud, color: "text-indigo-400", bg: "bg-indigo-400/10", image: "/screenshots/Documents.png" },
    { title: "Requirement Compliance", description: "Never miss a deadline. Track university and national chapter compliance tasks with visual progress bars and overdue alerts.", icon: FileText, color: "text-rose-400", bg: "bg-rose-400/10", image: "/screenshots/Compliance.png" },
    { title: "Bulk Communications", description: "Send professional, branded emails directly to your members. Features a complete audit trail and history log of all outgoing messages.", icon: Mail, color: "text-teal-400", bg: "bg-teal-400/10", image: "/screenshots/History.png" }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white selection:bg-[var(--primary)] selection:text-white overflow-hidden">
      
      {/* NAVIGATION - "OC" Badge Removed */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">Organize Your Club</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Sign In
            </Link>
            <Button onClick={() => setIsModalOpen(true)} className="bg-[var(--primary)] text-white hover:opacity-90 rounded-full px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - "View Live Demo" Removed */}
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
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="h-14 px-8 text-base bg-[var(--primary)] text-white hover:opacity-90 rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] w-full sm:w-auto">
              Start Organizing Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW - Using .png extension */}
      <section className="px-6 pb-24 relative z-20">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => setSelectedImage("/screenshots/Overview.png")} 
            className="w-full text-left glass-card rounded-2xl border border-white/10 p-2 shadow-2xl bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden group cursor-zoom-in"
          >
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button variant="secondary" className="bg-white text-black hover:bg-gray-200 rounded-full font-bold shadow-2xl transition-transform transform scale-95 group-hover:scale-100 pointer-events-none">
                   <ZoomIn className="w-4 h-4 mr-2" /> View Full Screenshot
                </Button>
             </div>
             <img 
               src="/screenshots/Overview.png" 
               alt="Organize Your Club Dashboard Overview" 
               className="w-full rounded-xl border border-white/5 shadow-2xl object-cover"
             />
          </button>
        </div>
      </section>

      {/* FEATURES GRID - Using .png extensions */}
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
                <div key={idx} className="glass-card flex flex-col p-6 rounded-2xl border border-white/5 hover:border-[var(--primary)]/30 transition-all duration-300 group hover:-translate-y-1 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
                  <div className="flex-1">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/5 transition-colors", feature.bg, feature.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">{feature.description}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedImage(feature.image)} 
                    className="w-full mt-auto relative rounded-xl overflow-hidden border border-white/10 shadow-lg group-hover:shadow-[var(--primary)]/20 transition-all cursor-zoom-in"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent z-10 opacity-80" />
                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full border border-white/20">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="w-full object-cover object-left-top h-48 sm:h-40 group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RBAC SPOTLIGHT */}
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
              Not every member needs access to the treasury, and not every officer needs to edit the roster. Our advanced Role-Based Access Control lets you dial in exact permissions.
            </p>
            <ul className="space-y-4">
              {["Strict CRUD (Create, Read, Update, Delete) matrix.", "Organization-level data isolation prevents ghost-data bleeding.", "Real-time URL routing security to prevent unauthorized access."].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[var(--primary)] shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-2xl relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div><p className="font-bold text-sm">Boomer Parker</p><p className="text-xs text-muted-foreground">Member</p></div>
                  <div className="px-2 py-1 rounded bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/30">Permissions Saved</div>
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
                         <div key={j} className={cn("w-6 h-6 rounded flex items-center justify-center border text-[10px] font-bold", row.c || row.r ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-transparent text-muted-foreground")}>{action[0]}</div>
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
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="h-14 px-10 text-lg bg-[var(--primary)] text-white hover:opacity-90 rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)]">
            Create Your Organization
          </Button>
        </div>
      </section>

      <footer className="py-8 border-t border-white/5 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Organize Your Club. All rights reserved.</p>
      </footer>

      {/* LEAD CAPTURE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-[#0B0F1A] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
          {/* Mobile-Friendly Close Button */}
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute right-4 top-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors md:hidden"
            aria-label="Close modal"
          >
            <Plus className="w-6 h-6 rotate-45 text-white" />
          </button>

          <div className="h-2 w-full bg-[var(--primary)] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
          </div>
          
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-2xl font-black pr-8">Get Started Today</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Want to learn more about how we can streamline your chapter's operations? Fill out the details below to request more information or a personalized demo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name <span className="text-[var(--primary)]">*</span></Label>
                  <Input 
                    name="name" value={formData.name} onChange={handleInputChange} required
                    placeholder="Jane Doe" 
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address <span className="text-[var(--primary)]">*</span></Label>
                  <Input 
                    name="email" type="email" value={formData.email} onChange={handleInputChange} required
                    placeholder="jane@university.edu" 
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                  <Input 
                    name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                    placeholder="(555) 123-4567" 
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">How did you find us?</Label>
                  <Input 
                    name="source" value={formData.source} onChange={handleInputChange}
                    placeholder="Google, Referral, etc." 
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="space-y-2 flex-1 flex flex-col">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</Label>
                  <textarea 
                    name="message" value={formData.message} onChange={handleInputChange}
                    placeholder="Tell us a little about your organization and how we can help..."
                    className="flex-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none min-h-[150px]"
                  />
                </div>
              </div>
              <div className="md:col-span-2 pt-4 flex justify-end border-t border-white/5 mt-2">
                <Button 
                  type="button" variant="ghost" onClick={() => setIsModalOpen(false)} 
                  className="mr-3 text-muted-foreground hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[var(--primary)] text-white hover:opacity-90 min-w-[140px]">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isSubmitting ? "Sending..." : "Submit Inquiry"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* IMAGE LIGHTBOX */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-7xl h-auto bg-[#0B0F1A] border-white/10 text-white p-4 overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 relative cursor-zoom-out" onClick={() => setSelectedImage(null)}>
             <img 
                src={selectedImage || ""} 
                alt="Enlarged screenshot" 
                className="w-auto h-auto max-w-full max-h-[85vh] rounded-lg border-2 border-white/5 object-contain mx-auto shadow-2xl"
              />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}