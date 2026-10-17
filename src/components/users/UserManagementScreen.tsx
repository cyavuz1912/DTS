import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { User, UserRole } from '../../types';
import {
  UserCog,
  Plus,
  ShieldCheck,
  Headphones,
  Briefcase,
  Wrench,
  KeyRound,
  Trash2,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

export const UserManagementScreen: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useWarehouse();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ONOFIS');
  const [department, setDepartment] = useState('Ön Ofis Operasyon');
  const [phone, setPhone] = useState('+90 532 ');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const roleTitles: Record<UserRole, string> = {
      DEPO: 'Depo Sorumlusu & Yöneticisi',
      ONOFIS: 'Ön Ofis Müşteri Temsilcisi',
      BACKOFIS: 'Backofis Stok Denetim Uzmanı',
      TEKNIK: 'Teknik Servis Teknisyeni',
    };

    addUser({
      name,
      email,
      role,
      roleTitle: roleTitles[role],
      department,
      phone,
      status: 'AKTIF',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });

    setName('');
    setEmail('');
    setIsAddModalOpen(false);
  };

  const handleResetPassword = (userName: string) => {
    alert(`"${userName}" kullanıcısının şifresi başarıyla "123456" olarak sıfırlandı ve e-posta ile iletildi.`);
  };

  const roleMeta: Record<
    UserRole,
    { label: string; bg: string; text: string; icon: string }
  > = {
    DEPO: {
      label: 'Depo (Tam Yetkili)',
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-400',
      icon: 'fa-solid fa-warehouse',
    },
    ONOFIS: {
      label: 'Ön Ofis',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      icon: 'fa-solid fa-headset',
    },
    BACKOFIS: {
      label: 'Backofis',
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      icon: 'fa-solid fa-calculator',
    },
    TEKNIK: {
      label: 'Teknik Servis',
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      icon: 'fa-solid fa-screwdriver-wrench',
    },
  };

  const canManageUsers = currentUser?.role === 'DEPO';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-user-shield"></i>
              Sistem Güvenlik & Yetkilendirme
            </span>
            <span className="text-xs text-slate-400">4 Departman Rol Mimarisi</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Kullanıcı Yönetimi & Erişim Yetkileri
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Sisteme giriş yapabilecek Depo, Ön Ofis, Backofis ve Teknik servis personelini yönetin, rol değiştirin ve şifre sıfırlama işlemlerini yapın.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kullanıcı Ekle</span>
          </button>
        )}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u => {
          const meta = roleMeta[u.role];
          const isMe = currentUser?.id === u.id;

          return (
            <div
              key={u.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{u.name}</h4>
                        {isMe && (
                          <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                            Mevcut Siz
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block">{u.email}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${meta.bg} ${meta.text}`}>
                    <i className={meta.icon}></i>
                    <span>{meta.label}</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Görevi:</span>
                    <strong className="text-slate-200">{u.roleTitle}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Departman:</span>
                    <strong className="text-slate-200">{u.department}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Telefon:</span>
                    <strong className="text-slate-200 font-mono">{u.phone}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                {canManageUsers ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Rolü Değiştir:</span>
                    <select
                      value={u.role}
                      onChange={e => updateUser(u.id, { role: e.target.value as UserRole })}
                      className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="DEPO">Depo</option>
                      <option value="ONOFIS">Ön Ofis</option>
                      <option value="BACKOFIS">Backofis</option>
                      <option value="TEKNIK">Teknik</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">Durum: Aktif Hesap</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleResetPassword(u.name)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Şifreyi Sıfırla"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  {canManageUsers && !isMe && users.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`"${u.name}" kullanıcısını silmek istediğinize emin misiniz?`)) {
                          deleteUser(u.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                      title="Kullanıcıyı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Yeni Sistem Kullanıcısı Oluştur
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Kullanıcı Adı Soyadı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Serdar Vural"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">E-Posta Adresi (Giriş İçin)</label>
                <input
                  type="email"
                  required
                  placeholder="serdar@depopro.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Departman Rolü</label>
                <select
                  value={role}
                  onChange={e => {
                    const r = e.target.value as UserRole;
                    setRole(r);
                    if (r === 'DEPO') setDepartment('Depo & Lojistik');
                    if (r === 'ONOFIS') setDepartment('Ön Ofis & Müşteri Operasyon');
                    if (r === 'BACKOFIS') setDepartment('Backofis & Denetim');
                    if (r === 'TEKNIK') setDepartment('Teknik Servis & Bakım');
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="DEPO">Depo (Tam Yönetici Yetkisi)</option>
                  <option value="ONOFIS">Ön Ofis (Sadece İade Onaya Gönder)</option>
                  <option value="BACKOFIS">Backofis (Stok İzleme & Raporlama)</option>
                  <option value="TEKNIK">Teknik (Malzeme Onay & İade Takip)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Departman Adı</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Telefon Numarası</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Kullanıcıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
