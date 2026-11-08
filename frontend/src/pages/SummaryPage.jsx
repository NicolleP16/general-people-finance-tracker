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
  TrendingUp,
  WalletCards,
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
  '#3F6B3A',
  '#7C9A6D',
  '#A9BC8F',
  '#D9A441',
  '#C77D4A',
  '#A65D57',
  '#6F8274',
  '#8A7D5A',
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

const getLowerMonthLabel = (monthKey) => {
  const { month } = parseMonthKey(monthKey);
  return MONTH_NAMES[month - 1].toLowerCase();
};

const getMonthEnd = (monthKey) => {
  const { year, month } = parseMonthKey(monthKey);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(lastDay).padStart(2, '0')}`;
};

const getCurrentMonthKey = () => formatMonthKey(new Date());

const getPreviousMonthKey = (monthKey) => {
  const { year, month } = parseMonthKey(monthKey);
  return formatMonthKey(new Date(year, month - 2, 1));
};

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

const summarizeTransactions = (transactions) => {
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
};

const buildCategoryBreakdown = (transactions, totalExpenses) => {
  const grouped = new Map();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const key = transaction.category ?? transaction.category_name ?? 'sin-categoria';
      const current = grouped.get(key) || {
        name: transaction.category_name || 'Sin categoría',
        total: 0,
      };

      current.total += toAmount(transaction.amount);
      grouped.set(key, current);
    });

  return Array.from(grouped.values())
    .sort((a, b) => b.total - a.total)
    .map((category, index) => ({
      ...category,
      color: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
      percentage: totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0,
    }));
};

const getPercentChange = (current, previous) => {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const getTodayLabel = () => {
  const label = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return label.charAt(0).toUpperCase() + label.slice(1);
};

function SummaryChange({ change, comparisonLabel }) {
  if (change === null) {
    return (
      <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
        <span className="grid size-[1.15rem] place-items-center rounded-full bg-muted text-muted-foreground">
          <Minus size={12} />
        </span>
        Sin comparación mensual
      </div>
    );
  }

  const isUp = change >= 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
      <span
        className={`grid size-[1.15rem] place-items-center rounded-full ${
          isUp ? 'bg-positive/20 text-positive' : 'bg-expense/15 text-expense'
        }`}
      >
        <Icon size={12} />
      </span>
      {formatPercent(Math.abs(change))} {comparisonLabel}
    </div>
  );
}

function SavingsDetail({ ratio, hasIncome }) {
  const isPositive = hasIncome && ratio > 0;

  return (
    <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
      <span
        className={`grid size-[1.15rem] place-items-center rounded-full ${
          isPositive ? 'bg-positive/20 text-positive' : 'bg-muted text-muted-foreground'
        }`}
      >
        {isPositive ? <TrendingUp size={12} /> : <Minus size={12} />}
      </span>
      {hasIncome ? `${formatPercent(ratio)} de tus ingresos` : 'Sin ingresos este mes'}
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

function SpendingDistribution({ expenses, breakdown }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

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
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)]">
      <article className="min-w-0 rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Gastos por categoría
            </p>
            <h2 className="mt-1 font-display text-base font-bold text-heading">
              Distribución de gastos
            </h2>
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[0.68rem] text-muted-foreground">
            {breakdown.map((category) => (
              <span key={`legend-${category.name}`} className="inline-flex items-center gap-1.5">
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
                    key={`segment-${category.name}`}
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
                {formatMoney(expenses)}
              </span>
            </div>

            {hoveredCategory && <CategoryTooltip category={hoveredCategory} />}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.68rem] text-muted-foreground">Total gastado</span>
            <strong className="font-display text-lg text-heading">{formatMoney(expenses)}</strong>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[0.68rem] font-bold text-positive">
            <PieChart size={14} />
            {breakdown.length} {breakdown.length === 1 ? 'categoría' : 'categorías'}
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
          {breakdown.map((category) => (
            <div
              key={category.name}
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

export default function SummaryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [monthlyData, setMonthlyData] = useState({
    month: null,
    previousMonth: null,
    transactions: [],
    previousTransactions: [],
  });

  useEffect(() => {
    let cancelled = false;
    const previousMonth = getPreviousMonthKey(selectedMonth);

    Promise.all([
      getTransactions({
        start_date: `${selectedMonth}-01`,
        end_date: getMonthEnd(selectedMonth),
        page_size: 1000,
      }),
      getTransactions({
        start_date: `${previousMonth}-01`,
        end_date: getMonthEnd(previousMonth),
        page_size: 1000,
      }).catch(() => []),
    ])
      .then(([transactions, previousTransactions]) => {
        if (!cancelled) {
          setMonthlyData({
            month: selectedMonth,
            previousMonth,
            transactions: Array.isArray(transactions) ? transactions : [],
            previousTransactions: Array.isArray(previousTransactions)
              ? previousTransactions
              : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMonthlyData({
            month: selectedMonth,
            previousMonth,
            transactions: [],
            previousTransactions: [],
          });
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

  const previousMonth = useMemo(
    () => getPreviousMonthKey(selectedMonth),
    [selectedMonth]
  );

  const previousTransactions = useMemo(
    () =>
      monthlyData.previousMonth === previousMonth ? monthlyData.previousTransactions : [],
    [monthlyData, previousMonth]
  );

  const isLoading = monthlyData.month !== selectedMonth;

  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);
  const previousSummary = useMemo(
    () => summarizeTransactions(previousTransactions),
    [previousTransactions]
  );

  const breakdown = useMemo(
    () => buildCategoryBreakdown(transactions, summary.expenses),
    [transactions, summary.expenses]
  );

  const monthOptions = useMemo(() => getMonthOptions(selectedMonth), [selectedMonth]);

  const previousHasData = previousTransactions.length > 0;
  const comparisonLabel = `vs. ${getLowerMonthLabel(previousMonth)}`;
  const incomeChange = previousHasData
    ? getPercentChange(summary.incomes, previousSummary.incomes)
    : null;
  const expensesChange = previousHasData
    ? getPercentChange(summary.expenses, previousSummary.expenses)
    : null;
  const balanceChange = previousHasData
    ? getPercentChange(summary.balance, previousSummary.balance)
    : null;
  const savings = Math.max(summary.balance, 0);
  const savingsRatio = summary.incomes > 0 ? (savings / summary.incomes) * 100 : 0;

  const subtitle =
    summary.balance < 0
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
              aria-label="Perfil de Laura"
              className="grid size-[2.15rem] place-items-center rounded-full border-0 bg-primary text-[0.72rem] font-bold text-primary-foreground"
            >
              LA
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-9">
          <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-primary-dark">{getTodayLabel()}</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-heading md:text-4xl">
                Buenos días, Laura
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
              value={summary.balance}
              icon={WalletCards}
              featured
              negative={summary.balance < 0}
              testId="summary-balance"
              detail={<SummaryChange change={balanceChange} comparisonLabel={comparisonLabel} />}
            />
            <SummaryCard
              label="Ingresos"
              englishLabel="Income"
              value={summary.incomes}
              icon={ArrowDownRight}
              testId="summary-income"
              detail={<SummaryChange change={incomeChange} comparisonLabel={comparisonLabel} />}
            />
            <SummaryCard
              label="Gastos"
              englishLabel="Expenses"
              value={summary.expenses}
              icon={ArrowUpRight}
              testId="summary-expenses"
              detail={<SummaryChange change={expensesChange} comparisonLabel={comparisonLabel} />}
            />
            <SummaryCard
              label="Ahorro del mes"
              englishLabel="Savings"
              value={savings}
              icon={PiggyBank}
              testId="summary-savings"
              detail={<SavingsDetail ratio={savingsRatio} hasIncome={summary.incomes > 0} />}
            />
          </section>

          {isLoading ? (
            <section className="flex min-h-[260px] items-center justify-center rounded-[0.45rem] border border-border bg-card px-6 py-10 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
              <p className="text-xs font-medium text-muted-foreground">Cargando resumen...</p>
            </section>
          ) : summary.expenses === 0 ? (
            <section className="flex min-h-[260px] flex-col items-center justify-center rounded-[0.45rem] border border-dashed border-border bg-card px-6 py-12 text-center shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
              <PieChart className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No expenses this month yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aún no hay gastos registrados en este mes.
              </p>
            </section>
          ) : (
            <SpendingDistribution expenses={summary.expenses} breakdown={breakdown} />
          )}
        </div>
      </div>
    </div>
  );
}
