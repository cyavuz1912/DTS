import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  LogIn,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials } = useWarehouse();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginWithCredentials(identifier, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle Ambient Background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Centered Corporate Login Box */}
      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mx-auto mb-3">
              <i className="fa-solid fa-boxes-stacked text-xl"></i>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Depo<span className="text-indigo-400">Pro</span>
            </h1>
            <p className="text-xs text-slate-400">
              Kurumsal Envanter & Lojistik Yönetim Sistemi
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                E-Posta veya Kullanıcı Adı
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="E-posta veya kullanıcı adınız"
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                  title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Giriş Yap</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Yetkili Personel Girişi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
