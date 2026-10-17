import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { TransferPackage } from '../../types';
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Truck,
  Barcode,
  Search,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

export const PackageApprovalScreen: React.FC = () => {
  const {
    packages,
    acceptTransferPackage,
    rejectTransferPackage,
    currentUser,
    setActiveTab,
  } = useWarehouse();

  const isDepo = currentUser?.role === 'DEPO';
  const isTeknik = currentUser?.role === 'TEKNIK';

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filter packages based on role:
  // - Depo sees all outgoing transfer packages across all recipients
  // - Teknik sees incoming transfer packages destined for Teknik
  const userRelevantPackages = packages.filter(pkg => {
    if (isDepo) return true;
    if (isTeknik) {
      return (
        pkg.targetRole === 'TEKNIK' ||
        pkg.targetPersonnelId === 'usr-teknik' ||
        pkg.targetName?.toLowerCase().includes('teknik') ||
        pkg.targetName?.toLowerCase().includes('emre')
      );
    }
    return true;
  });

  // Apply status filter & search query
  const filteredPackages = userRelevantPackages.filter(pkg => {
    if (activeFilter === 'PENDING' && pkg.status !== 'ONAY_BEKLIYOR') return false;
    if (activeFilter === 'ACCEPTED' && pkg.status !== 'KABUL_EDILDI') return false;
    if (activeFilter === 'REJECTED' && pkg.status !== 'REDDEDILDI') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPkgNo = pkg.packageNumber.toLowerCase().includes(q);
      const matchTarget = pkg.targetName.toLowerCase().includes(q);
      const matchSender = pkg.senderName.toLowerCase().includes(q);
      const matchDevice = pkg.devicesSummary.some(
        d => d.serialNumber.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
      );
      return matchPkgNo || matchTarget || matchSender || matchDevice;
    }

    return true;
  });

  // Counters
  const countPending = userRelevantPackages.filter(p => p.status === 'ONAY_BEKLIYOR').length;
  const countAccepted = userRelevantPackages.filter(p => p.status === 'KABUL_EDILDI').length;
  const countRejected = userRelevantPackages.filter(p => p.status === 'REDDEDILDI').length;

  const toggleExpand = (pkgId: string) => {
    setExpandedPackageId(prev => (prev === pkgId ? null : pkgId));
  };

  const handleAccept = (pkg: TransferPackage) => {
    const success = acceptTransferPackage(pkg.id);
    if (success) {
      setActionFeedback(`🎉 Harika! "${pkg.packageNumber}" nolu sepet başarıyla kabul edildi ve ${pkg.devicesSummary.length} adet cihaz teknik zimmetinize geçirildi.`);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleReject = (pkg: TransferPackage) => {
    const reason = prompt('Lütfen paketi reddetme / depoya iade gerekçesini yazınız (Örn: Paket hasarlı, eksik cihaz var):');
    if (reason && reason.trim()) {
      const success = rejectTransferPackage(pkg.id, reason.trim());
      if (success) {
        setActionFeedback(`⚠️ "${pkg.packageNumber}" nolu teslimat reddedildi ve cihazlar depoya geri döndürüldü.`);
        setTimeout(() => setActionFeedback(null), 4000);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                isTeknik
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              {isTeknik ? 'Teknik Servis Malzeme Onay Masası' : 'Depo Malzeme Sevk & Transfer Onayları'}
            </span>
            <span className="text-xs text-slate-400">
              Oturum: <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.roleTitle})
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{isTeknik ? 'Gelen Malzeme Paketleri & Zimmet Onayı' : 'Malzeme Transfer & Paket Onayları'}</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isTeknik ? (
              <>
                Depo tarafından teknik servise gönderilen sepet ve paketler aşağıda <strong>ayrı ayrı paket ambalajı</strong> halinde listelenir. Cihazları fiziki olarak kontrol ettikten sonra sepeti kabul edip doğrudan zimmetinize alabilirsiniz.
              </>
            ) : (
              <>
                Depodan teknik servise ve saha ekiplerine çıkışı yapılan sepet ve koli paketleri. <strong>Kimlerin kabul ettiğini, kimlerin henüz onaylamadığını</strong> anlık olarak buradan takip edebilirsiniz.
              </>
            )}
          </p>
        </div>

        {/* Action / Helper Button */}
        {isDepo && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('checkout')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Yeni Malzeme Paketi Çıkar</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Feedback Alert */}
      {actionFeedback && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">Toplam Paket</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-2xl font-black text-white mt-1 block">
            {userRelevantPackages.length}
          </span>
          <span className="text-[10px] text-slate-500">Kayıtlı sevkiyat kolisi</span>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold">
              {isDepo ? 'Henüz Kabul Etmeyenler' : 'Onay Bekleyen Paketler'}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400 mt-1 block">
            {countPending}
          </span>
          <span className="text-[10px] text-amber-400/80">
            {isDepo ? 'Karşı tarafın onayı bekleniyor' : 'Kontrol edip kabul edin'}
          </span>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-bold">Zimmete Alınanlar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {countAccepted}
          </span>
          <span className="text-[10px] text-emerald-400/80">Kabulü tamamlanmış</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-bold">Reddedilenler</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-400 mt-1 block">
            {countRejected}
          </span>
          <span className="text-[10px] text-slate-500">Depoya geri dönen</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isDepo ? 'Onay Bekleyenler (Kabul Etmeyenler)' : 'Onay Bekleyen Paketlerim'}</span>
            {countPending > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-slate-950 text-amber-300 border border-amber-400/30">
                {countPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFilter('ACCEPTED')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeFilter === 'ACCEPTED'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kabul Edilenler (Zimmete Geçenler)</span>
            <span className="text-[10px] font-bold opacity-80">({countAccepted})</span>
          </button>

          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Tüm Paketler ({userRelevantPackages.length})</span>
          </button>

          {countRejected > 0 && (
            <button
              onClick={() => setActiveFilter('REJECTED')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                activeFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reddedilenler ({countRejected})</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Paket No, Seri No veya Alıcı ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notice Banner */}
      {isDepo && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Depo Bilgilendirmesi:</strong> Her çıkış ayrı bir lojistik paketi olarak kaydedilir. Alıcı (Teknik Servis veya Saha Teknisyeni) cihazları kontrol edip onaylamadığı sürece durum <em>'Onay Bekliyor'</em> olarak kalır. Kabul edildiğinde anında yeşil onay rozeti ve onay tarihiyle güncellenir.
          </span>
        </div>
      )}

      {/* PACKAGES LIST - ANIMATED DISTINCT 3D CARGO PARCELS */}
      {filteredPackages.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Bu filtrede gösterilecek paket bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeFilter === 'PENDING'
              ? 'Şu anda onay bekleyen herhangi bir sevk paketi bulunmuyor.'
              : 'Seçili filtre ve arama kriterlerine uygun koli bulunmamaktadır.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPackages.map((pkg, idx) => {
            const isPending = pkg.status === 'ONAY_BEKLIYOR';
            const isAccepted = pkg.status === 'KABUL_EDILDI';
            const isRejected = pkg.status === 'REDDEDILDI';
            const isExpanded = expandedPackageId === pkg.id;

            return (
              <div
                key={`${pkg.id}-${idx}`}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`bg-slate-900 border rounded-3xl overflow-hidden shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
                  isPending
                    ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20'
                    : isAccepted
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-rose-500/30'
                }`}
              >
                {/* 1. INDUSTRIAL LOGISTICS TAPE (Cardboard Tape Strip) */}
                <div
                  className={`px-4 py-1.5 flex items-center justify-between text-[10px] font-black tracking-wider uppercase border-b ${
                    isPending
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : isAccepted
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">📦 LOJİSTİK SEVKİYAT PAKETİ</span>
                    <span>•</span>
                    <span className="font-mono">{pkg.packageNumber}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline font-mono">DİJİTAL DONANIM SEVKİYATI</span>
                    <span>•</span>
                    <span>{pkg.createdAt}</span>
                  </div>
                </div>

                {/* 2. MAIN PACKAGE BODY */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Package Info & Logistics Route */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Barcode badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white">
                          <Barcode className="w-4 h-4 text-amber-400" />
                          <span className="font-black text-amber-400 tracking-wider">
                            {pkg.packageNumber}
                          </span>
                        </div>

                        {/* Device count pill */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{pkg.devicesSummary.length} Adet Cihaz</span>
                        </span>

                        {/* Recipient tag */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                          {pkg.targetRole === 'TEKNIK' ? '🛠️ Teknik Servis' : '👷 Saha Ekibi'}
                        </span>
                      </div>

                      {/* Route: Sender -> Delivery Arrow -> Recipient */}
                      <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            <i className="fa-solid fa-boxes-stacked"></i>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Gönderen (Depo):</span>
                            <span className="font-bold text-white">{pkg.senderName}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center text-slate-600 gap-1 px-2">
                          <div className="h-[1px] w-8 bg-slate-800 hidden sm:block"></div>
                          <Truck className="w-4 h-4 text-amber-400 animate-pulse" />
                          <div className="h-[1px] w-8 bg-slate-800 hidden sm:block"></div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                            <i className="fa-solid fa-user-check"></i>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Alıcı (Zimmetlenecek):</span>
                            <span className="font-bold text-amber-300">{pkg.targetName}</span>
                          </div>
                        </div>
                      </div>

                      {pkg.notes && (
                        <p className="text-xs text-slate-300 bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800/80">
                          <strong className="text-slate-400">Sevkiyat Notu:</strong> {pkg.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: Status Stamp & Actions */}
                    <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                      {/* Status Stamp */}
                      {isPending && (
                        <div className="text-left sm:text-right">
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                            TESLİM ONAYI BEKLİYOR
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            {isDepo
                              ? `⚠️ Alıcı (${pkg.targetName}) henüz kabul etmedi`
                              : '💡 Cihazları kontrol edip onaylayınız'}
                          </span>
                        </div>
                      )}

                      {isAccepted && (
                        <div className="text-left sm:text-right">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            KABUL EDİLDİ & ZİMMETE ALINDI
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            <span>Onaylayan: <strong className="text-slate-200">{pkg.respondedBy}</strong></span>
                            {pkg.respondedAt && <span className="block text-emerald-400">{pkg.respondedAt}</span>}
                          </div>
                        </div>
                      )}

                      {isRejected && (
                        <div className="text-left sm:text-right">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle className="w-4 h-4 text-rose-400" />
                            TESLİMAT REDDEDİLDİ
                          </span>
                          {pkg.rejectionReason && (
                            <span className="text-[11px] text-rose-300 block mt-1">
                              Gerekçe: {pkg.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Teknik Action Buttons (Sepeti kabul et / reddet) */}
                      {isTeknik && isPending && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleAccept(pkg)}
                            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition transform hover:scale-[1.02]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Sepeti Kabul Et & Zimmetime Al</span>
                          </button>

                          <button
                            onClick={() => handleReject(pkg)}
                            className="px-3 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. UNBOXING ACCORDION: VIEW DEVICES INSIDE THE PACKAGE */}
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => toggleExpand(pkg.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white py-2 px-3 rounded-xl hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400" />
                        <span>Paket İçeriğini Aç & Cihazları Kontrol Et ({pkg.devicesSummary.length} Cihaz)</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Unboxed Devices Drawer */}
                    {isExpanded && (
                      <div className="mt-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                          <span>Paket İçeriğindeki Donanımlar</span>
                          <span>Fiziksel Kabul Doğrulaması</span>
                        </div>

                        <div className="space-y-2">
                          {pkg.devicesSummary.map((dev, dIdx) => (
                            <div
                              key={dev.id}
                              className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-black">
                                  {dIdx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded">
                                      {dev.serialNumber}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {dev.itemCode}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-white text-xs mt-0.5">{dev.name}</h5>
                                  <span className="text-[10px] text-slate-400">{dev.model} • {dev.category}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>{isAccepted ? 'Zimmetlendi' : isPending ? 'Kontrol Bekliyor' : 'İade Edildi'}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bottom action inside unboxed drawer for Teknik */}
                        {isTeknik && isPending && (
                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              Yukarıdaki cihazların seri numaralarını ve kutu içeriklerini doğruladıktan sonra kabul ediniz.
                            </span>

                            <button
                              onClick={() => handleAccept(pkg)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tüm Sepeti Kabul Et & Zimmetime Al</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
