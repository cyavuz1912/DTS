import React, { useState, useRef, useEffect } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { UserRole } from '../../types';
import {
  LogOut,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  User as UserIcon,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';
import { WarehouseNotificationCenter } from '../notifications/WarehouseNotificationCenter';

export const Header: React.FC = () => {
  const { currentUser, logout, devices, settings, resetToDefaults } = useWarehouse();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
        setShowResetConfirm(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  if (!currentUser) return null;

  // Calculate in-depot devices count
  const inDepotCount = devices.filter(d => d.status === 'DEPODA').length;
  const isCritical = inDepotCount <= settings.criticalStockThreshold;

  const roleStyles: Record<
    UserRole,
    { label: string; workspaceName: string; icon: string; bg: string; text: string; border: string }
  > = {
    DEPO: {
      label: 'Depo Yönetimi',
      workspaceName: 'Merkez Depo & Lojistik Yönetim Paneli',
      icon: 'fa-solid fa-warehouse',
      bg: 'bg-indigo-950/80',
      text: 'text-indigo-400',
      border: 'border-indigo-700/50',
    },
    ONOFIS: {
      label: 'Ön Ofis',
      workspaceName: 'Ön Ofis İade Gönderim Masası',
      icon: 'fa-solid fa-headset',
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-400',
      border: 'border-emerald-700/50',
    },
    BACKOFIS: {
      label: 'Backofis',
      workspaceName: 'Backofis Stok & Zimmet Denetim Paneli',
      icon: 'fa-solid fa-calculator',
      bg: 'bg-blue-950/80',
      text: 'text-blue-400',
      border: 'border-blue-700/50',
    },
    TEKNIK: {
      label: 'Teknik Servis',
      workspaceName: 'Teknik Servis Malzeme Kabul & İade Masası',
      icon: 'fa-solid fa-screwdriver-wrench',
      bg: 'bg-amber-950/80',
      text: 'text-amber-400',
      border: 'border-amber-700/50',
    },
  };

  const currentRoleStyle = roleStyles[currentUser.role];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Active Workspace Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <i className="fa-solid fa-boxes-stacked text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">
                Depo<span className="text-indigo-400">Pro</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
              >
                {currentRoleStyle.label}
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-slate-400">
              {currentRoleStyle.workspaceName}
            </span>
          </div>
        </div>

        {/* Center: In-Depot Stock Level Badge (Ön ofis için sadece iade masası gösterilir) */}
        {currentUser.role !== 'ONOFIS' ? (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <span className="text-slate-400">Depo Mevcut Cihaz:</span>
            <span
              className={`font-bold font-mono px-2 py-0.5 rounded ${
                isCritical
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {inDepotCount} Adet
            </span>
            {isCritical && (
              <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Kritik Eşik (Min: {settings.criticalStockThreshold})
              </span>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-2">
              <i className="fa-solid fa-headset text-emerald-400"></i>
              Ön Ofis İade Gönderim Ekranı
            </span>
          </div>
        )}

        {/* Right: Eylemler & Hareket Geçmişi Bell & User Account Controls */}
        <div className="flex items-center gap-2.5">
          {/* Warehouse Movement & Action Notification Bell */}
          <WarehouseNotificationCenter />

          {/* Active User Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${currentRoleStyle.bg} ${currentRoleStyle.border} hover:brightness-110`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover border border-slate-700"
              />
              <div className="text-left hidden sm:block">
                <span className="text-white block font-bold text-xs leading-tight">
                  {currentUser.name}
                </span>
                <span className={`text-[10px] ${currentRoleStyle.text} block leading-tight`}>
                  {currentRoleStyle.label}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
                {/* User Info Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{currentUser.name}</h4>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {currentUser.roleTitle}
                    </span>
                  </div>
                </div>

                {/* Account Metadata */}
                <div className="space-y-1.5 text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{currentUser.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.phone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Farklı Hesapla Giriş Yap</span>
                  </button>

                  {currentUser.role === 'DEPO' && (
                    <div>
                      {!showResetConfirm ? (
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Fabrika Verilerine Sıfırla</span>
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                          <span className="text-[11px] text-rose-200 block font-semibold">
                            Tüm veriler sıfırlanıp giriş ekranına dönülsün mü?
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                resetToDefaults();
                                setShowProfileMenu(false);
                                setShowResetConfirm(false);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Evet, Sıfırla
                            </button>
                            <button
                              onClick={() => setShowResetConfirm(false)}
                              className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold cursor-pointer"
                            >
                              Vazgeç
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Direct Logout Button */}
          <button
            onClick={logout}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition border border-slate-700 hover:border-rose-500 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Oturumu Kapat ve Giriş Ekranına Dön"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Çıkış Yap</span>
          </button>
        </div>
      </div>
    </header>
  );
};
