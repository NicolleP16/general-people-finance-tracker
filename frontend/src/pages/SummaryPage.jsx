import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Menu,
  PieChart,
  Wallet,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getTransactions } from '../services/transactionsService';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const CATEGORY_PALETTE = [
  '#274E2A',
  '#D93829',
  '#E67E22',
  '#8E44AD',
  '#16A085',
  '#2980B9',
  '#D35400',
  '#7F8C8D',
];

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
});

const englishNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const formatMoney = (value) =>
  moneyFormatter.format(toAmount(value)).replace(/\u00A0/g, ' ');

const formatPercent = (value) => `${percentFormatter.format(value)}%`;

const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const parseMonthKey = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
};

const getMonthLabel = (monthKey) => {
  const { year, month } = parseMonthKey(monthKey);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

const getMonthEnd = (monthKey) => {
  const { year, month } = parseMonthKey(monthKey);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(lastDay).padStart(2, '0')}`;
};

const getCurrentMonthKey = () => formatMonthKey(new Date());

const getMonthOptions = (selectedMonth) => {
  const options = [];
  const today = new Date();

  for (let index = 0; index < 36; index += 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const value = formatMonthKey(date);
    options.push({ value, label: getMonthLabel(value) });
  }

  if (!options.some((option) => option.value === selectedMonth)) {
    options.push({ value: selectedMonth, label: getMonthLabel(selectedMonth) });
    options.sort((a, b) => b.value.localeCompare(a.value));
  }

  return options;
};

const buildCategoryBreakdown = (transactions, totalExpenses) => {
  const grouped = new Map();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const key = transaction.category ?? transaction.category_name ?? 'sin-categoria';
      const current = grouped.get(key) || {
        name: transaction.category_name || 'Sin categoría',
        color: transaction.category_color || null,
        total: 0,
      };

      current.total += toAmount(transaction.amount);
      grouped.set(key, current);
    });

  return Array.from(grouped.values())
    .sort((a, b) => b.total - a.total)
    .map((category, index) => ({
      ...category,
      color: category.color || CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
      percentage: totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0,
    }));
};

function SummaryCard({ label, englishLabel, value, icon: Icon, iconClassName, valueClassName, testId }) {
  const amount = toAmount(value);

  return (
    <article
      aria-label={`${label} / ${englishLabel}: ${formatMoney(amount)}`}
      className="bg-white border border-[#E4EAE0] rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#62775E]">
          {label}
          <span className="sr-only"> {englishLabel}</span>
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconClassName}`}>
          <Icon size={15} />
        </div>
      </div>
      <p
        data-testid={testId}
        data-value={amount}
        aria-label={englishNumberFormatter.format(amount)}
        className={`text-xl sm:text-2xl font-bold tracking-tight ${valueClassName}`}
      >
        {formatMoney(amount)}
      </p>
    </article>
  );
}

function CategoryTooltip({ category }) {
  return (
    <div
      role="tooltip"
      data-testid="category-tooltip"
      className="absolute top-2 right-2 z-10 w-44 rounded-xl border border-[#E4EAE0] bg-white p-3 shadow-lg"
    >
      <p className="text-xs font-semibold text-[#142A16]">{category.name}</p>
      <p className="mt-1 text-sm font-bold text-[#142A16]">{formatMoney(category.total)}</p>
      <p className="text-[11px] font-medium text-[#738870]">{formatPercent(category.percentage)}</p>
    </div>
  );
}

function ExpensesDistribution({ expenses, breakdown }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  if (expenses === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DEE6DA] bg-[#FBFDFB] px-6 py-10 text-center">
        <PieChart className="mb-3 h-8 w-8 text-[#9FB19D]" />
        <p className="text-sm font-semibold text-[#1A331C]">No expenses this month yet</p>
        <p className="mt-1 text-xs text-[#738870]">Aún no hay gastos registrados en este mes.</p>
      </div>
    );
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const segments = breakdown.reduce((result, category) => {
    const previous = result[result.length - 1];
    const accumulatedPercentage = previous
      ? previous.accumulatedPercentage + previous.percentage
      : 0;

    return [...result, { ...category, accumulatedPercentage }];
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div
        data-testid="expenses-chart"
        className="relative h-44 w-44 shrink-0"
        aria-label="Gráfico de distribución de gastos"
        role="img"
      >
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#EEF2EB" strokeWidth="16" />
          {segments.map((category) => {
            const segmentLength = (category.percentage / 100) * circumference;
            const segmentOffset = (category.accumulatedPercentage / 100) * circumference;

            return (
              <circle
                key={`segment-${category.name}`}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={category.color}
                strokeWidth="16"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-segmentOffset}
                strokeLinecap="butt"
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={() => setHoveredCategory(category)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <title>
                  {`${category.name}: ${formatMoney(category.total)} (${formatPercent(category.percentage)})`}
                </title>
              </circle>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#738870]">Total</span>
          <span className="text-sm font-bold text-[#142A16]">{formatMoney(expenses)}</span>
        </div>

        {hoveredCategory && <CategoryTooltip category={hoveredCategory} />}
      </div>

      <div className="w-full flex-1 space-y-2" data-testid="category-list">
        {breakdown.map((category) => (
          <div
            key={category.name}
            data-testid="category-row"
            data-category={category.name}
            role="listitem"
            tabIndex={0}
            aria-label={`${category.name}: ${formatMoney(category.total)} (${formatPercent(category.percentage)})`}
            className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[#E4EAE0] hover:bg-[#F8FAF6] focus:outline-none focus-visible:border-[#274E2A]"
            onMouseEnter={() => setHoveredCategory(category)}
            onMouseLeave={() => setHoveredCategory(null)}
            onFocus={() => setHoveredCategory(category)}
            onBlur={() => setHoveredCategory(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1A331C]">
              {category.name}
            </span>
            <span className="shrink-0 text-xs font-bold text-[#142A16]">
              {formatMoney(category.total)}
            </span>
            <span className="w-12 shrink-0 text-right text-[11px] font-semibold text-[#738870]">
              {formatPercent(category.percentage)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [monthlyData, setMonthlyData] = useState({ month: null, transactions: [] });

  useEffect(() => {
    let cancelled = false;

    getTransactions({
      start_date: `${selectedMonth}-01`,
      end_date: getMonthEnd(selectedMonth),
      page_size: 1000,
    })
      .then((transactions) => {
        if (!cancelled) {
          setMonthlyData({
            month: selectedMonth,
            transactions: Array.isArray(transactions) ? transactions : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMonthlyData({ month: selectedMonth, transactions: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const transactions = useMemo(
    () => (monthlyData.month === selectedMonth ? monthlyData.transactions : []),
    [monthlyData, selectedMonth]
  );
  const isLoading = monthlyData.month !== selectedMonth;

  const summary = useMemo(() => {
    let incomes = 0;
    let expenses = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === 'income') {
        incomes += toAmount(transaction.amount);
      } else if (transaction.type === 'expense') {
        expenses += toAmount(transaction.amount);
      }
    });

    return { incomes, expenses, balance: incomes - expenses };
  }, [transactions]);

  const breakdown = useMemo(
    () => buildCategoryBreakdown(transactions, summary.expenses),
    [transactions, summary.expenses]
  );

  const monthOptions = useMemo(() => getMonthOptions(selectedMonth), [selectedMonth]);

  const changeMonth = (offset) => {
    const { year, month } = parseMonthKey(selectedMonth);
    setSelectedMonth(formatMonthKey(new Date(year, month - 1 + offset, 1)));
  };

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-[#1A331C] font-sans antialiased">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Resumen"
      />

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <header className="flex items-center justify-between pb-4 sm:pb-6 mb-4 border-b border-[#E6ECE2]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white border border-[#DEE6DA] text-[#4F644D] hover:bg-[#EEF4E9] transition shadow-2xs"
                aria-label="Abrir menú"
              >
                <Menu size={18} />
              </button>

              <div className="flex items-center gap-2 text-xs font-medium text-[#62775E]">
                <span className="hidden sm:inline">Mi espacio</span>
                <span className="hidden sm:inline">/</span>
                <span className="text-[#1A331C] font-semibold">Resumen</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Mes anterior"
                className="w-8 h-8 rounded-xl bg-white border border-[#DEE6DA] flex items-center justify-center text-[#62775E] hover:text-[#1A331C] shadow-2xs transition"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex items-center gap-1.5 bg-white border border-[#DEE6DA] px-2.5 py-1.5 rounded-xl shadow-2xs">
                <Calendar size={13} className="text-[#62775E]" />
                <label htmlFor="summary-month" className="sr-only">
                  Mes
                </label>
                <select
                  id="summary-month"
                  aria-label="Mes / Month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#1A331C] focus:outline-none cursor-pointer"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Mes siguiente"
                className="w-8 h-8 rounded-xl bg-white border border-[#DEE6DA] flex items-center justify-center text-[#62775E] hover:text-[#1A331C] shadow-2xs transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </header>

          <div className="mb-6 sm:mb-7">
            <p className="text-[10px] font-semibold tracking-wider text-[#738870] uppercase">
              Resumen financiero
            </p>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#142A16] mt-0.5">
              {getMonthLabel(selectedMonth)}
            </h1>
            <p className="text-xs text-[#556F53] mt-1">
              Ingresos, gastos y distribución de tus gastos del mes.
            </p>
          </div>

          <section
            aria-label="Totales del mes"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-7"
          >
            <SummaryCard
              label="Ingresos"
              englishLabel="Income"
              value={summary.incomes}
              icon={ArrowDownLeft}
              iconClassName="bg-[#EBF2E8] text-[#274E2A]"
              valueClassName="text-[#142A16]"
              testId="summary-income"
            />
            <SummaryCard
              label="Gastos"
              englishLabel="Expenses"
              value={summary.expenses}
              icon={ArrowUpRight}
              iconClassName="bg-[#FBECEB] text-[#D93829]"
              valueClassName="text-[#142A16]"
              testId="summary-expenses"
            />
            <SummaryCard
              label="Saldo"
              englishLabel="Balance"
              value={summary.balance}
              icon={Wallet}
              iconClassName={
                summary.balance < 0
                  ? 'bg-[#FBECEB] text-[#D93829]'
                  : 'bg-[#EBF2E8] text-[#274E2A]'
              }
              valueClassName={
                summary.balance < 0 ? 'text-[#D93829]' : 'text-[#142A16]'
              }
              testId="summary-balance"
            />
          </section>

          <section className="bg-white border border-[#E4EAE0] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#738870] uppercase">
                  Gastos por categoría
                </p>
                <h2 className="text-sm sm:text-base font-serif font-bold text-[#142A16]">
                  Distribución de gastos
                </h2>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#EBF2E8] text-[#274E2A] flex items-center justify-center">
                <PieChart size={16} />
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-[#DEE6DA] bg-[#FBFDFB] px-6 py-10">
                <p className="text-xs font-medium text-[#738870]">Cargando resumen...</p>
              </div>
            ) : (
              <ExpensesDistribution expenses={summary.expenses} breakdown={breakdown} />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
