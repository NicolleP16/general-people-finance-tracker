import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-[#F8FAF6] text-[#1A331C] flex items-center justify-center p-4 relative font-sans antialiased">
      {/* Círculos ambientales sutiles acordes a la paleta verde */}
      <div className="absolute top-12 left-12 w-72 h-72 bg-[#E3EBDD]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-[#EDF4E8]/80 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        {/* Isotipo y Título de Marca idéntico al Sidebar */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#274E2A] text-white shadow-xs mb-3">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[#142A16]">
            Balance
          </h1>
          <p className="text-xs text-[#556F53] mt-1 font-medium">
            Control simple, claro y sereno de tus finanzas
          </p>
        </div>

        {/* Tarjeta Principal en blanco con bordes cálidos */}
        <div className="bg-white rounded-3xl border border-[#E4EAE0] p-6 sm:p-7 shadow-2xs">
          
          {/* Selector Login / Registro (mismo estilo que modal de gastos/ingresos) */}
          <div className="flex p-1 bg-[#F1F4EE] rounded-xl border border-[#E4EAE0] mb-5">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                isLogin
                  ? 'bg-white text-[#1E3B20] shadow-xs'
                  : 'text-[#62775E] hover:text-[#1A331C]'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                !isLogin
                  ? 'bg-white text-[#1E3B20] shadow-xs'
                  : 'text-[#62775E] hover:text-[#1A331C]'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Alerta de Error (usando el rojo institucional de gastos #D93829) */}
          {error && (
            <div className="mb-4 p-3 bg-[#FBECEB] border border-[#F5D5D3] rounded-xl flex items-center gap-2.5 text-[#D93829] text-xs font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-semibold text-[#556F53] mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <UserIcon size={15} className="text-[#738870] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Laura Álvarez"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FBFDFB] border border-[#DEE6DA] rounded-xl text-xs font-medium text-[#1A331C] placeholder:text-[#9FB19D] focus:outline-none focus:border-[#274E2A] focus:ring-1 focus:ring-[#274E2A] transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#556F53] mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={15} className="text-[#738870] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="laura@ejemplo.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#FBFDFB] border border-[#DEE6DA] rounded-xl text-xs font-medium text-[#1A331C] placeholder:text-[#9FB19D] focus:outline-none focus:border-[#274E2A] focus:ring-1 focus:ring-[#274E2A] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#556F53] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={15} className="text-[#738870] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#FBFDFB] border border-[#DEE6DA] rounded-xl text-xs font-medium text-[#1A331C] placeholder:text-[#9FB19D] focus:outline-none focus:border-[#274E2A] focus:ring-1 focus:ring-[#274E2A] transition"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#738870] hover:text-[#1A331C] transition"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#274E2A] hover:bg-[#1E3F21] text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Ingresar a mi cuenta' : 'Registrarme'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Insignia inferior */}
          <div className="mt-6 pt-4 border-t border-[#E6ECE2] flex items-center justify-center gap-1.5 text-[11px] text-[#738870]">
            <ShieldCheck size={14} className="text-[#274E2A]" />
            <span>Tus datos financieros viajan encriptados de extremo a extremo</span>
          </div>
        </div>
      </div>
    </div>
  );
}