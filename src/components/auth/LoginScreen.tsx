import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { UserRole } from '../../types';
import {
  Boxes,
  ShieldCheck,
  Headphones,
  Briefcase,
  Wrench,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginAsRole, users } = useWarehouse();
  const [selectedRole, setSelectedRole] = useState<UserRole>('DEPO');
  const [activeTab, setActiveTab] = useState<'CARDS' | 'FORM'>('CARDS');
  const [password, setPassword] = useState('123456');

  const roleCards: {
    role: UserRole;
    title: string;
    subTitle: string;
    desc: string;
    badge: string;
    bg: string;
    border: string;
    btnColor: string;
    icon: any;
    fontAwesomeIcon: string;
    permissions: string[];
  }[] = [
    {
      role: 'DEPO',
      title: 'Depo Departmanı',
      subTitle: 'Tam Yönetici Yetkisi',
      desc: 'Cihaz ekleme, çıkarma, personele toplu zimmetleme, iade kabul onayları ve tam stok yönetimi.',
      badge: 'Süper Yetkili',
      bg: 'bg-indigo-50/60 dark:bg-slate-900',
      border: 'border-indigo-300 hover:border-indigo-600',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      icon: ShieldCheck,
      fontAwesomeIcon: 'fa-solid fa-warehouse',
      permissions: ['Ekleme & Çıkarma', 'Personele Teslim', 'İade Onay & Kabul', 'Kullanıcı Yönetimi'],
    },
    {
      role: 'ONOFIS',
      title: 'Ön Ofis Departmanı',
      subTitle: 'Sadece İade Onaya Gönder',
      desc: 'Ön ofiste sadece iade onaya gönder modülü bulunur. Saha ve müşterilerden gelen cihazları seçip notunuzu ekleyerek depo onayına iletirsiniz.',
      badge: 'İade Masası',
      bg: 'bg-emerald-50/60 dark:bg-slate-900',
      border: 'border-emerald-300 hover:border-emerald-600',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      icon: Headphones,
      fontAwesomeIcon: 'fa-solid fa-headset',
      permissions: ['Sadece İade Onaya Gönder'],
    },
    {
      role: 'BACKOFIS',
      title: 'Backofis Departmanı',
      subTitle: 'Stok Kontrol & Denetim',
      desc: 'Stok izleme, yeni ürün kaydı açma, saha zimmet kontrolü ve 2. donanım raporlama.',
      badge: 'Denetim & Finans',
      bg: 'bg-blue-50/60 dark:bg-slate-900',
      border: 'border-blue-300 hover:border-blue-600',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: Briefcase,
      fontAwesomeIcon: 'fa-solid fa-calculator',
      permissions: ['Cihaz & Stok İzleme', 'Yeni Ürün Kaydı', 'Ekipler & Zimmet', '2. Donanım Takip'],
    },
    {
      role: 'TEKNIK',
      title: 'Teknik Servis',
      subTitle: 'Arıza & Onarım Laboratuvarı',
      desc: 'Depodan gelen malzeme paketlerini kontrol edip kabul etme (zimmete alma), kendi iade cihazları takibi ve sorgulama.',
      badge: 'Teknik Servis',
      bg: 'bg-amber-50/60 dark:bg-slate-900',
      border: 'border-amber-300 hover:border-amber-600',
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: Wrench,
      fontAwesomeIcon: 'fa-solid fa-screwdriver-wrench',
      permissions: ['Malzeme & Paket Onayı', 'Kendi İade Cihazları Takibi', 'Cihaz Sorgulama & Künye', '2. Donanım Takip'],
    },
  ];

  const handleCardLogin = (role: UserRole) => {
    loginAsRole(role);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsRole(selectedRole);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-indigo-400 text-xs font-bold shadow-lg">
            <i className="fa-solid fa-cube text-indigo-400"></i>
            <span>Depo & Envanter Yönetim Sistemi v2.5</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Kurumsal Departman Girişi
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Lütfen yetkili olduğunuz departman rolünü seçiniz. Sisteme giriş yaptığınızda panel yetkileri ve menü görünümleri departmanınıza göre dinamik olarak filtrelenecektir.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex gap-1">
            <button
              onClick={() => setActiveTab('CARDS')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'CARDS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-users"></i>
              Departman Seçimi (Hızlı Test)
            </button>
            <button
              onClick={() => setActiveTab('FORM')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'FORM'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-key"></i>
              Şifreli Giriş Ekranı
            </button>
          </div>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'CARDS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleCards.map(c => {
              const matchedUser = users.find(u => u.role === c.role);
              const Icon = c.icon;

              return (
                <div
                  key={c.role}
                  className={`bg-slate-900/90 rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:scale-[1.01] ${c.border}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xl">
                          <i className={c.fontAwesomeIcon}></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-white">{c.title}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                              {c.badge}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block">{c.subTitle}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {c.desc}
                    </p>

                    <div className="space-y-1.5 mb-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Departman Yetkileri:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {c.permissions.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {matchedUser && (
                      <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                        <span>Test Kullanıcısı:</span>
                        <strong className="text-slate-200">{matchedUser.name}</strong>
                      </div>
                    )}
                    <button
                      onClick={() => handleCardLogin(c.role)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${c.btnColor}`}
                    >
                      <span>{c.title} Olarak Oturum Aç</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white text-center">
              Kullanıcı Giriş Formu
            </h3>
            <p className="text-xs text-slate-400 text-center">
              Giriş yapmak istediğiniz departman hesabını seçiniz
            </p>

            <form onSubmit={handleFormLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Departman Rolü
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="DEPO">Depo (Mehmet Demir - Tam Yönetici)</option>
                  <option value="ONOFIS">Ön Ofis (Selin Arslan - Müşteri Operasyon)</option>
                  <option value="BACKOFIS">Backofis (Zeynep Kaya - Stok Denetmeni)</option>
                  <option value="TEKNIK">Teknik (Emre Yıldız - Arıza-Onarım Şefi)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    readOnly
                    value={users.find(u => u.role === selectedRole)?.email || ''}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Demo şifresi: <code>123456</code>
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Güvenli Oturum Aç</span>
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-4">
          <span>Depo & Envanter Yönetim Sistemi • Single-File & Real-Time Ready • 2026</span>
        </div>
      </div>
    </div>
  );
};
