import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) {
          throw new Error('Por favor ingresa tu nombre completo');
        }
        await register(formData.name, formData.email, formData.password);
      }
      navigate('/movimientos');
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.detail) {
          setError(errorData.detail);
        } else if (errorData.email) {
          setError(`Email: ${errorData.email[0]}`);
        } else if (errorData.password) {
          setError(`Contraseña: ${errorData.password[0]}`);
        } else {
          setError('Credenciales inválidas o datos incorrectos');
        }
      } else {
        setError(err.message || 'Error de conexión con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="pointer-events-none absolute left-12 top-12 size-72 rounded-full bg-secondary/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 right-12 size-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="z-10 w-full max-w-[25rem]">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex size-12 items-center justify-center rounded-[0.45rem] bg-primary-dark text-primary-foreground shadow-xs">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-heading">Balance</h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Control simple, claro y sereno de tus finanzas
          </p>
        </div>

        <div className="rounded-[0.45rem] border border-border bg-card p-6 shadow-[0_2px_8px_oklch(30%_0.02_120_/_0.035)] sm:p-7">
          <div className="mb-5 flex rounded-[0.4rem] border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 rounded-[0.35rem] py-1.5 text-xs font-semibold transition ${
                isLogin
                  ? 'bg-white text-primary-dark shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 rounded-[0.35rem] py-1.5 text-xs font-semibold transition ${
                !isLogin
                  ? 'bg-white text-primary-dark shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-[0.4rem] border border-expense/20 bg-expense/10 p-3 text-xs font-medium text-expense">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold text-muted-foreground">
                  Nombre completo
                </label>
                <div className="relative">
                  <UserIcon
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    name="name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Laura Álvarez"
                    className="w-full rounded-[0.4rem] border border-border bg-background py-2.5 pl-9 pr-3.5 text-xs font-medium text-foreground placeholder:text-muted-foreground transition focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold text-muted-foreground">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="laura@ejemplo.com"
                  className="w-full rounded-[0.4rem] border border-border bg-background py-2.5 pl-9 pr-3.5 text-xs font-medium text-foreground placeholder:text-muted-foreground transition focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold text-muted-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-[0.4rem] border border-border bg-background py-2.5 pl-9 pr-10 text-xs font-medium text-foreground placeholder:text-muted-foreground transition focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[0.4rem] bg-primary-dark py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-heading disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <span>{isLogin ? 'Ingresar a mi cuenta' : 'Registrarme'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-[0.68rem] text-muted-foreground">
            <ShieldCheck size={14} className="text-primary-dark" />
            <span>Tus datos financieros viajan encriptados de extremo a extremo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
