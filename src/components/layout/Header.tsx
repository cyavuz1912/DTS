import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { UserRole } from '../../types';
import {
  LogOut,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { WarehouseNotificationCenter } from '../notifications/WarehouseNotificationCenter';

export const Header: React.FC = () => {
  const { currentUser, loginAsRole, logout, devices, settings, resetToDefaults } = useWarehouse();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  if (!currentUser) return null;

  // Calculate in-depot devices count
  const inDepotCount = devices.filter(d => d.status === 'DEPODA').length;
  const isCritical = inDepotCount <= settings.criticalStockThreshold;

  const roleStyles: Record<
    UserRole,
    { label: string; icon: string; bg: string; text: string; border: string }
  > = {
    DEPO: {
      label: 'Depo (Tam Yetki)',
      icon: 'fa-solid fa-warehouse',
      bg: 'bg-indigo-950/80',
      text: 'text-indigo-400',
      border: 'border-indigo-700/50',
    },
    ONOFIS: {
      label: 'Ön Ofis',
      icon: 'fa-solid fa-headset',
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-400',
      border: 'border-emerald-700/50',
    },
    BACKOFIS: {
      label: 'Backofis',
      icon: 'fa-solid fa-calculator',
      bg: 'bg-blue-950/80',
      text: 'text-blue-400',
      border: 'border-blue-700/50',
    },
    TEKNIK: {
      label: 'Teknik Servis',
      icon: 'fa-solid fa-screwdriver-wrench',
      bg: 'bg-amber-950/80',
      text: 'text-amber-400',
      border: 'border-amber-700/50',
    },
  };

  const currentRoleStyle = roleStyles[currentUser.role];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <i className="fa-solid fa-boxes-stacked text-lg"></i>
          </div>
          <div>
            <span className="font-black text-lg text-white tracking-tight">
              Depo<span className="text-indigo-400">Pro</span>
            </span>
          </div>
        </div>

        {/* Center: In-Depot Stock Level Badge (Ön ofis için sadece iade onaya gönder masası gösterilir) */}
        {currentUser.role !== 'ONOFIS' ? (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <span className="text-slate-400">Depo Mevcut Cihaz:</span>
            <span className={`font-bold font-mono px-2 py-0.5 rounded ${isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {inDepotCount} Adet
            </span>
            {isCritical && (
              <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Kritik Eşik Uyarısı (Min: {settings.criticalStockThreshold})
              </span>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-2">
              <i className="fa-solid fa-headset text-emerald-400"></i>
              Ön Ofis İade Masası
            </span>
          </div>
        )}

        {/* Right: Active Role Switcher, Notification Bell & Profile */}
        <div className="flex items-center gap-3">
          {/* Warehouse Movement Notification Bell */}
          <WarehouseNotificationCenter />

          {/* Quick Role Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${currentRoleStyle.bg} ${currentRoleStyle.border} hover:brightness-110`}
            >
              <i className={`${currentRoleStyle.icon} ${currentRoleStyle.text}`}></i>
              <div className="text-left hidden lg:block">
                <span className="text-white block font-bold text-xs">{currentUser.name}</span>
                <span className={`text-[10px] ${currentRoleStyle.text}`}>{currentRoleStyle.label}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <span className="text-xs font-bold text-white block">Departman / Rol Değiştir</span>
                  <span className="text-[11px] text-slate-400">Prototip yetki testi için anında geçiş yapın:</span>
                </div>

                <div className="space-y-1">
                  {(['DEPO', 'ONOFIS', 'BACKOFIS', 'TEKNIK'] as UserRole[]).map(r => {
                    const style = roleStyles[r];
                    const isActive = currentUser.role === r;

                    return (
                      <button
                        key={r}
                        onClick={() => {
                          loginAsRole(r);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <i className={`${style.icon} ${isActive ? 'text-white' : style.text}`}></i>
                          <span>{style.label}</span>
                        </div>
                        {isActive && <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-bold">Aktif</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      if (confirm('Tüm veriler varsayılan haline sıfırlansın mı?')) {
                        resetToDefaults();
                        setShowRoleDropdown(false);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Demo Verilerini Sıfırla
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
            title="Oturumu Kapat (Giriş Ekranına Dön)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
