import { Link, useInRouterContext } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
  ReceiptText,
  PiggyBank,
  Target,
  Settings,
  ChevronDown,
  X,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, activeItem = 'Movimientos' }) {
  const hasRouter = useInRouterContext();
  const menuItems = [
    { name: 'Resumen', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Movimientos', icon: ReceiptText, href: '/movimientos' },
    { name: 'Presupuestos', icon: PiggyBank, badge: '2' },
    { name: 'Metas', icon: Target },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex h-screen w-60 shrink-0 select-none flex-col justify-between border-r border-border bg-card p-5 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex min-h-0 flex-col">
          <div className="mb-6 flex h-11 shrink-0 items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-[0.45rem] bg-primary-dark text-primary-foreground shadow-xs">
                <TrendingUp size={18} strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-heading">
                Balance
              </span>
            </div>

            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-[0.4rem] text-muted-foreground transition hover:bg-secondary hover:text-primary-dark lg:hidden"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mb-2.5 mt-8 px-2.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Menú principal
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.name === activeItem;
              const itemClassName = `flex w-full items-center justify-between gap-3 rounded-[0.4rem] px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-secondary font-bold text-primary-dark'
                  : 'font-medium text-muted-foreground hover:bg-muted hover:text-primary-dark'
              }`;
              const content = (
                <>
                  <span className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.name}</span>
                  </span>
                  {item.badge && (
                    <span className="rounded-full bg-expense px-1.5 py-px text-[0.65rem] font-bold text-primary-foreground">
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

        <div className="shrink-0 space-y-3 border-t border-border pt-4">
          <div className="rounded-[0.45rem] border border-primary/40 bg-secondary p-[0.9rem] text-xs text-primary-dark">
            <div className="flex items-center gap-2">
              <span className="grid size-[1.65rem] place-items-center rounded-[0.35rem] bg-primary text-primary-foreground">
                <TrendingUp size={15} />
              </span>
              <strong className="text-[0.75rem]">Salud financiera</strong>
            </div>
            <div className="mt-3 flex justify-between text-muted-foreground">
              <span>Muy buena</span>
              <b className="text-primary-dark">82/100</b>
            </div>
            <div className="mt-1 h-[0.3rem] overflow-hidden rounded-full bg-card">
              <span className="block h-full w-[82%] rounded-full bg-positive" />
            </div>
          </div>

          <button className="flex w-full items-center gap-3 rounded-[0.4rem] px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-primary-dark">
            <Settings size={17} />
            <span>Configuración</span>
          </button>

          <div className="flex cursor-pointer items-center gap-2.5 rounded-[0.4rem] border-t border-border px-1 pt-4 transition">
            <div className="grid size-[2.15rem] place-items-center rounded-full bg-primary text-[0.72rem] font-bold text-primary-foreground">
              LA
            </div>
            <div className="text-left">
              <p className="text-[0.8rem] font-semibold leading-none text-foreground">Laura A.</p>
              <p className="mt-1 text-[0.68rem] text-muted-foreground">Cuenta personal</p>
            </div>
            <ChevronDown size={15} className="ml-auto text-muted-foreground" />
          </div>
        </div>
      </aside>
    </>
  );
}
