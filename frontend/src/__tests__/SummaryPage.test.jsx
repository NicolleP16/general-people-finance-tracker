import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SummaryPage from '../pages/SummaryPage';
import {
  getBudgetStatus,
  getExpensesByCategory,
  getMonthlyFlow,
  getRecentTransactions,
  getSummary,
} from '../services/dashboardService';

vi.mock('../services/dashboardService', () => ({
  getSummary: vi.fn(),
  getMonthlyFlow: vi.fn(),
  getBudgetStatus: vi.fn(),
  getExpensesByCategory: vi.fn(),
  getRecentTransactions: vi.fn(),
}));

const monthKey = (month, year) => `${year}-${String(month).padStart(2, '0')}`;

const emptySummary = (month, year) => ({
  period: { month, year },
  incomes: { amount: 0, change_pct: null },
  expenses: { amount: 0, change_pct: null },
  balance: { amount: 0, change_pct: null },
  savings: { amount: 0, pct_of_income: null },
});

const makeSummary = ({
  month = 11,
  year = 2026,
  incomes = 0,
  expenses = 0,
  balance = incomes - expenses,
  savings = Math.max(balance, 0),
  incomeChange = null,
  expenseChange = null,
  balanceChange = null,
  savingsPct = null,
} = {}) => ({
  period: { month, year },
  incomes: { amount: incomes, change_pct: incomeChange },
  expenses: { amount: expenses, change_pct: expenseChange },
  balance: { amount: balance, change_pct: balanceChange },
  savings: { amount: savings, pct_of_income: savingsPct },
});

const emptyFlow = () => ({
  series: [],
  period_balance: 0,
  balance_change_pct: null,
});

const category = (name, total, percentage, color = '#3F6B3A') => ({
  category_id: name,
  name,
  total,
  percentage,
  color,
});

const renderSummary = (selectedMonth, data = {}) => {
  getSummary.mockImplementation((month, year) =>
    Promise.resolve(
      data.summaries?.[monthKey(month, year)] || emptySummary(month, year)
    )
  );
  getMonthlyFlow.mockImplementation((month, year) =>
    Promise.resolve(data.flows?.[monthKey(month, year)] || emptyFlow())
  );
  getBudgetStatus.mockImplementation((month, year) =>
    Promise.resolve(data.budgets?.[monthKey(month, year)] || [])
  );
  getExpensesByCategory.mockImplementation((month, year) =>
    Promise.resolve(data.expenses?.[monthKey(month, year)] || [])
  );
  getRecentTransactions.mockResolvedValue(data.recent || []);

  render(<SummaryPage />);

  fireEvent.change(screen.getByRole('combobox', { name: /mes/i }), {
    target: { value: selectedMonth },
  });
};

describe('Resumen mensual', () => {
  beforeEach(() => {
    getSummary.mockReset();
    getMonthlyFlow.mockReset();
    getBudgetStatus.mockReset();
    getExpensesByCategory.mockReset();
    getRecentTransactions.mockReset();
  });

  it('muestra ingresos, gastos y saldo del mes seleccionado', async () => {
    renderSummary('2026-11', {
      summaries: {
        '2026-11': makeSummary({
          incomes: 2000000,
          expenses: 1500000,
          balanceChange: 12.4,
          savingsPct: 25,
        }),
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-income')).toHaveTextContent(/2\.000\.000/);
    });

    expect(screen.getByTestId('summary-expenses')).toHaveTextContent(/1\.500\.000/);
    expect(screen.getByTestId('summary-balance')).toHaveTextContent(/500\.000/);
    expect(screen.getByTestId('summary-savings')).toHaveTextContent(/500\.000/);
  });

  it('recalcula los totales al cambiar de mes y consulta el dashboard', async () => {
    renderSummary('2026-10', {
      summaries: {
        '2026-10': makeSummary({ month: 10, incomes: 900000, expenses: 300000 }),
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-income')).toHaveTextContent(/900\.000/);
    });

    expect(screen.getByTestId('summary-expenses')).toHaveTextContent(/300\.000/);
    expect(screen.getByTestId('summary-balance')).toHaveTextContent(/600\.000/);
    expect(getSummary).toHaveBeenCalledWith(10, 2026);
    expect(getMonthlyFlow).toHaveBeenCalledWith(10, 2026, 6);
    expect(getBudgetStatus).toHaveBeenCalledWith(10, 2026);
    expect(getExpensesByCategory).toHaveBeenCalledWith(10, 2026);
    expect(getRecentTransactions).toHaveBeenCalledWith(5);
  });

  it('muestra el saldo negativo en rojo cuando los gastos superan los ingresos', async () => {
    renderSummary('2026-11', {
      summaries: {
        '2026-11': makeSummary({
          incomes: 500000,
          expenses: 800000,
          balance: -300000,
          savings: 0,
          expenseChange: 12,
        }),
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-balance')).toHaveTextContent(/-/);
    });

    const balance = screen.getByTestId('summary-balance');
    expect(balance).toHaveTextContent(/-.*300\.000/);
    expect(balance.className).toContain('text-[#D93829]');
  });

  it('muestra los totales en cero para un mes sin movimientos', async () => {
    renderSummary('2025-12', {
      summaries: { '2025-12': emptySummary(12, 2025) },
    });

    await screen.findByText('No expenses this month yet');

    expect(screen.getByTestId('summary-income')).toHaveTextContent('$ 0');
    expect(screen.getByTestId('summary-expenses')).toHaveTextContent('$ 0');
    expect(screen.getByTestId('summary-balance')).toHaveTextContent('$ 0');
    expect(screen.getByTestId('summary-savings')).toHaveTextContent('$ 0');
  });

  it('ordena las categorías de mayor a menor gasto y muestra monto y porcentaje', async () => {
    renderSummary('2026-11', {
      summaries: {
        '2026-11': makeSummary({ incomes: 3000000, expenses: 1500000 }),
      },
      expenses: {
        '2026-11': [
          category('Transporte', 400000, 33.3),
          category('Alimentación', 900000, 60),
          category('Ocio', 200000, 6.7),
        ],
      },
    });

    await screen.findByTestId('expenses-chart');

    const rows = screen.getAllByTestId('category-row');
    expect(rows.map((row) => row.dataset.category)).toEqual([
      'Alimentación',
      'Transporte',
      'Ocio',
    ]);
    expect(rows[0]).toHaveTextContent(/900\.000/);
    expect(rows[0]).toHaveTextContent('60%');
    expect(within(screen.getByTestId('category-list')).queryByText('Salario')).not.toBeInTheDocument();
  });

  it('muestra nombre, monto y porcentaje al pasar el cursor sobre una categoría', async () => {
    renderSummary('2026-11', {
      summaries: {
        '2026-11': makeSummary({ expenses: 1000000 }),
      },
      expenses: {
        '2026-11': [
          category('Alimentación', 600000, 60),
          category('Transporte', 400000, 40),
        ],
      },
    });

    await screen.findByTestId('expenses-chart');

    fireEvent.mouseEnter(screen.getAllByTestId('category-row')[0]);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Alimentación');
    expect(tooltip).toHaveTextContent(/600\.000/);
    expect(tooltip).toHaveTextContent('60%');
  });

  it('muestra un mensaje cuando el mes no tiene gastos', async () => {
    renderSummary('2026-11', {
      summaries: {
        '2026-11': makeSummary({ incomes: 2000000 }),
      },
      expenses: { '2026-11': [] },
    });

    expect(await screen.findByText('No expenses this month yet')).toBeInTheDocument();
    expect(screen.queryByTestId('expenses-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-list')).not.toBeInTheDocument();
  });

  it('renderiza el flujo mensual con su balance y variación', async () => {
    renderSummary('2026-11', {
      summaries: { '2026-11': makeSummary({ incomes: 7250000, expenses: 4819200 }) },
      flows: {
        '2026-11': {
          series: [
            { month: '2026-04', incomes: 4300000, expenses: 2800000 },
            { month: '2026-05', incomes: 5500000, expenses: 3500000 },
          ],
          period_balance: 2430800,
          balance_change_pct: 18,
        },
      },
    });

    const chart = await screen.findByTestId('monthly-flow-chart');
    const flowCard = chart.closest('section');

    expect(within(flowCard).getByText('Balance del período')).toBeInTheDocument();
    expect(within(flowCard).getByText(/2\.430\.800/)).toBeInTheDocument();
    expect(within(flowCard).getByText(/18\.0% este mes/)).toBeInTheDocument();
    expect(within(flowCard).getByText('Abr')).toBeInTheDocument();
    expect(within(flowCard).getByText('May')).toBeInTheDocument();
  });

  it('renderiza presupuestos con su estado y porcentaje real', async () => {
    renderSummary('2026-11', {
      summaries: { '2026-11': makeSummary() },
      budgets: {
        '2026-11': [
          {
            category_id: 1,
            name: 'Alimentación',
            spent: 685000,
            limit: 900000,
            used_pct: 76.1,
            status: 'ok',
          },
          {
            category_id: 2,
            name: 'Ocio',
            spent: 440000,
            limit: 400000,
            used_pct: 110,
            status: 'exceeded',
          },
        ],
      },
    });

    await screen.findByTestId('budget-list');

    const rows = screen.getAllByTestId('budget-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Alimentación');
    expect(rows[0]).toHaveTextContent('76,1% utilizado');
    expect(rows[1]).toHaveTextContent('Ocio');
    expect(rows[1]).toHaveTextContent('110% utilizado');
    expect(rows[1]).toHaveTextContent('Excedido');
  });

  it('renderiza los movimientos recientes con monto y signo', async () => {
    renderSummary('2026-11', {
      summaries: { '2026-11': makeSummary() },
      recent: [
        {
          id: 1,
          type: 'expense',
          amount: '186400.00',
          category_name: 'Alimentación',
          category_color: '#E53935',
          description: 'Mercado Central',
          transaction_date: '2026-09-27',
        },
        {
          id: 2,
          type: 'income',
          amount: '4850000.00',
          category_name: 'Salario',
          category_color: '#274E2A',
          description: 'Nómina mensual',
          transaction_date: '2026-09-28',
        },
      ],
    });

    await screen.findByText('Mercado Central');

    const rows = screen.getAllByTestId('recent-transaction');
    expect(rows[0]).toHaveTextContent(/186\.400/);
    expect(rows[0]).toHaveTextContent('−');
    expect(rows[1]).toHaveTextContent(/4\.850\.000/);
    expect(rows[1]).toHaveTextContent('+');
  });
});
