import { useState, useRef, useCallback, useEffect } from 'react';
import { LOJAS_PROPRIAS, LOJAS_FRANQUIA } from '../utils/stores';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronDown, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { STORES } from '../context/ProfileContext';

// ─── Sanitização ─────────────────────────────────────────────────────────────
function sanitize(value) {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/['"`;]/g, '')
    .trim();
}

function generateCsrfToken() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidFullName(name) {
  return name.trim().length >= 3 && /^[a-zA-ZÀ-ÿ\s''-.]+$/.test(name) && name.trim().includes(' ');
}

function formatCPF(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCPF(cpf) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(digits[10]);
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const RATE_LIMIT = { max: 5, windowMs: 60_000 };
const attemptLog = { timestamps: [] };

function isRateLimited() {
  const now = Date.now();
  attemptLog.timestamps = attemptLog.timestamps.filter(t => now - t < RATE_LIMIT.windowMs);
  if (attemptLog.timestamps.length >= RATE_LIMIT.max) return true;
  attemptLog.timestamps.push(now);
  return false;
}

// ─── Componente principal ─────────────────────────────────────────────────────
// Lojas importadas do arquivo compartilhado

const STORE_TYPES = [
  { value: 'propria',    label: 'Loja Própria' },
  { value: 'franquia',   label: 'Franquia' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'galpao',     label: 'Galpão / CD' },
];

const ROLES_CADASTRO = [
  { value: 'aluno',     label: 'Colaborador' },
  { value: 'gestor',    label: 'Gestor / Franqueado' },
  { value: 'professor', label: 'Professor / Instrutor' },
];

export default function Register() {
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    fetch('/api/config?type=sectors')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setSectors(data); })
      .catch(() => {});
  }, []);
  const navigate = useNavigate();
  const csrfToken = useRef(generateCsrfToken());

  const [form, setForm] = useState({ email: '', username: '', cpf: '', password: '', role: '', storeType: '', storeName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');

  const [honeypot, setHoneypot] = useState('');
  const formLoadTime = useRef(Date.now());

  const { checks: pwdChecks, score: pwdScore } = checkPasswordStrength(form.password);
  const strengthLabel = ['', 'Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'][pwdScore];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'][pwdScore];

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email é obrigatório';
        if (!isValidEmail(value)) return 'Email inválido';
        return '';
      case 'username':
        if (!value.trim()) return 'Nome completo é obrigatório';
        if (!isValidFullName(value)) return 'Informe nome e sobrenome (apenas letras)';
        return '';
      case 'cpf':
        if (!value) return 'CPF é obrigatório';
        if (!isValidCPF(value)) return 'CPF inválido';
        return '';
      case 'password':
        if (!value) return 'Senha é obrigatória';
        if (value.length < 8) return 'Mínimo de 8 caracteres';
        if (pwdScore < 3) return 'Senha muito fraca — adicione maiúsculas, números ou símbolos';
        return '';
      case 'role':
        if (!value) return 'Selecione seu perfil';
        return '';
      case 'storeType':
        if (!value) return 'Selecione o tipo de unidade';
        return '';
      case 'storeName':
        return '';
      default:
        return '';
    }
  }, [pwdScore]);

  useEffect(() => {
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validateField('password', form.password) }));
    }
  }, [pwdScore, form.password, touched.password, validateField]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const maxLen = { email: 254, username: 60, cpf: 14, password: 128, role: 50, storeType: 50, storeName: 100 };

    let safeValue = value.slice(0, maxLen[name] ?? 100);
    if (name === 'cpf') safeValue = formatCPF(value);

    setForm(prev => ({ ...prev, [name]: safeValue }));

    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, safeValue) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (honeypot) return;
    if (Date.now() - formLoadTime.current < 1500) {
      setSubmitStatus('error');
      setSubmitMessage('Submissão muito rápida. Tente novamente.');
      return;
    }

    if (isRateLimited()) {
      setSubmitStatus('error');
      setSubmitMessage('Muitas tentativas. Aguarde 1 minuto e tente novamente.');
      return;
    }

    const allTouched = { email: true, username: true, cpf: true, password: true, role: true, storeType: true, storeName: true };
    setTouched(allTouched);

    const newErrors = {
      email: validateField('email', form.email),
      username: validateField('username', form.username),
      cpf: validateField('cpf', form.cpf),
      password: validateField('password', form.password),
      role: validateField('role', form.role),
      storeType: validateField('storeType', form.storeType),
      storeName: '',
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const payload = {
        email:      sanitize(form.email).toLowerCase(),
        username:   sanitize(form.username),
        cpf:        form.cpf.replace(/\D/g, ''),
        password:   form.password,
        role:       form.role,
        storeType:  form.storeType,
        storeName:  form.storeName,
        _csrf:      csrfToken.current,
      };

      const response = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       payload.username,
          email:      payload.email,
          password:   payload.password,
          role:       payload.role || 'aluno',
          unit:       payload.storeName || null,
          store_name: payload.storeName || null,
          store_type: payload.storeType || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Não foi possível criar a conta.');
        return;
      }

      setSubmitStatus('success');
      setSubmitMessage('Cadastro enviado! Aguarde a aprovação do administrador. Você receberá um email em breve.');
      csrfToken.current = generateCsrfToken();
      setTimeout(() => navigate('/login'), 4000);
    } catch {
      setSubmitStatus('error');
      setSubmitMessage('Não foi possível criar a conta. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-6 py-3 border rounded-full text-sm focus:outline-none transition-colors ${
      touched[field] && errors[field]
        ? 'border-red-400 bg-red-50/30 focus:border-red-400'
        : touched[field] && !errors[field]
        ? 'border-green-400 bg-green-50/20 focus:border-green-500'
        : 'border-slate-200 focus:border-[#6385B7]'
    }`;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 lg:p-20">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center bg-white rounded-[40px] overflow-hidden p-4 lg:p-0">

        {/* LADO ESQUERDO: IMAGEM */}
        <div className="relative h-[600px] hidden lg:block m-6">
          <img src="/luiz.jpeg" alt="Biscoitê Experience" className="w-full h-full object-cover rounded-[32px]" />
          <div className="absolute inset-0 bg-black/20 rounded-[32px]" />
          <div className="absolute bottom-12 left-10 right-10 text-white">
            <h2 className="text-4xl font-black mb-4 leading-tight">Junte-se a nós nesta jornada deliciosa</h2>
            <p className="text-sm font-medium opacity-90">Com momentos inesquecíveis e presentes que deixam uma impressão duradoura.</p>
          </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <div className="lg:pr-20 py-10 overflow-y-auto max-h-screen">
          <div className="flex flex-col items-center lg:items-start">
            <img src="/logo-biscoite.svg" alt="Logo" className="h-12 mb-8" />

            {/* TOGGLE */}
            <div className="bg-[#B8C6DA] p-1 rounded-full flex gap-1 mb-8 w-64">
              <Link to="/login" className="flex-1 py-2 text-center text-sm font-bold text-slate-600 rounded-full">Login</Link>
              <button type="button" className="flex-1 py-2 text-center text-sm font-bold text-white bg-[#6385B7] rounded-full shadow-md">Registrar</button>
            </div>

            {/* STATUS GLOBAL */}
            {submitStatus === 'success' && (
              <div className="w-full mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-2xl">
                <CheckCircle size={16} className="shrink-0" />
                {submitMessage}
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="w-full mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl">
                <AlertCircle size={16} className="shrink-0" />
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate autoComplete="off">
              <input type="hidden" name="_csrf" value={csrfToken.current} readOnly />

              {/* Honeypot */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
              </div>

              {/* NOME COMPLETO */}
              <div>
                <label className="block text-xs font-black text-[#001A26] mb-2">Nome completo</label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    autoComplete="name"
                    placeholder="ex: Matheus Carvalho"
                    value={form.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={60}
                    className={inputClass('username')}
                    aria-invalid={!!(touched.username && errors.username)}
                  />
                  {touched.username && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {errors.username ? <XCircle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-green-500" />}
                    </span>
                  )}
                </div>
                {touched.username && errors.username && (
                  <p className="mt-1 text-xs text-red-500 px-3" role="alert">{errors.username}</p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-black text-[#001A26] mb-2">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={254}
                    className={inputClass('email')}
                    aria-invalid={!!(touched.email && errors.email)}
                  />
                  {touched.email && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {errors.email ? <XCircle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-green-500" />}
                    </span>
                  )}
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-500 px-3" role="alert">{errors.email}</p>
                )}
              </div>

              {/* CPF */}
              <div>
                <label className="block text-xs font-black text-[#001A26] mb-2">CPF</label>
                <div className="relative">
                  <input
                    type="text"
                    name="cpf"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={14}
                    inputMode="numeric"
                    className={inputClass('cpf')}
                    aria-invalid={!!(touched.cpf && errors.cpf)}
                  />
                  {touched.cpf && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {errors.cpf ? <XCircle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-green-500" />}
                    </span>
                  )}
                </div>
                {touched.cpf && errors.cpf && (
                  <p className="mt-1 text-xs text-red-500 px-3" role="alert">{errors.cpf}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-black text-[#001A26] mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={128}
                    className={`${inputClass('password')} pr-10`}
                    aria-invalid={!!(touched.password && errors.password)}
                    aria-describedby="password-strength"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                {form.password.length > 0 && (
                  <div id="password-strength" className="mt-2 px-1">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwdScore ? strengthColor : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Força: <span className="font-bold">{strengthLabel}</span>
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[
                        [pwdChecks.length, '8+ caracteres'],
                        [pwdChecks.uppercase, 'Maiúscula'],
                        [pwdChecks.lowercase, 'Minúscula'],
                        [pwdChecks.number, 'Número'],
                        [pwdChecks.special, 'Símbolo (!@#...)'],
                      ].map(([ok, label]) => (
                        <span key={label} className={`text-[10px] flex items-center gap-1 ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                          {ok ? '✓' : '○'} {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-500 px-3" role="alert">{errors.password}</p>
                )}
              </div>

              {/* PERFIL */}
              <div>
                <label className="block text-xs font-black text-[#001A26] mb-2">Meu perfil</label>
                <div className="relative">
                  <select name="role" value={form.role} onChange={handleChange} onBlur={handleBlur}
                    className={`${inputClass('role')} appearance-none`}>
                    <option value="">Selecione seu perfil</option>
                    {ROLES_CADASTRO.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-6 bottom-3.5 text-slate-400 pointer-events-none" />
                </div>
                {touched.role && errors.role && (
                  <p className="mt-1 text-xs text-red-500 px-3" role="alert">{errors.role}</p>
                )}
              </div>

              {/* TIPO DE UNIDADE */}
              <div>
                <label className="block text-xs font-black text-[#001A26] mb-2">Tipo de unidade</label>
                <div className="relative">
                  <select name="storeType" value={form.storeType} onChange={handleChange} onBlur={handleBlur}
                    className={`${inputClass('storeType')} appearance-none`}>
                    <option value="">Selecione o tipo</option>
                    {STORE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-6 bottom-3.5 text-slate-400 pointer-events-none" />
                </div>
                {touched.storeType && errors.storeType && (
                  <p className="mt-1 text-xs text-red-500 px-3" role="alert">{errors.storeType}</p>
                )}
              </div>

              {/* LOJA — filtra por tipo */}
              {(form.storeType === 'propria' || form.storeType === 'franquia') && (
                <div>
                  <label className="block text-xs font-black text-[#001A26] mb-2">
                    {form.storeType === 'propria' ? 'Loja Própria' : 'Franquia'}
                  </label>
                  <div className="relative">
                    <select name="storeName" value={form.storeName} onChange={handleChange}
                      className={`${inputClass('storeName')} appearance-none`}>
                      <option value="">Selecione a loja</option>
                      {(form.storeType === 'propria' ? LOJAS_PROPRIAS : LOJAS_FRANQUIA).map(loja => (
                        <option key={loja} value={loja}>{loja}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-6 bottom-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Escritório / Galpão — dropdown de setor do banco */}
              {(form.storeType === 'escritorio' || form.storeType === 'galpao') && (
                <div>
                  <label className="block text-xs font-black text-[#001A26] mb-2">Setor / Área</label>
                  <div className="relative">
                    <select name="storeName" value={form.storeName} onChange={handleChange}
                      className={`${inputClass('storeName')} appearance-none`}>
                      <option value="">Selecione o setor</option>
                      {sectors.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-6 bottom-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* TERMOS */}
              <div className="flex items-start gap-2 px-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-0.5 rounded border-slate-300 text-[#6385B7] cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 font-medium leading-relaxed cursor-pointer">
                  Li e concordo com os{' '}
                  <a href="#" className="text-[#6385B7] underline hover:text-[#4A72B2]">Termos de Uso</a>{' '}
                  e a{' '}
                  <a href="#" className="text-[#6385B7] underline hover:text-[#4A72B2]">Política de Privacidade</a>
                </label>
              </div>

              {/* BOTÃO */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className="px-12 py-3 bg-[#6385B7] text-white font-bold rounded-full shadow-lg hover:bg-[#4A72B2] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Criando conta...' : 'Registrar-se'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
