import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Boxes,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

// 1. Assets vs Liabilities Distribution
const assetsVsLiabilitiesData = [
  { name: 'Current Assets (Cash & Bank)', value: 85000, color: '#4F46E5' },
  { name: 'Accounts Receivable (Debtors)', value: 60000, color: '#06B6D4' },
  { name: 'Accounts Payable (Creditors)', value: 38000, color: '#F43F5E' },
  { name: 'Tax Payable & Liabilities', value: 14000, color: '#FB923C' },
  { name: "Owner's Net Equity", value: 93000, color: '#10B981' },
];

// 2. Monthly Debit vs Credit Movements
const debitCreditData = [
  { month: 'Apr', debit: 42000, credit: 42000 },
  { month: 'May', debit: 58000, credit: 58000 },
  { month: 'Jun', debit: 73000, credit: 73000 },
  { month: 'Jul', debit: 65000, credit: 65000 },
  { month: 'Aug', debit: 89000, credit: 89000 },
  { month: 'Sep', debit: 94000, credit: 94000 },
];

// 3. Products Breakdown (From DB: 143 Goods, 52 Services, 12 Combos)
const productBreakdownData = [
  { name: 'Physical Goods', count: 143, color: '#8B5CF6' },
  { name: 'Professional Services', count: 52, color: '#F59E0B' },
  { name: 'Product Combos & Bundles', count: 12, color: '#EC4899' },
];

// 4. Revenue & Operating Expense Growth Trend
const revenueTrendData = [
  { month: 'Apr', revenue: 62000, expense: 38000, profit: 24000 },
  { month: 'May', revenue: 78000, expense: 45000, profit: 33000 },
  { month: 'Jun', revenue: 95000, expense: 52000, profit: 43000 },
  { month: 'Jul', revenue: 88000, expense: 49000, profit: 39000 },
  { month: 'Aug', revenue: 115000, expense: 61000, profit: 54000 },
  { month: 'Sep', revenue: 132000, expense: 68000, profit: 64000 },
];

// Custom Shadcn Tooltip Styling
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1">
        {label && <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1 mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts() {
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-b border-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-Time Business Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Financial Overview &amp; Operating Metrics
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Live double-entry postings, ledger balance metrics, and active product inventory analytics.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audited Ledger Sync</span>
          </div>
        </div>

        {/* 2x2 Grid of Shadcn Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CARD 1: Assets vs Liabilities */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <PieIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Assets &amp; Liabilities Breakdown</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">Balance sheet distribution across major account types</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                ₹1,45,000 Assets
              </span>
            </div>

            <div className="py-4 h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetsVsLiabilitiesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {assetsVsLiabilitiesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(v) => `₹${v.toLocaleString()}`} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
              {assetsVsLiabilitiesData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: Debit vs Credit Postings */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Journal Debit vs Credit Equilibrium</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">Sum(Debit) = Sum(Credit) double-entry verification</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Balanced
              </span>
            </div>

            <div className="py-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={debitCreditData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip formatter={(v) => `₹${v.toLocaleString()}`} />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="debit" name="Total Debits" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="credit" name="Total Credits" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Avg Monthly Volume: <strong className="text-slate-800">₹70,000</strong></span>
              <span>Ledger Status: <strong className="text-emerald-600">100% Matched</strong></span>
            </div>
          </div>

          {/* CARD 3: Product Inventory Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Product &amp; Catalog Breakdown</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">207 total entries seeded across 3 active types</p>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">
                207 Items Live
              </span>
            </div>

            <div className="py-4 h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productBreakdownData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {productBreakdownData.map((entry, index) => (
                      <Cell key={`cell-prod-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(v) => `${v} products`} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-500">Goods</p>
                <p className="font-bold text-purple-700 text-sm">143</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-500">Services</p>
                <p className="font-bold text-amber-700 text-sm">52</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-500">Combos</p>
                <p className="font-bold text-pink-700 text-sm">12</p>
              </div>
            </div>
          </div>

          {/* CARD 4: Revenue & Profit Margin Trend */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Revenue &amp; Net Profit Growth</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">Income generation vs operating costs trajectory</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                +48.4% Net Margin
              </span>
            </div>

            <div className="py-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip formatter={(v) => `₹${v.toLocaleString()}`} />} />
                  <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expense" name="Operating Expenses" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Sep Gross Revenue: <strong className="text-emerald-600">₹1,32,000</strong></span>
              <span>Estimated Tax Reserve: <strong className="text-slate-800">₹11,520</strong></span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
