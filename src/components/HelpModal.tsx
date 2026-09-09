import { X, HelpCircle, Lightbulb, FileText, Share2, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Lightbulb className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Guía Fácil de la Aplicación</h2>
              <p className="text-xs text-blue-100">Explicación paso a paso para todo el equipo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Cerrar ventana de ayuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido didáctico */}
        <div className="p-6 space-y-5 text-slate-700 text-sm max-h-[75vh] overflow-y-auto">
          {/* ¿Para qué sirve? */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <h3 className="font-bold text-amber-900 flex items-center gap-2 text-base">
              <span>🌾</span> ¿Para qué sirve esta aplicación?
            </h3>
            <p className="text-amber-800 text-xs sm:text-sm leading-relaxed">
              Imagina que es un <strong>cuaderno digital e inteligente</strong>. Sirve para revisar que las luces y caminos de las fincas bananeras y piñeras funcionen bien durante la noche. Así, los agricultores y trabajadores pueden cosechar y trabajar con total seguridad.
            </p>
          </div>

          {/* Pasos explicados */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ¿Cómo se usa en 3 sencillos pasos?
            </h4>

            {/* Paso 1 */}
            <div className="flex gap-3.5 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Sube tus fotos o mapas de fincas</span>
                </div>
                <p className="text-slate-600">
                  Arrastra las fotos o presiona el botón para subirlas. La aplicación las guarda de forma permanente en tu dispositivo para que <strong>nunca se borren</strong> al cerrar la app.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex gap-3.5 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Escribe tus notas de inspección</span>
                </div>
                <p className="text-slate-600">
                  Debajo de cada foto hay un espacio para escribir lo que viste durante la ronda nocturna (por ejemplo: <em>"Lámparas del sector norte encendidas correctamente"</em>). Todo lo que escribes se guarda automáticamente.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex gap-3.5 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-rose-600" />
                  <span>Toca el gran botón rojo al final</span>
                </div>
                <p className="text-slate-600">
                  Presiona el botón <strong className="text-rose-700">"UNIR TODOS LOS PDF EN UN DOCUMENTO"</strong>:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-500 pl-1 space-y-0.5">
                  <li><strong>En celular o tablet:</strong> Se abrirá el menú para compartir por WhatsApp, correo o guardar en tus archivos.</li>
                  <li><strong>En computadora (PC):</strong> Se descargará de inmediato el archivo PDF listo para imprimir o enviar.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Seguridad y usuarios */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <strong className="text-slate-800">Control de Usuarios y Registro:</strong>
              <br />
              Puedes iniciar sesión o registrar a nuevos supervisores. En el menú superior puedes ver el registro de quiénes se han conectado y a qué hora.
            </div>
          </div>
        </div>

        {/* Botón de cierre */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-colors"
          >
            ¡Entendido, gracias!
          </button>
        </div>
      </div>
    </div>
  );
}
