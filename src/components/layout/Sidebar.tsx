import React from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import {
  ArrowRightCircle,
  RotateCcw,
  Search,
  Users,
  HardDrive,
  UserCog,
  FileSpreadsheet,
  Lock,
  Package,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, canAccess, currentUser, returnRequests, packages } = useWarehouse();

  if (!currentUser) return null;

  const pendingReturnsCount = returnRequests.filter(r => r.status === 'BEKLEMEDE').length;

  const menuItems = [
    {
      id: 'checkout',
      label: 'Malzeme Çıkış / Teslim',
      subLabel: 'Barkod Okutma & Sepet',
      icon: 'fa-solid fa-barcode',
      lucideIcon: ArrowRightCircle,
      badge: null,
    },
    {
      id: 'package_approvals',
      label: currentUser.role === 'TEKNIK' ? 'Malzeme Onay' : 'Malzeme Onay & Transfer',
      subLabel: currentUser.role === 'TEKNIK' ? 'Gelen Paketler & Zimmet' : 'Paket & Zimmet Takibi',
      icon: 'fa-solid fa-boxes-packing',
      lucideIcon: Package,
      badge: (() => {
        if (currentUser.role === 'TEKNIK') {
          const count = packages.filter(
            p =>
              (p.targetRole === 'TEKNIK' ||
                p.targetPersonnelId === 'usr-teknik' ||
                p.targetName?.toLowerCase().includes('teknik') ||
                p.targetName?.toLowerCase().includes('emre')) &&
              p.status === 'ONAY_BEKLIYOR'
          ).length;
          return count > 0 ? `${count} Yeni Paket` : null;
        }
        if (currentUser.role === 'DEPO') {
          const pendingAll = packages.filter(p => p.status === 'ONAY_BEKLIYOR').length;
          return pendingAll > 0 ? `${pendingAll} Bekleyen` : null;
        }
        return null;
      })(),
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'returns',
      label:
        currentUser.role === 'ONOFIS'
          ? 'İade Onaya Gönder'
          : currentUser.role === 'TEKNIK'
          ? 'İade Cihazlarım'
          : 'İade Onay & Depoya Kabul',
      subLabel:
        currentUser.role === 'ONOFIS'
          ? 'Seri No ile İade'
          : currentUser.role === 'TEKNIK'
          ? 'İade Edilecek & Edilmişler'
          : 'Onay Havuzu & İade',
      icon: 'fa-solid fa-arrow-rotate-left',
      lucideIcon: RotateCcw,
      badge:
        currentUser.role === 'TEKNIK'
          ? (() => {
              const count = returnRequests.filter(
                r =>
                  (r.submittedByName?.toLowerCase().includes('emre') ||
                    r.submittedByName?.toLowerCase() === currentUser.name?.toLowerCase() ||
                    r.submittedByRole?.toLowerCase().includes('teknik')) &&
                  r.status === 'BEKLEMEDE'
              ).length;
              return count > 0 ? `${count} Bekleyen` : null;
            })()
          : currentUser.role === 'ONOFIS'
          ? null
          : pendingReturnsCount > 0
          ? `${pendingReturnsCount} Bekleyen`
          : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'devices',
      label: 'Cihaz Sorgulama & Künye',
      subLabel: 'Seri No & Timeline',
      icon: 'fa-solid fa-magnifying-glass',
      lucideIcon: Search,
      badge: null,
    },
    {
      id: 'stock_import',
      label: 'Excel ile Stok Yükle',
      subLabel: 'Yükle, Tara & Güncelle',
      icon: 'fa-solid fa-file-arrow-up',
      lucideIcon: FileSpreadsheet,
      badge: 'Excel',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    },
    {
      id: 'teams',
      label: 'Ekipler & Zimmet Takip',
      subLabel: 'Saha Çalışanları Cihazları',
      icon: 'fa-solid fa-users-gear',
      lucideIcon: Users,
      badge: null,
    },
    {
      id: 'secondary',
      label: '2. Donanım & Raporlama',
      subLabel: 'Tablet, Kamera, Wi-Fi Ext.',
      icon: 'fa-solid fa-tablet-screen-button',
      lucideIcon: HardDrive,
      badge: null,
    },
    {
      id: 'users',
      label: 'Kullanıcı Yönetimi',
      subLabel: 'Erişim & Rol Yetkileri',
      icon: 'fa-solid fa-user-shield',
      lucideIcon: UserCog,
      badge: null,
    },
    {
      id: 'reconciliation',
      label: 'Ayarlar & Excel Mutabakatı',
      subLabel: 'Merkez Excel Kıyaslama',
      icon: 'fa-solid fa-file-excel',
      lucideIcon: FileSpreadsheet,
      badge: null,
    },
  ];

  const isOnOffis = currentUser.role === 'ONOFIS';
  const displayedItems = isOnOffis
    ? [
        {
          id: 'returns',
          label: 'İade Onaya Gönder',
          subLabel: 'Müşteri & Saha İade Masası',
          icon: 'fa-solid fa-arrow-rotate-left',
          lucideIcon: RotateCcw,
          badge: pendingReturnsCount > 0 ? `${pendingReturnsCount} Bekleyen` : null,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
      ]
    : menuItems;

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-3">
        {/* Department Info Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Aktif Departman
            </span>
            <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-sm space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {isOnOffis ? 'Yetkili Modül' : 'Sistem Modülleri'}
          </div>

          {displayedItems.map(item => {
            const hasPermission = canAccess(item.id);
            const isActive = activeTab === item.id;

            if (!hasPermission) {
              return null; // Don't clutter unpermitted items
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <i
                    className={`${item.icon} text-sm w-4 text-center ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  ></i>
                  <div className="min-w-0">
                    <span className="block truncate text-xs">{item.label}</span>
                    <span
                      className={`text-[10px] block truncate ${
                        isActive ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {item.subLabel}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1 ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
