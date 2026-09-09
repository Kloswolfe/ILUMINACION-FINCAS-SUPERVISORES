import { useState, type FormEvent } from 'react';
import { Supervisor, CropCategory } from '../types';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AddSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supervisor: Supervisor) => void;
}

export function AddSupervisorModal({
  isOpen,
  onClose,
  onSave,
}: AddSupervisorModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CropCategory>('Fincas de Banano');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor ingresa el nombre completo del supervisor.');
      return;
    }

    const code = employeeCode.trim() || `DOL-SUP-${Math.floor(1000 + Math.random() * 9000)}`;
    const userEmail = email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@dole.com`;

    const newSupervisor: Supervisor = {
      id: `sup-${Date.now()}`,
      name: name.trim(),
      category,
      employeeCode: code,
      email: userEmail,
      phone: phone.trim() || undefined,
      createdAt: Date.now(),
    };

    onSave(newSupervisor);
    setName('');
    setEmployeeCode('');
    setEmail('');
    setPhone('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-supervisor-title"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-supervisor-title" className="font-bold text-base text-slate-900 leading-tight">
                Añadir Nuevo Supervisor DOLE
              </h3>
              <p className="text-xs text-slate-500">
                El registro se guardará permanentemente en el sistema.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal de añadir supervisor"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre Completo del Supervisor *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej: Ing. Manuel Zepeda"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-[#003865] focus:ring-2 focus:ring-[#003865]/20 text-sm outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Categoría de Fincas Asignadas *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategory('Fincas de Banano')}
                className={`py-3 px-3.5 rounded-lg border text-left text-xs font-semibold transition-all flex flex-col justify-between ${
                  category === 'Fincas de Banano'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                  División Bananera
                </span>
                <span>Fincas de Banano</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Fincas de Piñas y banano')}
                className={`py-3 px-3.5 rounded-lg border text-left text-xs font-semibold transition-all flex flex-col justify-between ${
                  category === 'Fincas de Piñas y banano'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                  División Mixta
                </span>
                <span>Fincas de Piñas y Banano</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Código de Empleado DOLE
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Ej: DOL-SUP-0250"
                className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs outline-none transition-all placeholder:text-slate-400 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Opcional (se autogenera si vacío)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Teléfono / Radio de Contacto
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: +504 9876-5432"
                className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico Corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: mzepeda@dole.com"
              className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-white" />
              Guardar Supervisor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
