import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  categories = [], 
  initialData = null 
}) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const defaultCategories = [
    { id: 1, name: 'Alimentación', type: 'expense' },
    { id: 2, name: 'Transporte', type: 'expense' },
    { id: 3, name: 'Vivienda', type: 'expense' },
    { id: 4, name: 'Ocio', type: 'expense' },
    { id: 5, name: 'Salario', type: 'income' },
    { id: 6, name: 'Inversiones', type: 'income' },
  ];

  const categoryList = (categories && categories.length > 0) ? categories : defaultCategories;

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount || '',
        type: initialData.type || 'expense',
        category: initialData.category || '',
        transaction_date: initialData.transaction_date || new Date().toISOString().split('T')[0],
        description: initialData.description || '',
      });
    } else {
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.type) return;
    onSave(formData);
    onClose();
  };

  const filteredCategories = categoryList.filter((c) => c.type === formData.type);
  const today = new Date().toISOString().split('T')[0];

  // Criterio HU-02: Guardar deshabilitado si no hay categoría, tipo o monto > 0
  const isSaveDisabled = !formData.category || !formData.type || !formData.amount || Number(formData.amount) <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#E8ECE4] animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-serif font-bold text-[#1A331C]">
            {initialData ? 'Editar movimiento' : 'Añadir movimiento'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#F2F5F0] rounded-full text-[#738870] transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle Gasto / Ingreso */}
          <div className="flex p-1 bg-[#F1F4EE] rounded-xl border border-[#E4EAE0]">
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                formData.type === 'expense'
                  ? 'bg-white text-[#D93829] shadow-xs'
                  : 'text-[#62775E] hover:text-[#1A331C]'
              }`}
              onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
            >
              Gasto
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                formData.type === 'income'
                  ? 'bg-white text-[#274E2A] shadow-xs'
                  : 'text-[#62775E] hover:text-[#1A331C]'
              }`}
              onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
            >
              Ingreso
            </button>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-[11px] font-semibold text-[#556F53] mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-[#FBFDFB] border border-[#DEE6DA] rounded-xl text-sm font-medium text-[#1A331C] placeholder:text-[#9FB19D] focus:outline-none focus:border-[#274E2A] focus:ring-1 focus:ring-[#274E2A]"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[11px] font-semibold text-[#556F53] mb-1">Categoría</label>
            <select
              aria-label="Categoría"
              className="w-full px-3.5 py-2.5 bg-[#FBFDFB] border border-[#DEE6DA] rounded-xl text-sm font-medium text-[#1A331C] focus:outline-none focus:border-[#274E2A] focus:ring-1 focus:ring-[#274E2A]"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Selecciona categoría</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-[11px] font-semibold text-[#556F53] mb-1">Fecha</label>
            <input
              type="date"
              max={today}
              required
              className="w-full px-3.5 py-2.5 bg-[#FBFDFB] border border-[#DEE6DA] rounded-xl text-sm font-medium text-[#1A331C] focus:outline-none focus:border-[#274E2A]"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[11px] font-semibold text-[#556F53] mb-1">Descripción (máx 255 car.)</label>
            <input
              type="text"
              maxLength={255}
              placeholder="Ej: Almuerzo de trabajo"
              className="w-full px-3.5 py-2.5 bg-[#FBFDFB] border border-[#DEE6DA] rounded-xl text-sm font-medium text-[#1A331C] placeholder:text-[#9FB19D] focus:outline-none focus:border-[#274E2A]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Botones */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#62775E] hover:text-[#1A331C] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition shadow-xs ${
                isSaveDisabled
                  ? 'bg-[#E3E8DF] text-[#8EA08C] cursor-not-allowed'
                  : 'bg-[#274E2A] hover:bg-[#1E3F21] text-white'
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