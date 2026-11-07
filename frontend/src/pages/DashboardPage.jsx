import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
            F
          </div>
          <span className="font-semibold text-lg tracking-tight">FinanceTracker</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 text-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 mt-8">
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <h2 className="text-2xl font-bold mb-2">
            ¡Hola, <span className="text-emerald-400">{user?.name}</span>! 👋
          </h2>
          <p className="text-slate-400 mb-6">
            Sesión iniciada con éxito. Ya estás autenticado y listo para registrar transacciones y presupuestos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <User className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Correo Electrónico</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}