import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import { useProfile } from '../context/ProfileContext';

export default function InactivityGuard({ children, timeoutMinutes = 15 }) {
  const navigate = useNavigate();
  const { setSystemRole } = useProfile();
  const { showWarning, countdown, resetTimer, registerLogout } = useInactivityTimer(timeoutMinutes);

  useEffect(() => {
    registerLogout(() => {
      setSystemRole('aluno');
      navigate('/login');
    });
  }, []);

  const pct = Math.round((countdown / 60) * 100);
  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <>
      {children}

      {showWarning && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-8 space-y-6 text-center">

            {/* Ícone + countdown circular */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-20 h-20">
                <svg width="80" height="80" className="-rotate-90">
                  <circle cx="40" cy="40" r="22" fill="none" stroke="#e2eef9" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="22" fill="none"
                    stroke={countdown <= 10 ? '#ef4444' : '#4A72B2'}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-black ${countdown <= 10 ? 'text-red-500' : 'text-[#001A26]'}`}>
                    {countdown}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-500" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#001A26]">Você ainda está aí?</h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Ficamos sem atividade por <strong>{15} minutos</strong>.<br />
                Você será deslogado em <strong className={countdown <= 10 ? 'text-red-500' : 'text-[#4A72B2]'}>{countdown} segundo{countdown !== 1 ? 's' : ''}</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={resetTimer}
                className="w-full py-3.5 bg-[#001A26] hover:bg-[#4A72B2] text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={16} /> Continuar sessão
              </button>
              <button
                onClick={() => { setSystemRole('aluno'); navigate('/login'); }}
                className="w-full py-3.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Sair agora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
