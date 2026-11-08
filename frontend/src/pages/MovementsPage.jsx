import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Edit2,
  Menu,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TransactionModal from '../components/TransactionModal';
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getSummary,
  getTransactions,
  updateTransaction,
} from '../services/transactionsService';

const FALLBACK_TRANSACTIONS = [
  {
    id: 1,
    type: 'expense',
    amount: 85000,
    category_name: 'Alimentación',
    description: 'Supermercado semanal',
    transaction_date: '2026-09-28',
  },
  {
    id: 2,
    type: 'income',
    amount: 3500000,
    category_name: 'Salario',
    description: 'Nómina quincenal',
    transaction_date: '2026-09-27',
  },
  {
    id: 3,
    type: 'expense',
    amount: 45000,
    category_name: 'Transporte',
    description: 'Recarga tarjeta de viaje',
    transaction_date: '2026-09-26',
  },
  {
    id: 4,
    type: 'expense',
    amount: 120000,
    category_name: 'Ocio',
    description: 'Cena con amigos',
    transaction_date: '2026-09-25',
  },
];

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
});

const formatCOP = (value) => {
  const parsed = Number(value);
  return moneyFormatter
    .format(Number.isFinite(parsed) ? parsed : 0)
    .replace(/\u00A0/g, ' ');
};

const formatPercent = (value) => `${percentFormatter.format(value)}%`;

const getTodayLabel = () => {
  const label = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const getCurrentMonthLabel = () => {
  const label = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (label.charAt(0).toUpperCase() + label.slice(1)).replace(' de ', ' ');
};

const fetchMovementsData = async (filters) => {
  const [transactions, summary, categories] = await Promise.all([
    getTransactions(filters),
    getSummary(),
    getCategories(),
  ]);

  return { transactions, summary, categories };
};

function StatCard({ label, value, icon: Icon, tone = 'positive', detail, featured = false }) {
  const isExpense = tone === 'expense';

  return (
    <article
      className={`min-w-0 rounded-[0.45rem] border border-border bg-card p-[1.15rem] shadow-[0_1px_3px_oklch(30%_0.02_120_/_0.04)] ${
        featured ? 'border-t-[3px] border-t-primary-dark' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[0.76rem] font-semibold text-muted-foreground">
        <span>{label}</span>
        <span
          className={`grid size-8 place-items-center rounded-[0.35rem] ${
            isExpense ? 'bg-expense/10 text-expense' : 'bg-secondary text-primary-dark'
          }`}
        >
          <Icon size={18} />
        </span>
      </div>

      <strong
        className={`mt-3.5 block break-words font-display text-2xl font-bold tracking-tight ${
          isExpense ? 'text-expense' : 'text-heading'
        }`}
      >
        {formatCOP(value)}
      </strong>

      <p className="mt-2.5 text-[0.7rem] text-muted-foreground">{detail}</p>
    </article>
  );
}

export default function MovementsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    balance: 5430800,
    incomes: 7250000,
    expenses: 4819200,
    savings: 2430800,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const applyData = useCallback(({ transactions: nextTransactions, summary: nextSummary, categories: nextCategories }) => {
    if (nextTransactions && nextTransactions.length > 0) setTransactions(nextTransactions);
    if (nextSummary && nextSummary.balance !== undefined) setSummary(nextSummary);
    if (nextCategories && nextCategories.length > 0) setCategories(nextCategories);
  }, []);

  useEffect(() => {
    let active = true;

    fetchMovementsData({ type: filterType, category: filterCategory })
      .then((data) => {
        if (active) applyData(data);
      })
      .catch(() => {
        if (active) setTransactions(FALLBACK_TRANSACTIONS);
      });

    return () => {
      active = false;
    };
  }, [filterType, filterCategory, applyData]);

  const loadData = async () => {
    try {
      const data = await fetchMovementsData({ type: filterType, category: filterCategory });
      applyData(data);
    } catch {
      setTransactions(FALLBACK_TRANSACTIONS);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedTx) {
        await updateTransaction(selectedTx.id, formData);
      } else {
        await createTransaction(formData);
      }
      setSelectedTx(null);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar movimiento');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta transacción?')) {
      try {
        await deleteTransaction(id);
      } catch {
        setTransactions((current) => current.filter((transaction) => transaction.id !== id));
      }
      await loadData();
    }
  };

  const filteredList = transactions.filter((transaction) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const descriptionMatch = (transaction.description || '').toLowerCase().includes(normalizedSearch);
    const categoryMatch = (transaction.category_name || '').toLowerCase().includes(normalizedSearch);
    return descriptionMatch || categoryMatch;
  });

  const incomes = Number(summary.incomes) || 0;
  const savings = Math.max(Number(summary.savings ?? summary.balance) || 0, 0);
  const savingsRatio = incomes > 0 ? (savings / incomes) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

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
            <span className="text-sm font-semibold text-foreground">Movimientos</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 items-center gap-2 rounded-[0.4rem] border border-border bg-card px-[0.7rem] text-[0.78rem] text-foreground">
              <CalendarDays size={16} className="text-muted-foreground" />
              <span className="font-medium">{getCurrentMonthLabel()}</span>
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

        <main className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-9">
          <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-primary-dark">{getTodayLabel()}</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-heading md:text-4xl">
                Movimientos
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Revisa, filtra y administra tus ingresos y gastos.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedTx(null);
                setIsModalOpen(true);
              }}
              className="inline-flex min-h-[2.6rem] items-center justify-center gap-2 self-start rounded-[0.4rem] border-0 bg-primary-dark px-4 py-[0.65rem] text-[0.83rem] font-bold text-primary-foreground shadow-xs transition hover:-translate-y-px hover:bg-heading sm:self-auto"
            >
              <Plus size={18} />
              Añadir movimiento
            </button>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Saldo disponible"
              value={summary.balance}
              icon={Wallet}
              featured
              detail="Balance del mes"
            />
            <StatCard
              label="Ingresos"
              value={summary.incomes}
              icon={ArrowDownRight}
              detail="Total registrado este mes"
            />
            <StatCard
              label="Gastos"
              value={summary.expenses}
              icon={ArrowUpRight}
              tone="expense"
              detail="Total registrado este mes"
            />
            <StatCard
              label="Ahorro del mes"
              value={savings}
              icon={PiggyBank}
              detail={incomes > 0 ? `${formatPercent(savingsRatio)} de tus ingresos` : 'Sin ingresos este mes'}
            />
          </section>

          <section className="mb-6 rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Flujo de dinero
                </p>
                <h2 className="mt-1 font-display text-base font-bold text-heading">
                  Ingresos y gastos
                </h2>
              </div>
              <div className="flex items-center gap-4 text-[0.68rem] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <i className="size-1.5 rounded-full bg-primary-dark" />
                  Ingresos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="size-1.5 rounded-full bg-expense" />
                  Gastos
                </span>
              </div>
            </div>

            <div className="relative mt-6 h-36 w-full sm:h-44">
              <svg viewBox="0 0 500 120" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3F6B3A" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3F6B3A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,80 Q 75,50 150,70 T 300,45 T 450,20 L 500,15 L 500,120 L 0,120 Z"
                  fill="url(#incomeGradient)"
                />
                <path
                  d="M 0,80 Q 75,50 150,70 T 300,45 T 450,20 L 500,15"
                  fill="none"
                  stroke="#3F6B3A"
                  strokeWidth="2.5"
                />
                <path
                  d="M 0,105 Q 85,95 170,100 T 340,90 T 500,75"
                  fill="none"
                  stroke="#C77D4A"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.68rem] text-muted-foreground">Balance del período</span>
                <strong className="font-display text-lg text-heading">{formatCOP(summary.balance)}</strong>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[0.68rem] font-bold text-positive">
                Flujo acumulado
              </span>
            </div>
          </section>

          <section className="rounded-[0.45rem] border border-border bg-card p-5 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)]">
            <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Actividad
                </p>
                <h2 className="mt-1 font-display text-base font-bold text-heading">
                  Historial de movimientos
                </h2>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:w-56">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar movimiento..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-[0.4rem] border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary-dark focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    className="flex-1 cursor-pointer rounded-[0.4rem] border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary-dark focus:outline-none sm:flex-initial"
                  >
                    <option value="">Tipo</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Gastos</option>
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(event) => setFilterCategory(event.target.value)}
                    className="flex-1 cursor-pointer rounded-[0.4rem] border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary-dark focus:outline-none sm:flex-initial"
                  >
                    <option value="">Categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredList.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground">
                  No hay movimientos para estos filtros
                </p>
              ) : (
                filteredList.map((transaction) => {
                  const isIncome = transaction.type === 'income';

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-2 rounded-[0.4rem] px-2 py-3 transition hover:bg-background"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`grid size-9 shrink-0 place-items-center rounded-[0.4rem] ${
                            isIncome ? 'bg-secondary text-primary-dark' : 'bg-expense/10 text-expense'
                          }`}
                        >
                          {isIncome ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="truncate">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {transaction.description || transaction.category_name}
                          </p>
                          <span className="block truncate text-[0.68rem] text-muted-foreground">
                            {transaction.transaction_date} · {transaction.category_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                        <span
                          className={`text-xs font-bold sm:text-sm ${
                            isIncome ? 'text-positive' : 'text-expense'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCOP(transaction.amount)}
                        </span>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTx(transaction);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-muted-foreground transition hover:text-primary-dark"
                            title="Editar"
                            aria-label={`Editar ${transaction.description || transaction.category_name}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(transaction.id)}
                            className="p-1 text-muted-foreground transition hover:text-expense"
                            title="Eliminar"
                            aria-label={`Eliminar ${transaction.description || transaction.category_name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>

      {isModalOpen && (
        <TransactionModal
          key={selectedTx?.id ?? 'new'}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          categories={categories}
          initialData={selectedTx}
        />
      )}
    </div>
  );
}
