import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  Minus,
  PiggyBank,
  PieChart,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import MonthlyFlowChart from '../components/MonthlyFlowChart';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/useAuth';
import {
  getBudgetStatus,
  getExpensesByCategory,
  getMonthlyFlow,
  getRecentTransactions,
  getSummary,
} from '../services/dashboardService';

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
  '#3F6B3A',
  '#7C9A6D',
  '#A9BC8F',
  '#D9A441',
  '#C77D4A',
  '#A65D57',
  '#6F8274',
  '#8A7D5A',
];

const BUDGET_STATUS = {
  ok: {
    bar: 'bg-positive',
    badge: 'bg-positive/15 text-positive',
    label: 'En orden',
  },
  warning: {
    bar: 'bg-highlight',
    badge: 'bg-highlight/20 text-accent-foreground',
    label: 'Atención',
  },
  exceeded: {
    bar: 'bg-expense',
    badge: 'bg-expense/10 text-expense',
    label: 'Excedido',
  },
};

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

const formatPercent = (value) => `${percentFormatter.format(toAmount(value))}%`;

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

const getComparisonLabel = (monthKey) => {
  const { year, month } = parseMonthKey(monthKey);
  const previous = new Date(year, month - 2, 1);
  return `vs. ${MONTH_NAMES[previous.getMonth()].toLowerCase()}`;
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

const getTodayLabel = () => {
  const label = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatRecentDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return String(value);

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, day));
};

const getInitials = (name) => {
  if (!name) return 'LA';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

const normalizeCategories = (categories) => {
  const items = (Array.isArray(categories) ? categories : [])
    .map((category, index) => ({
      id: category.category_id ?? category.id ?? category.name ?? index,
      name: category.name || 'Sin categoría',
      total: toAmount(category.total),
      color: category.color || CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
      percentage: Number(category.percentage),
    }))
    .filter((category) => category.total > 0);

  const total = items.reduce((sum, category) => sum + category.total, 0);

  return items
    .map((category) => ({
      ...category,
      percentage: Number.isFinite(category.percentage)
        ? category.percentage
        : total > 0
          ? (category.total / total) * 100
          : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

function ChangeDetail({ value, comparisonLabel, positiveIsGood = true }) {
  const hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
  const numeric = Number(value);

  if (!hasValue) {
    return (
      <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
        <span className="grid size-[1.15rem] place-items-center rounded-full bg-muted text-muted-foreground">
          <Minus size={12} />
        </span>
        Sin comparación mensual
      </div>
    );
  }

  const isUp = numeric >= 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
      <span
        className={`grid size-[1.15rem] place-items-center rounded-full ${
          isGood ? 'bg-positive/20 text-positive' : 'bg-expense/15 text-expense'
        }`}
      >
        <Icon size={12} />
      </span>
      {formatPercent(Math.abs(numeric))} {comparisonLabel}
    </div>
  );
}

function SavingsDetail({ percentage }) {
  const hasValue =
    percentage !== null && percentage !== undefined && Number.isFinite(Number(percentage));
  const numeric = Number(percentage);
  const isPositive = hasValue && numeric > 0;

  return (
    <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
      <span
        className={`grid size-[1.15rem] place-items-center rounded-full ${
          isPositive ? 'bg-positive/20 text-positive' : 'bg-muted text-muted-foreground'
        }`}
      >
        {isPositive ? <TrendingUp size={12} /> : <Minus size={12} />}
      </span>
      {hasValue ? `${formatPercent(numeric)} de tus ingresos` : 'Sin comparación mensual'}
    </div>
  );
}

function SummaryCard({
  label,
  englishLabel,
  value,
  icon: Icon,
  detail,
  featured = false,
  negative = false,
  testId,
}) {
  const amount = toAmount(value);

  return (
    <article
      aria-label={`${label} / ${englishLabel}: ${formatMoney(amount)}`}
      className={`min-w-0 rounded-[0.45rem] border border-border bg-card p-[1.15rem] shadow-[0_1px_3px_oklch(30%_0.02_120_/_0.04)] ${
        featured ? 'border-t-[3px] border-t-primary-dark' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[0.76rem] font-semibold text-muted-foreground">
        <span>
          {label}
          <span className="sr-only"> {englishLabel}</span>
        </span>
        <span className="grid size-8 place-items-center rounded-[0.35rem] bg-secondary text-primary-dark">
          <Icon size={18} />
        </span>
      </div>

      <strong
        data-testid={testId}
        data-value={amount}
        aria-label={englishNumberFormatter.format(amount)}
        className={`mt-3.5 block break-words font-display text-2xl font-bold tracking-tight ${
          negative ? 'text-[#D93829]' : 'text-heading'
        }`}
      >
        {formatMoney(amount)}
      </strong>

      {detail}
    </article>
  );
}

function CategoryTooltip({ category }) {
  return (
    <div
      role="tooltip"
      data-testid="category-tooltip"
      className="absolute left-1/2 top-2 z-10 w-44 -translate-x-1/2 rounded-[0.45rem] border border-border bg-card p-3 text-left shadow-lg"
    >
      <p className="text-xs font-semibold text-foreground">{category.name}</p>
      <p className="mt-1 font-display text-sm font-bold text-heading">
        {formatMoney(category.total)}
      </p>
      <p className="text-[0.68rem] font-medium text-muted-foreground">
        {formatPercent(category.percentage)}
      </p>
    </div>
  );
}

function SpendingDistribution({ categories, totalExpenses }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const segments = categories.reduce((result, category) => {
    const previous = result[result.length - 1];
    const accumulatedPercentage = previous
      ? previous.accumulatedPercentage + previous.percentage
      : 0;

    return [...result, { ...category, accumulatedPercentage }];
  }, []);

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.75fr)]">
      <article className="min-w-0 rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Gastos por categoría
            </p>
            <h2 className="mt-1 font-display text-base font-bold text-heading">
              Distribución de gastos
            </h2>
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[0.68rem] text-muted-foreground">
            {categories.map((category) => (
              <span key={`legend-${category.id}`} className="inline-flex items-center gap-1.5">
                <i
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mt-8 flex justify-center">
          <div
            data-testid="expenses-chart"
            className="relative h-44 w-44 shrink-0"
            aria-label="Gráfico de distribución de gastos"
            role="img"
          >
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--color-secondary)"
                strokeWidth="15"
              />
              {segments.map((category) => {
                const segmentLength = (category.percentage / 100) * circumference;
                const segmentOffset = (category.accumulatedPercentage / 100) * circumference;

                return (
                  <circle
                    key={`segment-${category.id}`}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={category.color}
                    strokeWidth="15"
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
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Total
              </span>
              <span className="font-display text-base font-bold text-heading">
                {formatMoney(totalExpenses)}
              </span>
            </div>

            {hoveredCategory && <CategoryTooltip category={hoveredCategory} />}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.68rem] text-muted-foreground">Total gastado</span>
            <strong className="font-display text-lg text-heading">{formatMoney(totalExpenses)}</strong>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[0.68rem] font-bold text-positive">
            <PieChart size={14} />
            {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
          </span>
        </div>
      </article>

      <article className="min-w-0 rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Detalle mensual
            </p>
            <h2 className="mt-1 font-display text-base font-bold text-heading">Por categoría</h2>
          </div>
          <a
            href="/movimientos"
            className="inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-primary-dark transition hover:text-heading"
          >
            Ver movimientos
            <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="mt-5 space-y-4" data-testid="category-list">
          {categories.map((category) => (
            <div
              key={category.id}
              data-testid="category-row"
              data-category={category.name}
              role="listitem"
              tabIndex={0}
              aria-label={`${category.name}: ${formatMoney(category.total)} (${formatPercent(category.percentage)})`}
              className="rounded-[0.4rem] outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              onMouseEnter={() => setHoveredCategory(category)}
              onMouseLeave={() => setHoveredCategory(null)}
              onFocus={() => setHoveredCategory(category)}
              onBlur={() => setHoveredCategory(null)}
            >
              <div className="flex items-end justify-between gap-3">
                <strong className="min-w-0 truncate text-[0.77rem] text-foreground">
                  {category.name}
                </strong>
                <span className="shrink-0 whitespace-nowrap text-[0.7rem] font-bold text-foreground">
                  {formatMoney(category.total)}
                  <small className="ml-1 font-normal text-muted-foreground">
                    · {formatPercent(category.percentage)}
                  </small>
                </span>
              </div>
              <div className="mt-1.5 h-[0.4rem] overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(category.percentage, 2)}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function EmptyExpenses() {
  return (
    <section className="flex min-h-[260px] flex-col items-center justify-center rounded-[0.45rem] border border-dashed border-border bg-card px-6 py-12 text-center shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
      <PieChart className="mb-3 size-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">No expenses this month yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Aún no hay gastos registrados en este mes.
      </p>
    </section>
  );
}

function BudgetStatus({ budgets }) {
  const items = Array.isArray(budgets) ? budgets : [];

  return (
    <section
      data-testid="budget-status"
      className="flex min-w-0 flex-col rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]"
    >
      <div>
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Control mensual
        </p>
        <h2 className="mt-1 font-display text-base font-bold text-heading">Presupuestos</h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <Target className="mb-3 size-8 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">
            No hay presupuestos para este mes
          </p>
          <p className="mt-1 max-w-[15rem] text-[0.68rem] text-muted-foreground">
            Cuando registres límites por categoría, verás aquí su avance.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5" data-testid="budget-list">
          {items.map((budget) => {
            const status = BUDGET_STATUS[budget.status] || BUDGET_STATUS.ok;
            const usedPercentage = toAmount(budget.used_pct);
            const barWidth = Math.min(Math.max(usedPercentage, 0), 100);

            return (
              <div key={budget.category_id ?? budget.name} data-testid="budget-row">
                <div className="flex items-end justify-between gap-3">
                  <strong className="min-w-0 truncate text-[0.77rem] text-foreground">
                    {budget.name}
                  </strong>
                  <span className="shrink-0 whitespace-nowrap text-[0.7rem] font-bold text-foreground">
                    {formatMoney(budget.spent)}
                    <small className="ml-1 font-normal text-muted-foreground">
                      de {formatMoney(budget.limit)}
                    </small>
                  </span>
                </div>
                <div className="mt-1.5 h-[0.4rem] overflow-hidden rounded-full bg-muted">
                  <span
                    className={`block h-full rounded-full ${status.bar}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[0.65rem]">
                  <span className={`rounded-full px-1.5 py-px font-bold ${status.badge}`}>
                    {status.label}
                  </span>
                  <span className="font-medium text-muted-foreground">
                    {formatPercent(usedPercentage)} utilizado
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentMovements({ transactions }) {
  const items = Array.isArray(transactions) ? transactions : [];

  return (
    <section className="flex min-w-0 flex-col rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Actividad
          </p>
          <h2 className="mt-1 font-display text-base font-bold text-heading">
            Movimientos recientes
          </h2>
        </div>
        <a
          href="/movimientos"
          className="inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-primary-dark transition hover:text-heading"
        >
          Ver todos
          <ArrowUpRight size={15} />
        </a>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <ReceiptText className="mb-3 size-8 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">Todavía no hay movimientos</p>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            Tus últimos registros aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {items.map((transaction) => {
            const isIncome = transaction.type === 'income';
            const amount = toAmount(transaction.amount);

            return (
              <div
                key={transaction.id}
                data-testid="recent-transaction"
                className="flex items-center justify-between gap-2 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-[0.35rem] ${
                      isIncome ? 'bg-secondary text-primary-dark' : 'bg-expense/10 text-expense'
                    }`}
                  >
                    {isIncome ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.76rem] font-semibold text-foreground">
                      {transaction.description || transaction.category_name || 'Movimiento'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.65rem] text-muted-foreground">
                      <i
                        className="size-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            transaction.category_color || 'var(--color-primary)',
                        }}
                      />
                      {formatRecentDate(transaction.transaction_date)}
                      {transaction.category_name ? ` · ${transaction.category_name}` : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[0.72rem] font-bold ${
                    isIncome ? 'text-positive' : 'text-expense'
                  }`}
                >
                  {isIncome ? '+' : '−'} {formatMoney(amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function SummaryPage() {
  const { user } = useAuth() ?? {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [dashboard, setDashboard] = useState({
    monthKey: null,
    summary: null,
    flow: null,
    budgets: [],
    expenses: [],
    recentTransactions: [],
  });

  useEffect(() => {
    let cancelled = false;
    const { year, month } = parseMonthKey(selectedMonth);

    Promise.allSettled([
      getSummary(month, year),
      getMonthlyFlow(month, year, 6),
      getBudgetStatus(month, year),
      getExpensesByCategory(month, year),
      getRecentTransactions(5),
    ]).then(([summaryResult, flowResult, budgetsResult, expensesResult, recentResult]) => {
      if (cancelled) return;

      setDashboard({
        monthKey: selectedMonth,
        summary:
          summaryResult.status === 'fulfilled' ? summaryResult.value : null,
        flow: flowResult.status === 'fulfilled' ? flowResult.value : null,
        budgets: budgetsResult.status === 'fulfilled' ? budgetsResult.value : [],
        expenses: expensesResult.status === 'fulfilled' ? expensesResult.value : [],
        recentTransactions:
          recentResult.status === 'fulfilled' ? recentResult.value : [],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const isLoading = dashboard.monthKey !== selectedMonth;
  const summary = dashboard.summary;
  const incomes = toAmount(summary?.incomes?.amount);
  const expenses = toAmount(summary?.expenses?.amount);
  const balance = toAmount(summary?.balance?.amount);
  const savings = toAmount(summary?.savings?.amount);
  const categories = useMemo(
    () => normalizeCategories(dashboard.expenses),
    [dashboard.expenses]
  );
  const monthOptions = useMemo(() => getMonthOptions(selectedMonth), [selectedMonth]);
  const comparisonLabel = getComparisonLabel(selectedMonth);
  const displayName = user?.name?.trim().split(/\s+/)[0] || 'Laura';
  const initials = getInitials(user?.name);
  const subtitle =
    balance < 0
      ? 'Tus gastos superan los ingresos de este mes. Revisa la distribución para encontrar oportunidades de ajuste.'
      : 'Tu dinero está trabajando bien este mes.';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Resumen"
      />

      <div className="min-h-screen lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="grid size-9 place-items-center rounded-[0.4rem] border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-primary-dark md:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <span className="hidden text-sm text-muted-foreground sm:block">Mi espacio</span>
            <span className="hidden text-muted-foreground sm:block">/</span>
            <span className="text-sm font-semibold text-foreground">Resumen</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative inline-flex h-9 items-center gap-2 rounded-[0.4rem] border border-border bg-card px-[0.7rem] text-[0.78rem] text-foreground">
              <CalendarDays size={16} className="text-muted-foreground" />
              <label htmlFor="summary-month" className="sr-only">
                Mes
              </label>
              <select
                id="summary-month"
                aria-label="Mes / Month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="cursor-pointer appearance-none bg-transparent pr-4 font-medium focus:outline-none"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2 text-muted-foreground"
              />
            </div>

            <button
              type="button"
              aria-label="Notificaciones"
              className="relative grid size-9 place-items-center rounded-[0.4rem] border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-primary-dark"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full border border-card bg-expense" />
            </button>

            <button
              type="button"
              aria-label={`Perfil de ${displayName}`}
              className="grid size-[2.15rem] place-items-center rounded-full border-0 bg-primary text-[0.72rem] font-bold text-primary-foreground"
            >
              {initials}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-9">
          <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-primary-dark">{getTodayLabel()}</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-heading md:text-4xl">
                Buenos días, {displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <a
              href="/movimientos"
              className="inline-flex min-h-[2.6rem] items-center justify-center gap-2 self-start rounded-[0.4rem] border-0 bg-primary-dark px-4 py-[0.65rem] text-[0.83rem] font-bold text-primary-foreground shadow-xs transition hover:-translate-y-px hover:bg-heading sm:self-auto"
            >
              <Plus size={18} />
              Añadir movimiento
            </a>
          </section>

          <section
            aria-label="Totales del mes"
            className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryCard
              label="Saldo disponible"
              englishLabel="Balance"
              value={balance}
              icon={WalletCards}
              featured
              negative={balance < 0}
              testId="summary-balance"
              detail={
                <ChangeDetail
                  value={summary?.balance?.change_pct}
                  comparisonLabel={comparisonLabel}
                />
              }
            />
            <SummaryCard
              label="Ingresos"
              englishLabel="Income"
              value={incomes}
              icon={ArrowDownRight}
              testId="summary-income"
              detail={
                <ChangeDetail
                  value={summary?.incomes?.change_pct}
                  comparisonLabel={comparisonLabel}
                />
              }
            />
            <SummaryCard
              label="Gastos"
              englishLabel="Expenses"
              value={expenses}
              icon={ArrowUpRight}
              testId="summary-expenses"
              detail={
                <ChangeDetail
                  value={summary?.expenses?.change_pct}
                  comparisonLabel={comparisonLabel}
                  positiveIsGood={false}
                />
              }
            />
            <SummaryCard
              label="Ahorro del mes"
              englishLabel="Savings"
              value={savings}
              icon={PiggyBank}
              testId="summary-savings"
              detail={<SavingsDetail percentage={summary?.savings?.pct_of_income} />}
            />
          </section>

          {isLoading ? (
            <section className="flex min-h-[260px] items-center justify-center rounded-[0.45rem] border border-border bg-card px-6 py-10 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
              <p className="text-xs font-medium text-muted-foreground">Cargando resumen...</p>
            </section>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)]">
                <MonthlyFlowChart
                  series={dashboard.flow?.series}
                  periodBalance={dashboard.flow?.period_balance ?? balance}
                  balanceChangePct={dashboard.flow?.balance_change_pct}
                />
                <BudgetStatus budgets={dashboard.budgets} />
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.8fr)]">
                {categories.length === 0 ? (
                  <EmptyExpenses />
                ) : (
                  <SpendingDistribution categories={categories} totalExpenses={expenses} />
                )}
                <RecentMovements transactions={dashboard.recentTransactions} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
