import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SummaryPage from '../pages/SummaryPage';
import { getTransactions } from '../services/transactionsService';

vi.mock('../services/transactionsService', () => ({
  getTransactions: vi.fn(),
}));

const expense = (id, amount, category_name, category_color = '#274E2A') => ({
  id,
  type: 'expense',
  amount,
  category: id,
  category_name,
  category_color,
});

const income = (id, amount) => ({
  id,
  type: 'income',
  amount,
  category: 99,
  category_name: 'Salario',
  category_color: '#274E2A',
});

const renderSummary = (month, transactionsByMonth = {}) => {
  getTransactions.mockImplementation(({ start_date }) => {
    const monthKey = start_date.slice(0, 7);
    return Promise.resolve(transactionsByMonth[monthKey] || []);
  });

  render(<SummaryPage />);

  fireEvent.change(screen.getByRole('combobox', { name: /mes/i }), {
    target: { value: month },
  });
};

describe('Resumen mensual', () => {
  beforeEach(() => {
    getTransactions.mockReset();
  });

  it('muestra ingresos, gastos y saldo del mes seleccionado', async () => {
    renderSummary('2026-11', {
      '2026-11': [income(1, 2000000), expense(2, 1500000, 'Alimentación')],
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-income')).toHaveTextContent(/2\.000\.000/);
    });

    expect(screen.getByTestId('summary-expenses')).toHaveTextContent(/1\.500\.000/);
    expect(screen.getByTestId('summary-balance')).toHaveTextContent(/500\.000/);
  });

  it('recalcula los totales al cambiar de mes', async () => {
    renderSummary('2026-10', {
      '2026-11': [income(1, 2000000), expense(2, 1500000, 'Alimentación')],
      '2026-10': [income(3, 900000), expense(4, 300000, 'Transporte')],
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-income')).toHaveTextContent(/900\.000/);
    });

    expect(screen.getByTestId('summary-expenses')).toHaveTextContent(/300\.000/);
    expect(screen.getByTestId('summary-balance')).toHaveTextContent(/600\.000/);
    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: '2026-10-01',
        end_date: '2026-10-31',
      })
    );
  });

  it('muestra el saldo negativo en rojo cuando los gastos superan los ingresos', async () => {
    renderSummary('2026-11', {
      '2026-11': [income(1, 500000), expense(2, 800000, 'Vivienda')],
    });

    await waitFor(() => {
      expect(screen.getByTestId('summary-balance')).toHaveTextContent(/-/);
    });

    const balance = screen.getByTestId('summary-balance');
    expect(balance).toHaveTextContent(/-.*300\.000/);
    expect(balance.className).toContain('text-[#D93829]');
  });

  it('muestra los tres totales en cero para un mes sin movimientos', async () => {
    renderSummary('2025-12', { '2025-12': [] });

    await screen.findByText('No expenses this month yet');

    expect(screen.getByTestId('summary-income')).toHaveTextContent('$ 0');
    expect(screen.getByTestId('summary-expenses')).toHaveTextContent('$ 0');
    expect(screen.getByTestId('summary-balance')).toHaveTextContent('$ 0');
  });

  it('ordena las categorías de mayor a menor gasto y muestra monto y porcentaje', async () => {
    renderSummary('2026-11', {
      '2026-11': [
        income(1, 3000000),
        expense(2, 400000, 'Transporte'),
        expense(3, 900000, 'Alimentación'),
        expense(4, 200000, 'Ocio'),
      ],
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
      '2026-11': [expense(1, 600000, 'Alimentación'), expense(2, 400000, 'Transporte')],
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
      '2026-11': [income(1, 2000000)],
    });

    expect(await screen.findByText('No expenses this month yet')).toBeInTheDocument();
    expect(screen.queryByTestId('expenses-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-list')).not.toBeInTheDocument();
  });
});
