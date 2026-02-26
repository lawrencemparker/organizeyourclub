import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Building2, Users, Home, Key, User, Trash2, Ban, Mail, Phone, DollarSign, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Organization {
  id: string;
  name: string;
  slug?: string; 
  owner_id?: string;
  chapter: string;
  admin_name: string;
  admin_email: string;
  phone: string;
  monthly_fee?: number;
  is_suspended?: boolean;
  created_at?: string;
  building_name?: string;
  floor_number?: number;
  unit_number?: number;
  grid_index?: number;
}

const SUPER_ADMIN_EMAIL = "lawrencemparker@yahoo.com";
const TOTAL_UNITS = 44;
const UNITS_PER_BUILDING = 11;

const BUILDINGS = [
  { id: 'A', name: 'Brownstone A', color: 'bg-[#A0522D]', accent: 'bg-[#8B4513]' },
  { id: 'B', name: 'Ironside B', color: 'bg-[#3E2723]', accent: 'bg-[#2D1B17]' },
  { id: 'C', name: 'Sandstone C', color: 'bg-[#D4A373]', accent: 'bg-[#C29362]' },
  { id: 'D', name: 'Copperfield D', color: 'bg-[#8D4004]', accent: 'bg-[#7A3603]' },
];

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');   
};

export function TenantAdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Organization>>({});
  const [activeLocation, setActiveLocation] = useState<{index: number, building: string, floor: number, unit: number} | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }
    if (user.email !== SUPER_ADMIN_EMAIL) {
      toast.error("Unauthorized Access");
      navigate('/overview');
      return;
    }
    fetchOrganizations();
  }, [user, authLoading, navigate]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleWindowClick = (unitIndex: number, bIndex: number, floorIndex: number) => {
    const org = organizations.find(o => o.grid_index === unitIndex);
    const buildingName = BUILDINGS[bIndex].name;
    const floorNumber = floorIndex + 1; 
    const unitNumber = unitIndex + 1;

    setActiveLocation({ index: unitIndex, building: buildingName, floor: floorNumber, unit: unitNumber });

    if (org) {
      setFormData(org);
    } else {
      setFormData({ name: "", chapter: "", admin_name: "", admin_email: "", phone: "", monthly_fee: 250, is_suspended: false });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Organization Name is required");
    if (!user) return toast.error("Authentication required");
    if (!activeLocation) return toast.error("Location error");

    const locationData = {
      grid_index: activeLocation.index,
      building_name: activeLocation.building,
      floor_number: activeLocation.floor,
      unit_number: activeLocation.unit
    };

    let newOrgId: string | null = null;

    try {
      if (formData.id) {
        const payload = { ...formData, ...locationData };
        const { error } = await supabase.from('organizations').update(payload).eq('id', formData.id);
        if (error) throw error;
        toast.success("Tenant updated successfully");

      } else {
        const payload = {
          ...formData,
          ...locationData,
          slug: generateSlug(formData.name),
          owner_id: user.id
        };

        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert([payload])
          .select()
          .single();
        if (orgError) throw orgError;
        newOrgId = newOrg.id;

        if (newOrg && formData.admin_email) {
          const { error: memberError } = await supabase.from('members').insert([{
            org_id: newOrg.id,
            full_name: formData.admin_name || "Organization Admin",
            email: formData.admin_email,
            status: 'Pending',
            role: 'admin'
          }]);
          if (memberError) throw memberError;

          const orgFullName = formData.chapter
            ? `${formData.name} - ${formData.chapter}`
            : formData.name;

          const { error: inviteError } = await supabase.functions.invoke("invite-org-admin", {
            body: {
              email: formData.admin_email,
              orgFullName,
              redirectTo: `${window.location.origin}/`,
            },
          });
          if (inviteError) throw inviteError;
        }

        toast.success("New tenant registered and admin invited!");
      }

      setIsDialogOpen(false);
      fetchOrganizations();

    } catch (error: any) {
      if (newOrgId) {
        await supabase.from('members').delete().eq('org_id', newOrgId);
        await supabase.from('organizations').delete().eq('id', newOrgId);
        newOrgId = null;
      }

      if (error.message?.includes('unique_grid_index')) {
        toast.error("This window is already occupied by another tenant.");
      } else {
        toast.error(error.message || "Failed to save tenant");
      }
    }
  };

  const handleDelete = async () => {
    if (!formData.id || !confirm(`Are you sure you want to evict ${formData.name}?`)) return;
    try {
      // With Cascade Delete enabled in Supabase, deleting the org deletes the members/profiles automatically
      const { error: orgError } = await supabase.from('organizations').delete().eq('id', formData.id);
      if (orgError) throw orgError;

      toast.success("Tenant removed successfully");
      setIsDialogOpen(false);
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast.error(error.message || "Failed to remove tenant");
    }
  };

  const handleSuspendToggle = async () => {
    if (!formData.id) return;
    const newStatus = !formData.is_suspended;
    const confirmMsg = newStatus ? `Suspend ${formData.name}? Users will be locked out.` : `Reactivate ${formData.name}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase.from('organizations').update({ is_suspended: newStatus }).eq('id', formData.id);
      if (error) throw error;
      toast.success(newStatus ? "Tenant is now suspended" : "Tenant reactivated");
      setIsDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      toast.error("Failed to update suspension status");
    }
  };

  const occupiedCount = organizations.filter(org => org.grid_index !== undefined && org.grid_index !== null).length;
  const vacantCount = TOTAL_UNITS - occupiedCount;
  const occupancyRate = Math.round((occupiedCount / TOTAL_UNITS) * 100);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center font-bold text-sky-800">
      Loading Admin Center...
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* SIGN OUT BUTTON */}
      <div className="absolute top-6 right-6 z-50">
        <Button 
          onClick={handleSignOut} 
          variant="outline" 
          className="bg-white/80 hover:bg-white text-slate-800 font-bold border-white/50 shadow-sm rounded-full px-5"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <div className="absolute top-12 left-20 w-32 h-10 bg-white/60 rounded-full blur-xl" />
      <div className="absolute top-24 right-40 w-48 h-14 bg-white/50 rounded-full blur-xl" />

      <div className="z-10 w-full max-w-5xl mx-auto pt-8 px-4">
        <div className="flex flex-col items-center mb-6 text-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/80 rounded-xl shadow-sm flex items-center justify-center text-rose-700">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight font-serif text-slate-900">Tenant Admin Center</h1>
          </div>
          <p className="text-sm font-medium text-slate-600">Click on any window to manage a tenant</p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-2 flex justify-center divide-x divide-slate-200">
          <div className="px-6 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><Building2 className="w-4 h-4" /></div>
            <div><p className="text-xs text-slate-500 font-bold uppercase">Total Units</p><p className="text-lg font-black text-slate-800">{TOTAL_UNITS}</p></div>
          </div>
          <div className="px-6 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><Users className="w-4 h-4" /></div>
            <div><p className="text-xs text-slate-500 font-bold uppercase">Occupied</p><p className="text-lg font-black text-slate-800">{occupiedCount}</p></div>
          </div>
          <div className="px-6 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600"><Home className="w-4 h-4" /></div>
            <div><p className="text-xs text-slate-500 font-bold uppercase">Vacant</p><p className="text-lg font-black text-slate-800">{vacantCount}</p></div>
          </div>
          <div className="px-6 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Key className="w-4 h-4" /></div>
            <div><p className="text-xs text-slate-500 font-bold uppercase">Occupancy</p><p className="text-lg font-black text-slate-800">{occupancyRate}%</p></div>
          </div>
        </div>
      </div>

      {/* MOBILE-FRIENDLY HORIZONTAL SCROLL WRAPPER */}
      <div className="flex-1 flex items-end justify-start md:justify-center gap-6 pb-4 z-10 px-4 mt-8 overflow-x-auto w-full custom-scrollbar">
        <div className="flex gap-6 min-w-max px-4">
          {BUILDINGS.map((building, bIndex) => {
            const startIndex = bIndex * UNITS_PER_BUILDING;
            
            return (
              <div key={building.id} className="flex flex-col items-center">
                <h3 className="text-slate-800 font-bold font-serif mb-2 tracking-wide">{building.name}</h3>
                <div className={`${building.color} w-48 relative rounded-t-sm border-t-8 border-x-4 border-black/20 shadow-2xl`}>
                  <div className="absolute -top-3 left-[-10px] right-[-10px] h-3 bg-black/30 rounded-t-sm" />
                  <div className="p-4 flex flex-col gap-4">
                    {[3, 2, 1, 0].map(floor => (
                      <div key={floor} className="grid grid-cols-3 gap-3">
                        {[0, 1, 2].map(windowCol => {
                          if (floor === 0 && windowCol === 2) return null;
                          
                          const localIndex = floor === 0 ? windowCol : (floor - 1) * 3 + 2 + windowCol;
                          const unitIndex = startIndex + localIndex;
                          
                          const org = organizations.find(o => o.grid_index === unitIndex);
                          const isOccupied = !!org;
                          const isSuspended = org?.is_suspended;

                          return (
                            <button
                              key={windowCol}
                              onClick={() => handleWindowClick(unitIndex, bIndex, floor)}
                              className={`
                                relative h-16 rounded-t-md border-b-4 flex flex-col items-center justify-center transition-all group overflow-hidden
                                ${!isOccupied 
                                  ? "bg-slate-700/50 border-slate-900 hover:bg-slate-600/80" 
                                  : isSuspended 
                                    ? "bg-red-950/90 border-red-900 hover:bg-red-900/90 shadow-none" 
                                    : "bg-amber-200/90 border-amber-600 hover:bg-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.5)]"}
                              `}
                            >
                              <User className={`w-5 h-5 mb-1 ${!isOccupied ? "text-slate-400" : isSuspended ? "text-red-800" : "text-amber-800"}`} />
                              <span className={`text-[9px] font-bold leading-none px-1 text-center truncate w-full ${!isOccupied ? "text-slate-400" : isSuspended ? "text-red-700" : "text-amber-900"}`}>
                                {isOccupied ? org.name.substring(0, 8) : "Vacant"}
                              </span>
                            </button>
                          );
                        })}
                        {floor === 0 && (
                          <div className={`${building.accent} h-16 rounded-t-xl border-b-4 border-black/40 relative`}>
                             <div className="absolute right-2 top-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                             <div className="absolute bottom-1 w-full text-center text-[8px] font-bold text-black/40">{bIndex + 1}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-12 bg-slate-400 border-t-8 border-slate-300 w-full z-10 shrink-0" />
      <div className="h-20 bg-slate-700 w-full z-10 shrink-0 flex items-center justify-center overflow-hidden">
         <div className="w-full h-1 flex justify-around gap-8 px-10 opacity-60">
            {[...Array(10)].map((_, i) => <div key={i} className="w-16 h-1 bg-yellow-400 rounded-full" /> )}
         </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* MOBILE OPTIMIZED DIALOG WIDTH */}
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px] bg-[#FAF9F6] border-slate-200 rounded-2xl">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-serif text-slate-800">
                  {formData.id ? "Edit Tenant" : "Register New Tenant"}
                </DialogTitle>
                <p className="text-sm text-slate-500 font-medium">
                  {activeLocation && `Unit ${activeLocation.unit} • Floor ${activeLocation.floor} • ${activeLocation.building}`}
                  {formData.is_suspended && <span className="ml-2 text-red-600 font-bold">(SUSPENDED)</span>}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-slate-700 flex items-center gap-2"><Building2 className="w-3 h-3 text-rose-700" /> Organization Name</Label>
                <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="border-rose-200 focus-visible:ring-rose-500 bg-white text-slate-900 font-medium h-12 text-base" placeholder="e.g. Acme Corp" required />
              </div>
              
              <div className="space-y-1">
                <Label className="text-slate-700 flex items-center gap-2"><span className="text-rose-700 font-bold">#</span> Chapter</Label>
                <Input value={formData.chapter || ''} onChange={e => setFormData({...formData, chapter: e.target.value})} className="bg-white text-slate-900 font-medium h-12 text-base" placeholder="e.g. Northeast Region" />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 flex items-center gap-2"><DollarSign className="w-3 h-3 text-rose-700" /> Monthly Fee ($)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={formData.monthly_fee ?? ''} 
                  onChange={e => setFormData({
                    ...formData, 
                    monthly_fee: e.target.value === '' ? undefined : parseFloat(e.target.value)
                  })} 
                  className="bg-white text-slate-900 font-medium h-12 text-base" 
                  placeholder="0.00" 
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-slate-700 flex items-center gap-2"><User className="w-3 h-3 text-rose-700" /> Organization Admin</Label>
                <Input value={formData.admin_name || ''} onChange={e => setFormData({...formData, admin_name: e.target.value})} className="bg-white text-slate-900 font-medium h-12 text-base" placeholder="e.g. Jane Smith" />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 flex items-center gap-2"><Mail className="w-3 h-3 text-rose-700" /> Email Address</Label>
                <Input type="email" value={formData.admin_email || ''} onChange={e => setFormData({...formData, admin_email: e.target.value})} className="bg-white text-slate-900 font-medium h-12 text-base" placeholder="admin@example.com" />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 flex items-center gap-2"><Phone className="w-3 h-3 text-rose-700" /> Phone Number</Label>
                <Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-white text-slate-900 font-medium h-12 text-base" placeholder="(555) 123-4567" />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t">
              {formData.id ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 h-12"><Trash2 className="w-4 h-4"/></Button>
                  <Button type="button" onClick={handleSuspendToggle} className={`${formData.is_suspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'} text-white font-bold flex-1 h-12`}>
                    <Ban className="w-4 h-4 mr-2"/> {formData.is_suspended ? "Unsuspend Tenant" : "Suspend Tenant"}
                  </Button>
                </div>
              ) : <div className="hidden sm:block" />}
              
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="text-slate-600 flex-1 h-12">Cancel</Button>
                <Button type="submit" className="bg-[#802B2B] hover:bg-[#601A1A] text-white font-bold flex-1 h-12">
                  {formData.id ? "Update Tenant" : "Add Tenant"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}