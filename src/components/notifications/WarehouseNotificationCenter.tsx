import React, { useState, useRef, useEffect } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { WarehouseNotification, NotificationType } from '../../types';
import {
  Bell,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Package,
  FileSpreadsheet,
  AlertTriangle,
  CheckCheck,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const WarehouseNotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    addNotification,
    setActiveTab,
    currentUser,
  } = useWarehouse();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'APPROVAL' | 'RETURN' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter(notif => {
    if (filterType === 'UNREAD') return !notif.isRead;
    if (filterType === 'APPROVAL') {
      return (
        notif.type === 'PACKAGE_APPROVAL' ||
        notif.type === 'PACKAGE_REJECTION' ||
        notif.type === 'PACKAGE_DISPATCH'
      );
    }
    if (filterType === 'RETURN') {
      return (
        notif.type === 'RETURN_SUBMITTED' ||
        notif.type === 'RETURN_APPROVED' ||
        notif.type === 'RETURN_REJECTED'
      );
    }
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'PACKAGE_APPROVAL':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'PACKAGE_REJECTION':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'PACKAGE_DISPATCH':
        return <Package className="w-4 h-4 text-indigo-400" />;
      case 'RETURN_SUBMITTED':
        return <RotateCcw className="w-4 h-4 text-amber-400" />;
      case 'RETURN_APPROVED':
        return <CheckCheck className="w-4 h-4 text-emerald-400" />;
      case 'RETURN_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'EXCEL_IMPORT':
        return <FileSpreadsheet className="w-4 h-4 text-blue-400" />;
      case 'STOCK_ALERT':
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getNotificationBg = (type: NotificationType, isRead: boolean) => {
    if (isRead) {
      return 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-300';
    }
    switch (type) {
      case 'PACKAGE_APPROVAL':
        return 'bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-500/30 text-emerald-200';
      case 'RETURN_SUBMITTED':
        return 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-500/30 text-amber-200';
      case 'PACKAGE_REJECTION':
      case 'RETURN_REJECTED':
        return 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/30 text-rose-200';
      case 'PACKAGE_DISPATCH':
        return 'bg-indigo-950/20 hover:bg-indigo-950/30 border-indigo-500/30 text-indigo-200';
      default:
        return 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200';
    }
  };

  const handleNavigate = (notif: WarehouseNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.linkTab) {
      setActiveTab(notif.linkTab);
      setIsOpen(false);
    }
  };

  // Quick simulation helpers for testing real-time events
  const simulateAhmetApproval = () => {
    addNotification({
      type: 'PACKAGE_APPROVAL',
      actorName: 'Ahmet Özer',
      actorRole: 'Saha Ekibi',
      title: 'Ahmet Özer malzemeleri onayladı',
      description: `PKT-2026-${Math.floor(1000 + Math.random() * 9000)} nolu sepet içerisindeki 2 adet modemi kontrol edip eksiksiz zimmetine aldı.`,
      linkTab: 'package_approvals',
    });
  };

  const simulateAhmetReturn = () => {
    addNotification({
      type: 'RETURN_SUBMITTED',
      actorName: 'Ahmet Özer',
      actorRole: 'Saha Ekibi',
      title: 'Ahmet Özer iade gönderdi',
      description: `SN-ZTE-${Math.floor(10000 + Math.random() * 90000)} nolu arızalı router cihazını saha değişiminden sonra depoya iade onayı için gönderdi.`,
      linkTab: 'returns',
    });
  };

  const simulateTeknikApproval = () => {
    addNotification({
      type: 'PACKAGE_APPROVAL',
      actorName: 'Emre Yıldız',
      actorRole: 'Teknik Servis',
      title: 'Emre Yıldız malzemeleri onayladı',
      description: 'Depodan gelen test kolisi fiziki kontrolleri yapılarak teknik servis zimmetine kabul edildi.',
      linkTab: 'package_approvals',
    });
  };

  const isDepo = currentUser?.role === 'DEPO';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Depo Hareket Bildirimleri"
        title="Depo Hareket Bildirimleri"
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
            : unreadNotificationsCount > 0
            ? 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-750 hover:border-amber-400'
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? 'animate-bounce' : ''}`} />

        {/* Unread Counter Badge */}
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse border-2 border-slate-900">
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[380px] sm:w-[460px] max-w-[95vw] bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800/90 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight">
                    Depo Hareket Bildirimleri
                  </h3>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                      {unreadNotificationsCount} Yeni
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isDepo
                    ? 'Tüm malzeme sevk onayları ve iade hareketleri anlık bildirilir'
                    : 'Departmanlar arası hareket bildirim akışı'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  title="Tümünü okundu olarak işaretle"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold hidden sm:inline">Okundu</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  title="Bildirimleri temizle"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Simulation Bar (Allows instant testing of "Ahmet Özer onayladı" & "Ahmet Özer iade gönderdi") */}
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Canlı Test:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={simulateAhmetApproval}
                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition cursor-pointer"
              >
                + Ahmet Özer Onayladı
              </button>
              <button
                onClick={simulateAhmetReturn}
                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition cursor-pointer"
              >
                + Ahmet Özer İade Etti
              </button>
              <button
                onClick={simulateTeknikApproval}
                className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold transition cursor-pointer hidden sm:inline-block"
              >
                + Teknik Onayladı
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Tümü ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('APPROVAL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterType === 'APPROVAL'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Malzeme Onayları
            </button>
            <button
              onClick={() => setFilterType('RETURN')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterType === 'RETURN'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              İadeler
            </button>
            <button
              onClick={() => setFilterType('UNREAD')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterType === 'UNREAD'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Okunmamış ({unreadNotificationsCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs font-semibold text-slate-400">
                  {filterType === 'UNREAD'
                    ? 'Okunmamış bildirim bulunmuyor'
                    : 'Bu kategoride bildirim bulunamadı'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Yeni bir malzeme çıkışı yapıldığında veya personel onay/iade işlemi gerçekleştirdiğinde burada listelenecektir.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif, idx) => {
                const isRead = notif.isRead;
                const bgClass = getNotificationBg(notif.type, isRead);

                return (
                  <div
                    key={`${notif.id}-${idx}`}
                    className={`p-3 rounded-2xl border transition-all duration-150 flex items-start gap-3 relative group ${bgClass}`}
                  >
                    {/* Event Icon */}
                    <div className="mt-0.5 w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs text-white">
                            {notif.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-950/80 text-slate-400 border border-slate-800">
                            {notif.actorRole}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {notif.description}
                      </p>

                      {/* Navigation Link / Action */}
                      <div className="pt-1 flex items-center justify-between gap-2">
                        {notif.linkTab ? (
                          <button
                            onClick={() => handleNavigate(notif)}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <span>
                              {notif.linkTab === 'package_approvals'
                                ? 'Paket Onay Sekmesine Git'
                                : notif.linkTab === 'returns'
                                ? 'İade Masasına Git'
                                : 'İlgili Kayda Git'}
                            </span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <div />
                        )}

                        {!isRead && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                            title="Okundu olarak işaretle"
                          >
                            Okundu İşaretle
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!isRead && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 shadow-sm shrink-0"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 px-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">Canlı Hareket Dinleyici Aktif</span>
            </div>

            <span>DepoPro Bildirim Sistemi</span>
          </div>
        </div>
      )}
    </div>
  );
};
