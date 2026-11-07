import React, { useState, useEffect } from 'react';
import { 
  Plus, ArrowDownLeft, ArrowUpRight, Trash2, Edit2, 
  Calendar, Bell, Wallet, PiggyBank, Search, Menu 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TransactionModal from '../components/TransactionModal';
import {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
} from '../services/transactionsService';

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

  const loadData = async () => {
    try {
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterCategory) filters.category = filterCategory;

      const [txs, sum, cats] = await Promise.all([
        getTransactions(filters),
        getSummary(),
        getCategories(),
      ]);

      if (txs && txs.length > 0) setTransactions(txs);
      if (sum && sum.balance !== undefined) setSummary(sum);
      if (cats && cats.length > 0) setCategories(cats);
    } catch {
      setTransactions([
        { id: 1, type: 'expense', amount: 85000, category_name: 'Alimentación', description: 'Supermercado semanal', transaction_date: '2026-09-28' },
        { id: 2, type: 'income', amount: 3500000, category_name: 'Salario', description: 'Nómina quincenal', transaction_date: '2026-09-27' },
        { id: 3, type: 'expense', amount: 45000, category_name: 'Transporte', description: 'Recarga tarjeta de viaje', transaction_date: '2026-09-26' },
        { id: 4, type: 'expense', amount: 120000, category_name: 'Ocio', description: 'Cena con amigos', transaction_date: '2026-09-25' },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, filterCategory]);

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
      alert(err.response?.data?.error || "Error al registrar movimiento");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta transacción?")) {
      try {
        await deleteTransaction(id);
      } catch {
        setTransactions(transactions.filter(t => t.id !== id));
      }
      await loadData();
    }
  };

  const formatCOP = (val) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const filteredList = transactions.filter(t => {
    const descMatch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = (t.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return descMatch || catMatch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-[#1A331C] font-sans antialiased">
      {/* Sidebar fijo e inmóvil */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenedor con lg:pl-64: reserva el espacio para el sidebar y permite scroll solo en el contenido */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {/* Barra Superior */}
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
                <span className="text-[#1A331C] font-semibold">Movimientos</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-[#DEE6DA] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1A331C] shadow-2xs">
                <Calendar size={13} className="text-[#62775E]" />
                <span className="text-[11px] sm:text-xs">Septiembre 2026</span>
              </div>

              <button className="w-8 h-8 rounded-xl bg-white border border-[#DEE6DA] flex items-center justify-center text-[#62775E] hover:text-[#1A331C] shadow-2xs transition">
                <Bell size={14} />
              </button>

              <div className="w-8 h-8 rounded-full bg-[#274E2A] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                LA
              </div>
            </div>
          </header>

          {/* Encabezado y Acción */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-7">
            <div>
              <p className="text-xs font-medium text-[#738870] capitalize">Lunes, 28 de septiembre</p>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#142A16] mt-0.5">
                Buenos días, Laura
              </h1>
              <p className="text-xs text-[#556F53] mt-1">Tu dinero está trabajando bien este mes.</p>
            </div>

            <button
              onClick={() => { setSelectedTx(null); setIsModalOpen(true); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#274E2A] hover:bg-[#1E3F21] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Añadir movimiento</span>
            </button>
          </div>

          {/* Métricas (KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
            <div className="bg-white border border-[#E4EAE0] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#62775E]">Saldo disponible</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF2E8] text-[#274E2A] flex items-center justify-center">
                  <Wallet size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#142A16]">{formatCOP(summary.balance)}</p>
              <p className="text-[11px] font-medium text-[#2E6833] mt-2 flex items-center gap-1">
                <span>↗ 12,4%</span> <span className="text-[#738870]">vs. agosto</span>
              </p>
            </div>

            <div className="bg-white border border-[#E4EAE0] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#62775E]">Ingresos</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF2E8] text-[#274E2A] flex items-center justify-center">
                  <ArrowDownLeft size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#142A16]">{formatCOP(summary.incomes)}</p>
              <p className="text-[11px] font-medium text-[#2E6833] mt-2 flex items-center gap-1">
                <span>↗ 8,2%</span> <span className="text-[#738870]">vs. agosto</span>
              </p>
            </div>

            <div className="bg-white border border-[#E4EAE0] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#62775E]">Gastos</span>
                <div className="w-7 h-7 rounded-lg bg-[#FBECEB] text-[#D93829] flex items-center justify-center">
                  <ArrowUpRight size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#142A16]">{formatCOP(summary.expenses)}</p>
              <p className="text-[11px] font-medium text-[#D93829] mt-2 flex items-center gap-1">
                <span>↘ 3,1%</span> <span className="text-[#738870]">vs. agosto</span>
              </p>
            </div>

            <div className="bg-white border border-[#E4EAE0] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#62775E]">Ahorro del mes</span>
                <div className="w-7 h-7 rounded-lg bg-[#EBF2E8] text-[#274E2A] flex items-center justify-center">
                  <PiggyBank size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#142A16]">{formatCOP(summary.savings)}</p>
              <p className="text-[11px] font-medium text-[#2E6833] mt-2 flex items-center gap-1">
                <span>↗ 33,5%</span> <span className="text-[#738870]">de tus ingresos</span>
              </p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white border border-[#E4EAE0] rounded-2xl p-4 sm:p-5 mb-6 sm:mb-7 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#738870] uppercase">Flujo de Dinero</p>
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#142A16]">Ingresos y gastos</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#274E2A]" />
                  <span className="text-[#556F53]">Ingresos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D93829]" />
                  <span className="text-[#556F53]">Gastos</span>
                </div>
              </div>
            </div>

            <div className="h-28 sm:h-36 w-full relative flex items-end">
              <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#274E2A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#274E2A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0,80 Q 75,50 150,70 T 300,45 T 450,20 L 500,15 L 500,120 L 0,120 Z" fill="url(#incomeGrad)" />
                <path d="M 0,80 Q 75,50 150,70 T 300,45 T 450,20 L 500,15" fill="none" stroke="#274E2A" strokeWidth="2.5" />
                <path d="M 0,105 Q 85,95 170,100 T 340,90 T 500,75" fill="none" stroke="#D93829" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>

          {/* Historial */}
          <div className="bg-white border border-[#E4EAE0] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#142A16]">Historial de movimientos</h3>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#738870]" />
                  <input
                    type="text"
                    placeholder="Buscar movimiento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAF6] border border-[#DEE6DA] rounded-xl text-[#1A331C] placeholder:text-[#9FB19D] focus:outline-none focus:border-[#274E2A]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="flex-1 sm:flex-initial text-xs bg-[#F8FAF6] border border-[#DEE6DA] rounded-xl px-2.5 py-1.5 text-[#1A331C] focus:outline-none"
                  >
                    <option value="">Tipo</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Gastos</option>
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="flex-1 sm:flex-initial text-xs bg-[#F8FAF6] border border-[#DEE6DA] rounded-xl px-2.5 py-1.5 text-[#1A331C] focus:outline-none"
                  >
                    <option value="">Categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#F0F4ED]">
              {filteredList.length === 0 ? (
                <p className="text-center py-10 text-xs text-[#738870]">
                  No hay movimientos para estos filtros
                </p>
              ) : (
                filteredList.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-[#F8FAF6] px-2 rounded-xl transition gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-[#EBF2E8] text-[#274E2A]'
                            : 'bg-[#FBECEB] text-[#D93829]'
                        }`}
                      >
                        {tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-[#142A16] truncate">{tx.description || tx.category_name}</p>
                        <span className="text-[10px] sm:text-[11px] text-[#738870] truncate block">
                          {tx.transaction_date} • {tx.category_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          tx.type === 'income' ? 'text-[#274E2A]' : 'text-[#142A16]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatCOP(tx.amount)}
                      </span>
                      <div className="flex items-center">
                        <button
                          onClick={() => { setSelectedTx(tx); setIsModalOpen(true); }}
                          className="p-1 text-[#8EA08C] hover:text-[#274E2A] transition"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 text-[#8EA08C] hover:text-[#D93829] transition"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        initialData={selectedTx}
      />
    </div>
  );
}