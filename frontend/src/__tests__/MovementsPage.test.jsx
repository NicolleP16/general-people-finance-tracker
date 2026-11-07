import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionModal from '../components/TransactionModal';

describe('Pruebas unitarias de Movimientos - Nicolle Paz (HU-02 / Vitest)', () => {
  const mockCategories = [
    { id: 1, name: 'Alimentación', type: 'expense' },
    { id: 2, name: 'Salario', type: 'income' },
  ];

  it('TransactionForm deshabilita Guardar sin categoría', () => {
    render(
      <TransactionModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        categories={mockCategories}
      />
    );

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '50000' } });

    const saveButton = screen.getByRole('button', { name: /Guardar/i });
    expect(saveButton).toBeDisabled();
  });

  it('habilita el botón Guardar cuando se selecciona categoría y monto válido', () => {
    render(
      <TransactionModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        categories={mockCategories}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '45000' } });
    fireEvent.change(screen.getByLabelText(/Categoría/i), { target: { value: '1' } });

    const saveButton = screen.getByRole('button', { name: /Guardar/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('llama a onSave con los datos correctos al enviar el formulario', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        categories={mockCategories}
      />
    );

    // Llenamos el formulario
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '25000' } });
    fireEvent.change(screen.getByLabelText(/Categoría/i), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText(/Almuerzo de trabajo/i), { target: { value: 'Almuerzo' } });

    // Hacemos submit en Guardar
    const saveButton = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('permite alternar a tipo Ingreso y cancelar el modal', () => {
    const handleClose = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={handleClose}
        onSave={() => {}}
        categories={mockCategories}
      />
    );

    // Alternar a Ingreso
    const ingresoBtn = screen.getByRole('button', { name: /Ingreso/i });
    fireEvent.click(ingresoBtn);
    expect(screen.getByText('Salario')).toBeInTheDocument();

    // Cancelar
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});