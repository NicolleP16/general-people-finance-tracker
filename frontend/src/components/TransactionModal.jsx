import { useState } from 'react';
import { X } from 'lucide-react';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const buildFormData = (initialData) => ({
  amount: initialData?.amount || '',
  type: initialData?.type || 'expense',
  category: initialData?.category || '',
  transaction_date: initialData?.transaction_date || getTodayDate(),
  description: initialData?.description || '',
});

export default function TransactionModal({
  isOpen = true,
  onClose,
  onSave,
  categories = [],
  initialData = null,
}) {
  const [formData, setFormData] = useState(() => buildFormData(initialData));

  const defaultCategories = [
    { id: 1, name: 'Alimentación', type: 'expense' },
    { id: 2, name: 'Transporte', type: 'expense' },
    { id: 3, name: 'Vivienda', type: 'expense' },
    { id: 4, name: 'Ocio', type: 'expense' },
    { id: 5, name: 'Salario', type: 'income' },
    { id: 6, name: 'Inversiones', type: 'income' },
  ];

  if (!isOpen) return null;

  const categoryList = categories && categories.length > 0 ? categories : defaultCategories;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.amount || !formData.category || !formData.type) return;
    onSave(formData);
    onClose();
  };

  const filteredCategories = categoryList.filter((category) => category.type === formData.type);
  const today = getTodayDate();
  const isSaveDisabled =
    !formData.category ||
    !formData.type ||
    !formData.amount ||
    Number(formData.amount) <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[0.45rem] border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-heading">
            {initialData ? 'Editar movimiento' : 'Añadir movimiento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-primary-dark"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-[0.4rem] border border-border bg-background p-1">
            <button
              type="button"
              className={`flex-1 rounded-[0.35rem] py-1.5 text-xs font-semibold transition ${
                formData.type === 'expense'
                  ? 'bg-white text-expense shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
            >
              Gasto
            </button>
            <button
              type="button"
              className={`flex-1 rounded-[0.35rem] py-1.5 text-xs font-semibold transition ${
                formData.type === 'income'
                  ? 'bg-white text-primary-dark shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold text-muted-foreground">
              Monto ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-[0.4rem] border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary-dark focus:outline-none"
              value={formData.amount}
              onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold text-muted-foreground">
              Categoría
            </label>
            <select
              aria-label="Categoría"
              className="w-full rounded-[0.4rem] border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary-dark focus:outline-none"
              value={formData.category}
              onChange={(event) => setFormData({ ...formData, category: event.target.value })}
            >
              <option value="">Selecciona categoría</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold text-muted-foreground">
              Fecha
            </label>
            <input
              type="date"
              max={today}
              required
              className="w-full rounded-[0.4rem] border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary-dark focus:outline-none"
              value={formData.transaction_date}
              onChange={(event) =>
                setFormData({ ...formData, transaction_date: event.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold text-muted-foreground">
              Descripción (máx 255 car.)
            </label>
            <input
              type="text"
              maxLength={255}
              placeholder="Ej: Almuerzo de trabajo"
              className="w-full rounded-[0.4rem] border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary-dark focus:outline-none"
              value={formData.description}
              onChange={(event) =>
                setFormData({ ...formData, description: event.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`rounded-[0.4rem] px-5 py-2.5 text-xs font-semibold shadow-xs transition ${
                isSaveDisabled
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bg-primary-dark text-primary-foreground hover:bg-heading'
              }`}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
