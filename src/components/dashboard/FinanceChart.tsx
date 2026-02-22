import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Jan", income: 4000, expense: 2400 },
  { name: "Feb", income: 3000, expense: 1398 },
  { name: "Mar", income: 2000, expense: 9800 },
  { name: "Apr", income: 2780, expense: 3908 },
  { name: "May", income: 1890, expense: 4800 },
  { name: "Jun", income: 2390, expense: 3800 },
];

export function FinanceChart() {
  return (
    <div className="glass-card p-6 col-span-1">
      <div className="mb-6">
        <h3 className="font-semibold text-lg">Financial Overview</h3>
        <p className="text-sm text-muted-foreground">Income vs Expenses over time</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}