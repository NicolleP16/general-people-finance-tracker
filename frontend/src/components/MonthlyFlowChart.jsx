import { ArrowDownRight, ArrowUpRight, LineChart } from 'lucide-react';

const SHORT_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const compactFormatter = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) => moneyFormatter.format(toAmount(value)).replace(/\u00A0/g, ' ');

const formatCompactMoney = (value) => `$ ${compactFormatter.format(toAmount(value))}`;

const getMonthLabel = (monthKey) => {
  const month = Number(String(monthKey).split('-')[1]);
  return SHORT_MONTHS[month - 1] || String(monthKey);
};

const getNiceMax = (value) => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
};

const buildSmoothPath = (points) =>
  points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const middleX = (previous.x + point.x) / 2;
    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
  }, '');

function FlowLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[0.68rem] font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <i className="size-1.5 rounded-full bg-primary-dark" />
        Ingresos
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="size-1.5 rounded-full bg-expense" />
        Gastos
      </span>
    </div>
  );
}

export default function MonthlyFlowChart({
  series = [],
  periodBalance = 0,
  balanceChangePct = null,
  className = '',
}) {
  const safeSeries = Array.isArray(series) ? series : [];
  const width = 620;
  const height = 220;
  const padding = { top: 14, right: 14, bottom: 30, left: 68 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = getNiceMax(
    Math.max(
      0,
      ...safeSeries.flatMap((point) => [toAmount(point.incomes), toAmount(point.expenses)])
    )
  );
  const step = safeSeries.length > 1 ? innerWidth / (safeSeries.length - 1) : 0;
  const buildPoints = (key) =>
    safeSeries.map((point, index) => {
      const x =
        safeSeries.length === 1
          ? padding.left + innerWidth / 2
          : padding.left + index * step;
      const y = padding.top + innerHeight - (toAmount(point[key]) / maxValue) * innerHeight;
      return { x, y, value: toAmount(point[key]), month: point.month };
    });
  const incomePoints = buildPoints('incomes');
  const expensePoints = buildPoints('expenses');
  const baseline = padding.top + innerHeight;
  const areaPath =
    incomePoints.length > 1
      ? `${buildSmoothPath(incomePoints)} L ${incomePoints[incomePoints.length - 1].x} ${baseline} L ${incomePoints[0].x} ${baseline} Z`
      : '';
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const change = Number(balanceChangePct);
  const hasChange = balanceChangePct !== null && balanceChangePct !== undefined && Number.isFinite(change);
  const isPositiveChange = hasChange && change >= 0;
  const ChangeIcon = isPositiveChange ? ArrowUpRight : ArrowDownRight;

  return (
    <section
      className={`min-w-0 rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)] ${className}`}
    >
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Flujo de dinero
          </p>
          <h2 className="mt-1 font-display text-base font-bold text-heading">Ingresos y gastos</h2>
        </div>
        <FlowLegend />
      </div>

      {safeSeries.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center text-center">
          <LineChart className="mb-2 size-8 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">
            Sin datos de flujo para este período.
          </p>
        </div>
      ) : (
        <div className="mt-5 h-52 w-full sm:h-56" data-testid="monthly-flow-chart">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            role="img"
            aria-label="Gráfico de ingresos y gastos mensuales"
          >
            <defs>
              <linearGradient id="monthlyFlowIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3F6B3A" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3F6B3A" stopOpacity="0" />
              </linearGradient>
            </defs>

            {ticks.map((tick) => {
              const y = padding.top + innerHeight - tick * innerHeight;
              return (
                <g key={`tick-${tick}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="var(--color-border)"
                    strokeDasharray={tick === 0 ? undefined : '3 4'}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    style={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  >
                    {formatCompactMoney(maxValue * tick)}
                  </text>
                </g>
              );
            })}

            {safeSeries.map((point, index) => (
              <text
                key={`label-${point.month || index}`}
                x={incomePoints[index]?.x}
                y={height - 8}
                textAnchor="middle"
                style={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
              >
                {getMonthLabel(point.month)}
              </text>
            ))}

            {areaPath && <path d={areaPath} fill="url(#monthlyFlowIncome)" />}
            <path
              d={buildSmoothPath(incomePoints)}
              fill="none"
              stroke="#3F6B3A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d={buildSmoothPath(expensePoints)}
              fill="none"
              stroke="#C77D4A"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />

            {incomePoints.map((point, index) => (
              <g key={`point-${point.month || index}`}>
                <circle cx={point.x} cy={point.y} r="8" fill="transparent">
                  <title>
                    {`${getMonthLabel(point.month)}: ingresos ${formatMoney(point.value)}, gastos ${formatMoney(expensePoints[index]?.value)}`}
                  </title>
                </circle>
                <circle cx={point.x} cy={point.y} r="2.5" fill="#3F6B3A" />
              </g>
            ))}
          </svg>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.68rem] text-muted-foreground">Balance del período</span>
          <strong className="font-display text-lg text-heading">{formatMoney(periodBalance)}</strong>
        </div>
        {hasChange && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.68rem] font-bold ${
              isPositiveChange
                ? 'bg-positive/15 text-positive'
                : 'bg-expense/10 text-expense'
            }`}
          >
            <ChangeIcon size={14} />
            {Math.abs(change).toFixed(1)}% este mes
          </span>
        )}
      </div>
    </section>
  );
}
