import { Link, useInRouterContext } from 'react-router-dom';
import { 
  TrendingUp, LayoutGrid, ReceiptText, PiggyBank, Target, 
  Settings, ChevronDown, X 
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, activeItem = 'Movimientos' }) {
  const hasRouter = useInRouterContext();
  const menuItems = [
    { name: 'Resumen', icon: LayoutGrid, href: '/dashboard' },
    { name: 'Movimientos', icon: ReceiptText, href: '/movimientos' },
    { name: 'Presupuestos', icon: PiggyBank, badge: '2' },
    { name: 'Metas', icon: Target },
  ];

  return (
    <>
      {/* Fondo oscuro en móvil */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar 100% FIJO (inmóvil frente a cualquier scroll) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-screen bg-[#F8FAF6] border-r border-[#E6ECE2] flex flex-col justify-between p-5 select-none transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl z-50' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sección Superior */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 mb-6 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#274E2A] flex items-center justify-center text-white shadow-xs">
                <TrendingUp size={18} strokeWidth={2.5} />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#1A331C]">Balance</span>
            </div>
            
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 text-[#738870] hover:bg-[#EEF4E9] rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-[10px] font-semibold tracking-wider text-[#738870] uppercase px-3 mb-2">
            Menú Principal
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.name === activeItem;
              const itemClassName = `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-[#E3EBDD] text-[#1E3B20] font-semibold shadow-2xs'
                  : 'text-[#4F644D] hover:bg-[#EEF4E9]'
              }`;
              const content = (
                <>
                  <div className="flex items-center gap-3">
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-[#E05244] text-white text-[10px] flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </>
              );

              if (item.href) {
                const linkProps = {
                  'aria-current': isActive ? 'page' : undefined,
                  className: itemClassName,
                };

                return hasRouter ? (
                  <Link key={item.name} to={item.href} {...linkProps}>
                    {content}
                  </Link>
                ) : (
                  <a key={item.name} href={item.href} {...linkProps}>
                    {content}
                  </a>
                );
              }

              return (
                <button key={item.name} className={itemClassName}>
                  {content}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sección Inferior Inmóvil */}
        <div className="space-y-3 pt-4 border-t border-[#E6ECE2] shrink-0">
          <div className="bg-[#EDF4E8] border border-[#DEE9D7] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-md bg-[#274E2A] text-white flex items-center justify-center">
                  <TrendingUp size={10} />
                </div>
                <span className="text-[11px] font-semibold text-[#1E3B20]">Salud financiera</span>
              </div>
              <span className="text-[11px] font-bold text-[#1E3B20]">82/100</span>
            </div>
            <div className="w-full bg-[#D5E4CE] h-1.5 rounded-full overflow-hidden mb-1">
              <div className="bg-[#274E2A] h-full w-[82%] rounded-full" />
            </div>
            <span className="text-[9px] font-medium text-[#556F53]">Muy buena</span>
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-1.5 text-xs font-medium text-[#4F644D] hover:bg-[#EEF4E9] rounded-xl transition">
            <Settings size={15} />
            <span>Configuración</span>
          </button>

          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EEF4E9] cursor-pointer transition">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#274E2A] text-[#F3F7F1] flex items-center justify-center text-xs font-bold">
                LA
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#1A331C] leading-none">Laura A.</p>
                <p className="text-[10px] text-[#738870] mt-0.5">Cuenta personal</p>
              </div>
            </div>
            <ChevronDown size={14} className="text-[#738870]" />
          </div>
        </div>
      </aside>
    </>
  );
}