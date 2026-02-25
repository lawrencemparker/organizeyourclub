import { ForcePasswordSetup } from "@/components/auth/ForcePasswordSetup";
import { ForcePasswordReset } from "@/components/auth/ForcePasswordReset";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, Calendar, Activity, Loader2, ArrowUpRight, ArrowDownLeft, 
  CheckCircle2, Circle, AlertCircle, Plus, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionForm } from "@/components/finance/TransactionForm";

export function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dbMembers, setDbMembers] = useState<any[]>([]);
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [complianceTasks, setComplianceTasks] = useState<any[]>([]);
  
  const [canCreateEvent, setCanCreateEvent] = useState(false);

  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) return;
      const orgId = profile.organization_id;

      const { data: org } = await supabase.from('organizations').select('brand_color').eq('id', orgId).single();
      if (org?.brand_color) {
        document.documentElement.style.setProperty('--primary', org.brand_color);
      }

      let hasEventCreatePerm = false;
      const { data: currentMember } = await supabase.from('members').select('id, role').eq('email', user.email).maybeSingle();
      
      if (currentMember) {
        const role = currentMember.role?.toLowerCase() || '';
        if (role === 'admin' || role === 'president') {
          hasEventCreatePerm = true;
        } else {
          const { data: perm } = await supabase.from('permissions').select('create').eq('member_id', currentMember.id).eq('page', 'Events').maybeSingle();
          if (perm) {
            hasEventCreatePerm = !!perm.create;
          } else {
            const { data: userPerm } = await supabase.from('permissions').select('create').eq('user_id', user.id).eq('page', 'Events').maybeSingle();
            hasEventCreatePerm = !!userPerm?.create;
          }
        }
      }
      setCanCreateEvent(hasEventCreatePerm);

      const nowIso = new Date().toISOString();

      const [eventsRes, financeRes, complianceRes, membersRes] = await Promise.all([
        supabase.from('events').select('*').eq('organization_id', orgId).gte('start_time', nowIso).order('start_time', { ascending: true }).limit(4),
        supabase.from('finances').select('*').eq('organization_id', orgId).order('transaction_date', { ascending: false }).limit(5),
        supabase.from('compliance').select('*').eq('organization_id', orgId).order('due_date', { ascending: true }),
        supabase.from('members').select('*').eq('org_id', orgId).order('created_at', { ascending: false })
      ]);

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      
      const fetchedTasks = complianceRes.data || [];
      for (const task of fetchedTasks) {
        if (task.status?.toLowerCase() === 'pending' && task.due_date < todayStr) {
          await supabase.from('compliance').update({ status: 'Overdue' }).eq('id', task.id);
          task.status = 'Overdue';
        }
      }

      setDbEvents(eventsRes.data || []);
      setTransactions(financeRes.data || []);
      setComplianceTasks(fetchedTasks);
      setDbMembers(membersRes.data || []);
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const complianceStats = useMemo(() => {
    const total = complianceTasks.length;
    const completed = complianceTasks.filter(t => t.status?.toLowerCase() === 'completed').length;
    return { percent: total > 0 ? Math.round((completed / total) * 100) : 0, completed, total };
  }, [complianceTasks]);

  const recentMembers = useMemo(() => dbMembers.slice(0, 5), [dbMembers]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] opacity-50" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      
      <ForcePasswordSetup />
      <ForcePasswordReset />
      
      <PageHeader title="Dashboard Overview" subtitle="Manage your organization's members, events, and treasury." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
          <p className="text-sm font-medium text-muted-foreground">Total Members</p>
          <p className="text-3xl font-bold mt-2">{dbMembers.length}</p>
          <div className="absolute top-6 right-6 p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"><Users className="w-5 h-5" /></div>
        </div>
        <div className="glass-card p-6 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
          <p className="text-sm font-medium text-muted-foreground">Active Events</p>
          <p className="text-3xl font-bold mt-2">{dbEvents.length}</p>
          <div className="absolute top-6 right-6 p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"><Calendar className="w-5 h-5" /></div>
        </div>
        <div className="glass-card p-6 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
          <p className="text-sm font-medium text-muted-foreground">Treasury Balance</p>
          <p className="text-3xl font-bold mt-2 text-green-500">${totals.balance.toLocaleString()}</p>
          <div className="absolute top-6 right-6 p-3 rounded-xl bg-green-500/10 text-green-500"><Activity className="w-5 h-5" /></div>
        </div>
        <div className="glass-card p-6 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
          <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
          <p className="text-3xl font-bold mt-2">{complianceStats.percent}%</p>
          <div className="absolute top-6 right-6 p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"><ClipboardCheck className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card flex flex-col">
          <div className="p-6 border-b border-border/40 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Members</h3>
            <Button variant="ghost" size="sm" asChild className="hover:text-[var(--primary)] hover:bg-[var(--primary)]/5">
              <Link to="/members">View All</Link>
            </Button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-muted-foreground font-medium border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentMembers.map((m) => {
                  const initials = m.full_name ? m.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                  const statusLower = m.status?.toLowerCase();
                  
                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0 transition-colors duration-300 border border-[var(--primary)]/20">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{m.full_name || 'Unnamed Member'}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">{m.role || 'Member'}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant="outline" className={cn(
                          statusLower === "active" 
                            ? "border-[var(--primary)]/30 text-[var(--primary)] bg-[var(--primary)]/10" 
                            : statusLower === "pending"
                              ? "border-orange-500/30 text-orange-500 bg-orange-500/10"
                              : "border-red-500/30 text-red-500 bg-red-500/10"
                        )}>
                          {m.status || 'Unknown'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
                {recentMembers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted-foreground italic">
                      No members found in your organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card flex flex-col">
          <div className="p-6 border-b border-border/40 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Upcoming Events</h3>
            <Link to="/events" className="text-xs text-muted-foreground hover:text-[var(--primary)] transition-colors">View All</Link>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {dbEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No upcoming events found.</p>
            ) : (
              dbEvents.map(e => (
                <div key={e.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate('/events')}>
                  <div className="w-12 h-14 rounded-lg flex flex-col items-center justify-center border border-[var(--primary)]/30 bg-[var(--primary)]/5 group-hover:bg-[var(--primary)]/10 transition-colors">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{new Date(e.start_time).toLocaleString('default', {month:'short'})}</span>
                    <span className="text-lg font-bold text-[var(--primary)]">{new Date(e.start_time).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-medium truncate group-hover:text-[var(--primary)] transition-colors">{e.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{new Date(e.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))
            )}
            
            {canCreateEvent && (
              <Button className="w-full mt-auto bg-[var(--primary)] hover:opacity-90 text-white" onClick={() => navigate('/events')}>
                <Plus className="w-4 h-4 mr-2" /> Schedule Event
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-lg">Financial Overview</h3>
              <p className="text-sm text-muted-foreground">Track income and expenses</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/finance')}>View Report</Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-500 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-500 mt-1">${totals.income.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-500 mt-1">${totals.expenses.toLocaleString()}</p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Recent Transactions</h4>
          <div className="space-y-4">
            {transactions.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", 
                    t.type === 'income' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  )}>
                    {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium group-hover:text-[var(--primary)] transition-colors">{t.description}</p>
                    <p className="text-[10px] text-muted-foreground">{t.transaction_date}</p>
                  </div>
                </div>
                <span className={cn("text-sm font-bold", t.type === 'income' ? "text-green-500" : "text-red-500")}>
                  {t.type === 'income' ? '+' : '-'}${Math.abs(Number(t.amount)).toLocaleString()}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-sm text-muted-foreground italic">No transactions found.</p>}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="font-semibold text-lg">Compliance Status</h3>
            <p className="text-sm text-muted-foreground">University & national requirements</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Compliance</span>
              <span className="font-bold text-[var(--primary)]">{complianceStats.percent}%</span>
            </div>
            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)] transition-all duration-1000" style={{ width: `${complianceStats.percent}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{complianceStats.completed} of {complianceStats.total} requirements completed</p>
          </div>

          <div className="space-y-3">
            {complianceTasks.map((task) => {
              const statusLower = task.status?.toLowerCase();
              return (
                <div key={task.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between group hover:border-[var(--primary)]/20 transition-all">
                  <div className="flex items-center gap-3">
                    {statusLower === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : statusLower === 'overdue' ? (
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p className={cn("text-sm font-medium", statusLower === 'completed' ? "text-muted-foreground line-through" : "text-foreground")}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Due: {task.due_date}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] px-2 h-5 border-transparent capitalize", 
                      statusLower === "completed" ? "bg-green-500/10 text-green-500" : 
                      statusLower === "overdue" ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                      {task.status}
                  </Badge>
                </div>
              );
            })}
             {complianceTasks.length === 0 && <p className="text-sm text-muted-foreground italic">No compliance tasks found.</p>}
          </div>
        </div>
      </div>

      <TransactionForm open={isFinanceOpen} onOpenChange={setIsFinanceOpen} transactionToEdit={editingTransaction} onSuccess={loadDashboardData} />
    </div>
  );
}