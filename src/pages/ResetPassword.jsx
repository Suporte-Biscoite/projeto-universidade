import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();
  const token                     = searchParams.get('token');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [status, setStatus]       = useState(null);
  const [message, setMessage]     = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-bold">Link inválido ou expirado.</p>
          <Link to="/recuperar-senha" className="text-[#6385B7] hover:underline text-sm">Solicitar novo link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setStatus('error'); setMessage('As senhas não coincidem.'); return; }
    if (password.length < 8)  { setStatus('error'); setMessage('Senha deve ter no mínimo 8 caracteres.'); return; }

    setStatus('loading');
    try {
      const res = await fetch('/api/forgot-password?action=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error); return; }
      setStatus('success');
      setMessage('Senha redefinida com sucesso!');
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-2">
      <div className="hidden lg:block relative rounded-[32px] m-6 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800" className="w-full h-full object-cover rounded-[32px]" alt="" />
        <div className="absolute inset-0 bg-black/20 rounded-[32px]" />
        <div className="absolute bottom-12 left-10 right-10 text-white">
          <h2 className="text-4xl font-black mb-4">Nova senha</h2>
          <p className="text-sm opacity-90">Escolha uma senha forte para proteger sua conta.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 lg:pr-20 py-10">
        <div className="w-full max-w-sm">
          <img src="/logo-biscoite.svg" alt="Logo Biscoitê" className="h-20 mb-8" />
          <h1 className="text-2xl font-black text-[#001A26] mb-2">Redefinir senha</h1>
          <p className="text-sm text-slate-500 mb-8">Digite sua nova senha abaixo.</p>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <p className="font-bold text-[#001A26]">{message}</p>
              <p className="text-sm text-slate-500">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                  <AlertCircle size={16} className="shrink-0" /><span>{message}</span>
                </div>
              )}
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Nova senha (mín. 8 caracteres)" required minLength={8}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-[#6385B7]" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPwd ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirmar nova senha" required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-[#6385B7]" />
              </div>
              <button type="submit" disabled={status === 'loading'}
                className="w-full py-3 bg-[#6385B7] hover:bg-[#001A26] text-white font-bold rounded-full text-sm transition-colors disabled:opacity-50">
                {status === 'loading' ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
