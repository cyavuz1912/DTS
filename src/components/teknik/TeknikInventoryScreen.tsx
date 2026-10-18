import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { Device } from '../../types';
import {
  Wrench,
  Search,
  Copy,
  Check,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  Boxes,
  Tag,
  X,
  ShieldAlert,
} from 'lucide-react';

export const TeknikInventoryScreen: React.FC = () => {
  const {
    currentUser,
    devices,
    createReturnRequest,
    addNotification,
    setActiveTab,
  } = useWarehouse();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // Return modal state
  const [returnModalDevice, setReturnModalDevice] = useState<Device | null>(null);
  const [returnNote, setReturnNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger feedback toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copy to clipboard helper
  const handleCopySerial = (serialNumber: string) => {
    navigator.clipboard.writeText(serialNumber);
    setCopiedSerial(serialNumber);
    showToast(`Seri numarası kopyalandı: ${serialNumber}`);
    setTimeout(() => {
      setCopiedSerial(null);
    }, 2000);
  };

  // Condition / Excel Statü badge helper
  const getDeviceConditionBadge = (rawCondition?: string) => {
    const c = (rawCondition || 'Sağlam').trim().toLowerCase();
    if (c.includes('arız') || c.includes('ariz') || c.includes('fault') || c.includes('bozuk') || c.includes('hasar') || c.includes('tamir')) {
      return {
        key: 'ARIZA',
        label: 'Arıza',
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400',
        icon: AlertCircle,
      };
    }
    if (c.includes('karantin') || c.includes('quarantine')) {
      return {
        key: 'KARANTINA',
        label: 'Karantina',
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
        icon: AlertTriangle,
      };
    }
    if (c.includes('dönen') || c.includes('donen') || c.includes('dönüş') || c.includes('donus') || c.includes('iade')) {
      return {
        key: 'SAGLAM_DONEN',
        label: 'Sağlam Dönen',
        bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dot: 'bg-cyan-400',
        icon: RotateCcw,
      };
    }
    if (c.includes('sağlam') || c.includes('saglam') || c.includes('ok') || c.includes('iyi') || c.includes('faal') || c.includes('çalışır')) {
      return {
        key: 'SAGLAM',
        label: 'Sağlam',
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400',
        icon: CheckCircle2,
      };
    }
    return {
      key: 'DIGER',
      label: rawCondition || 'Sağlam',
      bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400',
      icon: Tag,
    };
  };

  // Security & Filtering: ONLY devices assigned to the logged-in technical user
  const myDevices = devices.filter(d => {
    if (!currentUser) return false;

    // Check exact assignment
    const idMatch = d.assignedPersonnelId === currentUser.id;
    const nameMatch =
      Boolean(d.assignedPersonnelName) &&
      Boolean(currentUser.name) &&
      d.assignedPersonnelName!.toLowerCase().includes(currentUser.name.toLowerCase());

    // Role-level match for Teknik department devices
    const isTeknikDept =
      currentUser.role === 'TEKNIK' &&
      d.status === 'TEKNIKTE' &&
      (d.assignedPersonnelId === 'usr-teknik' ||
        !d.assignedPersonnelId ||
        (Boolean(d.assignedPersonnelName) &&
          d.assignedPersonnelName!.toLowerCase().includes('teknik')));

    const isMine = idMatch || nameMatch || isTeknikDept;

    // Only devices currently in technical possession
    return isMine && d.status === 'TEKNIKTE';
  });

  // Filtered devices based on user query & status filter
  const filteredDevices = myDevices.filter(d => {
    const badge = getDeviceConditionBadge(d.condition);

    if (selectedStatusFilter !== 'ALL') {
      if (selectedStatusFilter === 'ARIZA' && badge.key !== 'ARIZA') return false;
      if (selectedStatusFilter === 'KARANTINA' && badge.key !== 'KARANTINA') return false;
      if (selectedStatusFilter === 'SAGLAM_DONEN' && badge.key !== 'SAGLAM_DONEN') return false;
      if (selectedStatusFilter === 'SAGLAM' && badge.key !== 'SAGLAM') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSN = d.serialNumber.toLowerCase().includes(q);
      const matchName = d.name.toLowerCase().includes(q);
      const matchModel = d.model.toLowerCase().includes(q);
      const matchCode = d.itemCode.toLowerCase().includes(q);
      const matchNotes = (d.notes || d.technicalNotes || '').toLowerCase().includes(q);
      const matchCondition = badge.label.toLowerCase().includes(q);
      return matchSN || matchName || matchModel || matchCode || matchNotes || matchCondition;
    }

    return true;
  });

  // Open Return / Dispatch Modal
  const handleOpenReturnModal = (device: Device) => {
    setReturnModalDevice(device);
    const badge = getDeviceConditionBadge(device.condition);
    let defaultReason = 'Teknik servis işlemleri biten cihaz depoya teslim ediliyor.';
    if (badge.key === 'ARIZA') {
      defaultReason = 'Arızalı cihaz teknik inceleme sonrası depoya geri sevk ediliyor.';
    } else if (badge.key === 'KARANTINA') {
      defaultReason = 'Karantinadaki cihaz depoya geri sevk ediliyor.';
    } else if (badge.key === 'SAGLAM_DONEN') {
      defaultReason = 'Sağlam dönen cihaz kontrolleri tamamlanarak depoya teslim ediliyor.';
    } else if (badge.key === 'SAGLAM') {
      defaultReason = 'Sağlam cihaz depoya teslim ediliyor.';
    }
    setReturnNote(defaultReason);
  };

  // Submit Return to Warehouse
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalDevice) return;

    const operatorName = currentUser?.name || 'Teknik Servis';
    const cleanNote = returnNote.trim() || 'Teknik servisten depoya iade/sevk gönderildi.';
    const badge = getDeviceConditionBadge(returnModalDevice.condition);

    // Create return request
    createReturnRequest(returnModalDevice.serialNumber, cleanNote);

    // Live Notification for Depo
    addNotification({
      type: 'RETURN_SUBMITTED',
      actorName: operatorName,
      actorRole: 'Teknik Servis',
      title: `${operatorName} depoya sevk gönderdi: ${returnModalDevice.serialNumber}`,
      description: `${returnModalDevice.name} cihazı (${badge.label}) teknik servisten depoya teslim onayına gönderildi. Not: ${cleanNote}`,
      linkTab: 'returns',
    });

    showToast(`"${returnModalDevice.serialNumber}" depoya iade onay kuyruğuna gönderildi.`);
    setReturnModalDevice(null);
  };

  // Counters for Quick Status Filter (reflecting exact Excel statüs)
  const countAriza = myDevices.filter(d => getDeviceConditionBadge(d.condition).key === 'ARIZA').length;
  const countKarantina = myDevices.filter(d => getDeviceConditionBadge(d.condition).key === 'KARANTINA').length;
  const countSaglamDonen = myDevices.filter(d => getDeviceConditionBadge(d.condition).key === 'SAGLAM_DONEN').length;
  const countSaglam = myDevices.filter(d => getDeviceConditionBadge(d.condition).key === 'SAGLAM').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-toolbox text-amber-400"></i>
              Teknik Servis Zimmet Masası
            </span>
            <span className="text-xs text-slate-400">
              Oturum: <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.roleTitle})
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Üzerimdeki Cihazlar</span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-amber-400">
              {myDevices.length} Cihaz
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Yalnızca üzerinize zimmetli cihazlar listelenir. Cihazların işlem statüsü yüklenen stok Excel dosyasındaki durumuna göre (Arıza, Karantina, Sağlam, Sağlam Dönen) otomatik olarak görüntülenir.
          </p>
        </div>

        {/* Quick Link to Package Approvals */}
        <button
          onClick={() => setActiveTab('package_approvals')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-auto shrink-0"
        >
          <Boxes className="w-4 h-4 text-amber-400" />
          <span>Gelen Malzeme Paketleri</span>
        </button>
      </div>

      {/* Statistics Cards Based on Excel Conditions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            Toplam Zimmet
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{myDevices.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">Aktif</span>
          </div>
        </div>

        {/* Arıza */}
        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'ARIZA' ? 'ALL' : 'ARIZA')}
          className={`bg-slate-900/90 border rounded-2xl p-4 shadow-sm space-y-1 cursor-pointer transition ${
            selectedStatusFilter === 'ARIZA'
              ? 'border-rose-500 ring-2 ring-rose-500/30'
              : 'border-slate-800 hover:border-rose-500/50'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-400 block uppercase tracking-wider">
            Arıza
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-300">{countAriza}</span>
            <span className="text-[10px] text-rose-400/80 font-mono">Arızalı</span>
          </div>
        </div>

        {/* Karantina */}
        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'KARANTINA' ? 'ALL' : 'KARANTINA')}
          className={`bg-slate-900/90 border rounded-2xl p-4 shadow-sm space-y-1 cursor-pointer transition ${
            selectedStatusFilter === 'KARANTINA'
              ? 'border-amber-500 ring-2 ring-amber-500/30'
              : 'border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-400 block uppercase tracking-wider">
            Karantina
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300">{countKarantina}</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Karantinada</span>
          </div>
        </div>

        {/* Sağlam Dönen */}
        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'SAGLAM_DONEN' ? 'ALL' : 'SAGLAM_DONEN')}
          className={`bg-slate-900/90 border rounded-2xl p-4 shadow-sm space-y-1 cursor-pointer transition ${
            selectedStatusFilter === 'SAGLAM_DONEN'
              ? 'border-cyan-500 ring-2 ring-cyan-500/30'
              : 'border-slate-800 hover:border-cyan-500/50'
          }`}
        >
          <span className="text-[11px] font-bold text-cyan-400 block uppercase tracking-wider">
            Sağlam Dönen
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-300">{countSaglamDonen}</span>
            <span className="text-[10px] text-cyan-400/80 font-mono">İade / Dönen</span>
          </div>
        </div>

        {/* Sağlam */}
        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'SAGLAM' ? 'ALL' : 'SAGLAM')}
          className={`bg-slate-900/90 border rounded-2xl p-4 shadow-sm space-y-1 col-span-2 sm:col-span-1 cursor-pointer transition ${
            selectedStatusFilter === 'SAGLAM'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
              : 'border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
            Sağlam
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-300">{countSaglam}</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">Kullanıma Hazır</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Seri numarası, model, kalem kodu veya statü ile ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Status Filter Tabs (Excel Statüleri) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'ALL', label: `Tümü (${myDevices.length})` },
              { id: 'ARIZA', label: `Arıza (${countAriza})` },
              { id: 'KARANTINA', label: `Karantina (${countKarantina})` },
              { id: 'SAGLAM_DONEN', label: `Sağlam Dönen (${countSaglamDonen})` },
              { id: 'SAGLAM', label: `Sağlam (${countSaglam})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                  selectedStatusFilter === f.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Device Table / Cards */}
      {myDevices.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Wrench className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-black text-white">
              Şu anda üzerinize kayıtlı zimmetli cihaz bulunmamaktadır.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Depodan tarafınıza malzeme sevk edildiğinde <strong>Malzeme Onay</strong> sekmesinden sepeti kabul ederek cihazları anında zimmetinize alabilirsiniz.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('package_approvals')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Boxes className="w-4 h-4" />
            <span>Gelen Paketleri İncele & Kabul Et</span>
          </button>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-xl space-y-2">
          <Search className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">Aramanıza Uygun Cihaz Bulunamadı</h4>
          <p className="text-xs text-slate-400">
            Arama filtrenizi temizleyerek tüm zimmetli cihazlarınızı listeleyebilirsiniz.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatusFilter('ALL');
            }}
            className="text-xs font-bold text-amber-400 hover:underline cursor-pointer pt-2 inline-block"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevices.map((dev, idx) => {
            const conditionBadge = getDeviceConditionBadge(dev.condition);
            const isCopied = copiedSerial === dev.serialNumber;
            const ConditionIcon = conditionBadge.icon;

            return (
              <div
                key={`${dev.id}-${idx}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-3xl p-5 shadow-lg transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Device Info & Serial */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Serial Number with Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopySerial(dev.serialNumber)}
                      title="Seri Numarasını Kopyala"
                      className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition cursor-pointer group ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950 text-amber-400 border-amber-500/30 hover:border-amber-400'
                      }`}
                    >
                      <span>{dev.serialNumber}</span>
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition" />
                      )}
                    </button>

                    {/* Excel Condition / Statü Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${conditionBadge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${conditionBadge.dot}`} />
                      <ConditionIcon className="w-3 h-3" />
                      <span>{conditionBadge.label}</span>
                    </span>

                    {/* Category / Hardware Type */}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-800">
                      {dev.category}
                    </span>

                    {dev.isSecondaryHardware && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-800/40">
                        2. Donanım
                      </span>
                    )}
                  </div>

                  {/* Device Name and Model */}
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{dev.name}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({dev.model})
                      </span>
                    </h3>
                  </div>

                  {/* Metadata Bar */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Zimmet Tarihi:{' '}
                        <strong className="text-slate-300">
                          {dev.assignedDate || dev.createdAt || 'Kayıtlı'}
                        </strong>
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Kalem Kodu:{' '}
                        <strong className="text-slate-300 font-mono">
                          {dev.itemCode}
                        </strong>
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Konum:{' '}
                        <strong className="text-slate-300">
                          {dev.shelfLocation || 'Teknik Servis Masası'}
                        </strong>
                      </span>
                    </span>
                  </div>

                  {/* Note / Fault Description */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3 text-amber-400" />
                      Cihaza Ait Not / Arıza Açıklaması:
                    </span>
                    <p className="leading-relaxed">
                      {dev.notes || dev.technicalNotes || (
                        <span className="text-slate-500 italic">
                          Excel veya depo kaydında ek açıklama girilmemiş.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Action Button (Only Depoya İade / Sevk) */}
                <div className="flex flex-row lg:flex-col items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenReturnModal(dev)}
                    className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-600/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>Depoya İade / Sevke Gönder</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Depoya İade / Sevke Gönder */}
      {returnModalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                <span>Depoya İade / Sevk Başlat</span>
              </h3>
              <button
                type="button"
                onClick={() => setReturnModalDevice(null)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Seri Numarası:</span>
                <span className="font-mono font-bold text-amber-400">
                  {returnModalDevice.serialNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cihaz:</span>
                <span className="text-white font-medium">
                  {returnModalDevice.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Excel / Cihaz Statüsü:</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getDeviceConditionBadge(returnModalDevice.condition).bg}`}>
                  {getDeviceConditionBadge(returnModalDevice.condition).label}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Depoya Sevk / İade Açıklaması
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="İşlemi biten veya sevk edilecek cihaz hakkında not..."
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs placeholder:text-slate-600"
                />
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200/90 leading-relaxed">
                Bu işlemle cihaz üzerinizdeki aktif teknik servis zimmetinden çıkarılır, depoya sevk kuyruğuna alınır ve depo yetkilisine anlık bildirim iletilir.
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalDevice(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold transition cursor-pointer shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Depoya Sevki Başlat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
