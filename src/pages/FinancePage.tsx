import { useEffect, useState, useMemo } from "react";
import { 
  Search, Download, Filter, 
  Loader2, MoreVertical, Edit2, Trash2, Plus, DollarSign 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function FinancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  
  // RBAC States
  const [canCreateFinance, setCanCreateFinance] = useState(false);
  const [userRole, setUserRole] = useState("");

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single();
      if (!profile?.organization_id) return;

      // STRICT ISOLATION: Fetch permissions for this specific org
      const { data: currentMember } = await supabase
        .from('members')
        .select('id, role, permissions')
        .eq('email', user.email)
        .eq('org_id', profile.organization_id)
        .maybeSingle();
      
      const resolvedRole = (currentMember?.role || profile?.role || '').toLowerCase();
      setUserRole(resolvedRole); 
      
      const isSuper = resolvedRole === 'admin' || resolvedRole === 'president';
      const perms = currentMember?.permissions?.['Finances'] || {};

      // ─── URL REDIRECT SECURITY ──────────────────────────────────────
      // If the user is NOT an admin, and their Read permission is explicitly false, kick them out!
      if (!isSuper && perms.read === false) {
        toast.error("Access Denied: You do not have permission to view Finances.");
        navigate('/overview', { replace: true });
        return; 
      }
      // ────────────────────────────────────────────────────────────────

      setCanCreateFinance(isSuper || !!perms.create);

      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load treasury data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [user]);

  // Dynamic Calculation: Totals
  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    transactions.forEach(t => {
      const rawAmt = Number(t.amount);
      if (t.type === 'income') {
        income += rawAmt;
      } else if (t.type === 'expense') {
        expenses += Math.abs(rawAmt);
      }
    });

    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  // Combined Search & Type Filter Logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const { error } = await supabase.from('finances').delete().eq('id', id);
      if (error) throw error;
      toast.success("Transaction deleted");
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const csvData = filteredTransactions.map(t => {
      const cleanDesc = t.description ? t.description.replace(/"/g, '""') : "";
      return `${t.transaction_date},"${cleanDesc}","${t.category}",${t.type},${t.amount}`;
    });

    const csvContent = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `treasury_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader 
        title="Treasury & Finances" 
        subtitle="Complete record of organization income and expenses"
        actions={
          canCreateFinance ? (
            <Button 
              onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
              className="bg-[var(--primary)] hover:opacity-90 text-white shadow-md shadow-[var(--primary)]/20 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Transaction
            </Button>
          ) : undefined
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-b-2 border-[var(--primary)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-12 h-12 text-[var(--primary)]" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
          <p className="text-3xl font-bold mt-2 text-[var(--primary)] transition-colors duration-300">
            ${totals.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="glass-card p-6 border-b-2 border-green-500/50">
          <p className="text-sm font-medium text-muted-foreground">Total Income</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-green-500">${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="glass-card p-6 border-b-2 border-red-500/50">
          <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-red-500">${totals.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="capitalize">
                  <Filter className="w-4 h-4 mr-2" /> 
                  {typeFilter === 'all' ? 'Filter' : typeFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTypeFilter("all")}>All Transactions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("income")}>Income Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("expense")}>Expenses Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(userRole === 'admin' || userRole === 'president') && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground font-medium border-b border-border/40">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                {canCreateFinance && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{t.transaction_date}</td>
                  <td className="px-6 py-4 font-medium">{t.description}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="font-normal bg-white/5 hover:bg-white/10">{t.category}</Badge>
                  </td>
                  
                  <td className={cn("px-6 py-4 font-bold text-right", t.type === 'income' ? "text-green-500" : "text-red-500")}>
                    {t.type === 'income' ? '+' : '-'}${Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  
                  {canCreateFinance && (
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingTransaction(t); setIsFormOpen(true); }}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={canCreateFinance ? 5 : 4} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found. {canCreateFinance ? 'Click "Add Transaction" to get started.' : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        transactionToEdit={editingTransaction} 
        onSuccess={fetchTransactions} 
      />
    </div>
  );
}