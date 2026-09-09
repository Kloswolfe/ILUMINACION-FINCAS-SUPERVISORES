import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Database, 
  LogIn, 
  CheckCircle2,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import { AppUser } from '../types';
import { SYSTEM_AUTH_PASSWORD, INITIAL_USERS } from '../services/storage';

interface LoginModuleProps {
  onLoginSuccess: (user: AppUser) => void;
  storedMapsCount?: number;
}

export function LoginModule({ onLoginSuccess, storedMapsCount = 0 }: LoginModuleProps) {
  const users = INITIAL_USERS;
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultUser = users[0];

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanInput = password.trim();

    if (!cleanInput) {
      setError('Por favor escriba la contraseña para acceder al sistema.');
      return;
    }

    if (cleanInput !== SYSTEM_AUTH_PASSWORD) {
      setError('Contraseña incorrecta. Verifique sus credenciales e intente de nuevo.');
      return;
    }

    setIsSubmitting(true);

    // Acceso permitido con contraseña 15926
    setTimeout(() => {
      onLoginSuccess(defaultUser);
      setIsSubmitting(false);
    }, 250);
  };

  const handleKeypadPress = (digit: string) => {
    setError(null);
    if (digit === 'DEL') {
      setPassword((prev) => prev.slice(0, -1));
    } else if (digit === 'CLEAR') {
      setPassword('');
    } else {
      if (password.length < 10) {
        setPassword((prev) => prev + digit);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Contenedor central */}
      <div className="w-full max-w-md">
        {/* Cabecera con bombillo amarillo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 shadow-lg ring-4 ring-amber-400/20 mb-3">
            <Lightbulb className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
            CONTROL DE ILUMINACION PARA FINCAS GESTION DE SUPERVISORES
          </h1>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 p-5 sm:p-7 space-y-5">
          {/* Formulario de autenticación */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="system-password-input" 
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Contraseña de Acceso:
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="system-password-input"
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Escriba la contraseña..."
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm font-semibold tracking-wider transition-all focus:outline-none focus:ring-2 ${
                    error 
                      ? 'border-red-400 bg-red-50/50 focus:ring-red-500/20 text-red-900' 
                      : 'border-slate-300 bg-slate-50 focus:bg-white focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Mensaje de error si la clave es incorrecta */}
              {error && (
                <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Teclado numérico táctil rápido para uso en celulares y tablets en campo */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold text-center mb-1.5 uppercase">
                Teclado Numérico Rápido:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="py-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 active:bg-slate-200 font-bold text-sm shadow-2xs transition-colors cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="py-2 rounded-lg bg-slate-200/80 text-slate-600 hover:bg-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  title="Borrar todo"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 active:bg-slate-200 font-bold text-sm shadow-2xs transition-colors cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('DEL')}
                  className="py-2 rounded-lg bg-slate-200/80 text-slate-600 hover:bg-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  title="Borrar último dígito"
                >
                  ← Borrar
                </button>
              </div>
            </div>

            {/* Botón de Ingreso */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando acceso...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Garantías del sistema: Almacenamiento persistente & Limpieza de notas para nueva jornada */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-start gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Almacenamiento Permanente:</strong> Los mapas y fincas subidas quedan guardados y <u>no se borran</u> al salir del sistema.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Reinicio de Diálogo:</strong> Las notas de inspección se limpian automáticamente al ingresar/salir para tener la aplicación siempre lista para nueva información.
              </span>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p className="text-[11px] text-slate-500">Versión 2.5 • Acceso Seguro Protegido</p>
        </div>
      </div>
    </div>
  );
}
