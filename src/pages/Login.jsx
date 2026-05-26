import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

// ─── Constantes de segurança ────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;   // janela de 10 min para contar tentativas
const MIN_SUBMIT_DELAY_MS = 300;             // evita bots que submetem instantaneamente

// ─── Helpers de sanitização ─────────────────────────────────────────────────
function sanitizeInput(value) {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ─── Gerenciador de tentativas (localStorage com expiração) ─────────────────
const AttemptsManager = {
  key: 'biscoite_login_attempts',

  getState() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { count: 0, lockedUntil: null, timestamps: [] };
      return JSON.parse(raw);
    } catch {
      return { count: 0, lockedUntil: null, timestamps: [] };
    }
  },

  saveState(state) {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch { /* storage indisponível */ }
  },

  isLocked() {
    const state = this.getState();
    if (!state.lockedUntil) return false;
    if (Date.now() < state.lockedUntil) return state.lockedUntil;
    this.clear();
    return false;
  },

  register() {
    const state = this.getState();
    const now = Date.now();
    const recent = (state.timestamps || []).filter(t => now - t < ATTEMPT_WINDOW_MS);
    recent.push(now);
    const count = recent.length;
    const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null;
    this.saveState({ count, lockedUntil, timestamps: recent });
    return { count, lockedUntil };
  },

  clear() {
    localStorage.removeItem(this.key);
  },
};

// ─── Componente principal ────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  const submitTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    submitTimeRef.current = Date.now();
    const locked = AttemptsManager.isLocked();
    if (locked) startLockoutTimer(locked);
    return () => clearInterval(timerRef.current);
  }, []);

  function startLockoutTimer(lockedUntil) {
    clearInterval(timerRef.current);
    const update = () => {
      const remaining = Math.max(0, lockedUntil - Date.now());
      setLockoutRemaining(remaining);
      if (remaining === 0) clearInterval(timerRef.current);
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }

  const validate = useCallback(() => {
    const errs = {};
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errs.email = 'Email é obrigatório.';
    } else if (!isValidEmail(cleanEmail)) {
      errs.email = 'Formato de email inválido.';
    }
    if (!password) {
      errs.password = 'Senha é obrigatória.';
    } else if (password.length < 8) {
      errs.password = 'A senha deve ter pelo menos 8 caracteres.';
    }
    return errs;
  }, [email, password]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const locked = AttemptsManager.isLocked();
    if (locked) {
      startLockoutTimer(locked);
      setFormError('Conta temporariamente bloqueada por tentativas excessivas.');
      return;
    }

    const elapsed = Date.now() - (submitTimeRef.current || 0);
    if (elapsed < MIN_SUBMIT_DELAY_MS) {
      setFormError('Ação bloqueada. Tente novamente.');
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const safeEmail = sanitizeInput(email.trim().toLowerCase());

    setIsLoading(true);

    try {
      // ── PONTO DE INTEGRAÇÃO COM BACKEND ─────────────────────────────────
      // Substitua este bloco pela chamada real à sua API:
      //
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-CSRF-Token': getCsrfToken(),
      //   },
      //   credentials: 'include',                  // cookies HttpOnly
      //   body: JSON.stringify({ email: safeEmail, password }),
      // });
      //
      // if (!response.ok) throw new Error('Credenciais inválidas');
      // const { token, user } = await response.json();
      // ────────────────────────────────────────────────────────────────────

      // SIMULAÇÃO (remover em produção):
      await new Promise(r => setTimeout(r, 900));
      const MOCK_SUCCESS = safeEmail === 'admin@biscoite.com' && password === 'Biscoite@2025';

      if (!MOCK_SUCCESS) {
        const { count, lockedUntil } = AttemptsManager.register();
        const remaining = MAX_ATTEMPTS - count;

        if (lockedUntil) {
          startLockoutTimer(lockedUntil);
          setFormError('Muitas tentativas. Conta bloqueada por 15 minutos.');
        } else {
          setFormError(
            `Email ou senha incorretos.${remaining > 0 ? ` ${remaining} tentativa(s) restante(s).` : ''}`
          );
        }
        return;
      }

      AttemptsManager.clear();

      if (rememberMe) {
        sessionStorage.setItem('biscoite_remember', '1');
      }

      setSuccessMsg('Login realizado com sucesso! Redirecionando…');
      setTimeout(() => navigate('/'), 800);

    } catch (err) {
      setFormError('Erro de conexão. Verifique sua rede e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, rememberMe, validate, navigate]);

  const formatLockout = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLocked = lockoutRemaining > 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 lg:p-20">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center bg-white rounded-[40px] overflow-hidden p-4 lg:p-0">

        {/* ── LADO ESQUERDO: IMAGEM ── */}
        <div className="relative h-[600px] hidden lg:block m-6">
          <img
            src="/luiz.jpeg"
            alt="Biscoitê Experience"
            className="w-full h-full object-cover rounded-[32px]"
          />
          <div className="absolute inset-0 bg-black/20 rounded-[32px]" />
          <div className="absolute bottom-12 left-10 right-10 text-white">
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Bem-vindo de volta!
            </h2>
            <p className="text-sm font-medium opacity-90">
              Pronto para continuar sua jornada de aprendizado na Biscoitê Academy?
            </p>
          </div>
        </div>

        {/* ── LADO DIREITO: FORMULÁRIO ── */}
        <div className="lg:pr-20 py-10">
          <div className="flex flex-col items-center lg:items-start">
            <img src="/logo-biscoite.svg" alt="Logo Biscoitê" className="h-20 mb-8" />

            {/* Toggle Login / Registrar */}
            <div className="bg-[#B8C6DA] p-1 rounded-full flex gap-1 mb-10 w-64">
              <button
                type="button"
                className="flex-1 py-2 text-center text-sm font-bold text-white bg-[#6385B7] rounded-full shadow-md"
                aria-current="page"
              >
                Login
              </button>
              <Link
                to="/registrar"
                className="flex-1 py-2 text-center text-sm font-bold text-slate-600 rounded-full hover:text-[#6385B7] transition-colors"
              >
                Registrar
              </Link>
            </div>

            {/* Lockout */}
            {isLocked && (
              <div
                role="alert"
                className="w-full mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Acesso temporariamente bloqueado</p>
                  <p className="text-xs mt-0.5">
                    Tente novamente em <span className="font-mono font-bold">{formatLockout(lockoutRemaining)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Erro geral */}
            {formError && !isLocked && (
              <div
                role="alert"
                className="w-full mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Sucesso */}
            {successMsg && (
              <div
                role="status"
                className="w-full mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm"
              >
                <ShieldCheck size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORMULÁRIO */}
            <form
              className="w-full space-y-6"
              onSubmit={handleSubmit}
              noValidate
              autoComplete="on"
            >
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-black text-[#001A26] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Seu email cadastrado"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  disabled={isLocked || isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full px-6 py-4 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#6385B7]/30 bg-slate-50/30 transition-colors
                    ${errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#6385B7]'}
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-red-500 text-xs mt-1.5 ml-2">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-xs font-black text-[#001A26]">
                    Senha
                  </label>
                  <Link to="/recuperar-senha" className="text-[10px] font-bold text-[#6385B7] hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    disabled={isLocked || isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    maxLength={128}
                    className={`w-full px-6 py-4 pr-12 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#6385B7]/30 bg-slate-50/30 transition-colors
                      ${errors.password ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#6385B7]'}
                      ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-red-500 text-xs mt-1.5 ml-2">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Lembrar de mim */}
              <div className="flex items-center gap-2 px-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isLocked || isLoading}
                  className="rounded border-slate-300 text-[#6385B7] focus:ring-[#6385B7]"
                />
                <label htmlFor="remember" className="text-xs text-slate-500 font-medium select-none">
                  Lembrar de mim
                </label>
              </div>

              {/* Botão */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLocked || isLoading}
                  className={`flex items-center gap-2 px-12 py-4 rounded-full font-bold text-sm shadow-lg transition-all
                    ${isLocked || isLoading
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-[#6385B7] text-white hover:bg-[#4A72B2] hover:shadow-xl active:scale-95'
                    }
                  `}
                >
                  {isLoading && <Loader2 size={15} className="animate-spin" />}
                  {isLoading ? 'Entrando…' : 'Entrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}