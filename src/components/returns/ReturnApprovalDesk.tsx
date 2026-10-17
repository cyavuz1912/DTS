import React, { useState, useRef } from 'react';
import { useWarehouse, deduplicateById } from '../../context/WarehouseContext';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  Trash2,
  Barcode,
  Layers,
  Send,
  ClipboardPaste,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

export const ReturnApprovalDesk: React.FC = () => {
  const {
    returnRequests,
    acceptReturnRequest,
    rejectReturnRequest,
    createBulkReturnRequests,
    devices,
    currentUser,
  } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'CREATE' | 'PROCESSED'>('PENDING');

  // Input Mode: 'SINGLE' (Barcode / Single serial) vs 'BULK' (Multi-line paste for 20+ devices)
  const [entryMode, setEntryMode] = useState<'SINGLE' | 'BULK'>('SINGLE');

  // Serial Numbers Entry State
  const [currentSerialInput, setCurrentSerialInput] = useState('');
  const [serialList, setSerialList] = useState<string[]>([]);
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const serialInputRef = useRef<HTMLInputElement>(null);

  // Filtered requests (ensured deduplicated by id)
  const pendingRequests = deduplicateById(returnRequests.filter(r => r.status === 'BEKLEMEDE'));
  const processedRequests = deduplicateById(returnRequests.filter(r => r.status !== 'BEKLEMEDE'));

  // Parse bulk text into clean unique array
  const parseBulkSerials = (raw: string): string[] => {
    return raw
      .split(/[\r\n,;\s\t]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
  };

  const parsedBulkSerials = parseBulkSerials(bulkTextInput);

  // Calculate total count of serials ready to be submitted
  const getAllPendingSerials = (): string[] => {
    const list = [...serialList];

    // If in single mode and user typed something in the input
    if (currentSerialInput.trim()) {
      const cleanSingle = currentSerialInput.trim().toUpperCase();
      if (!list.includes(cleanSingle)) {
        list.push(cleanSingle);
      }
    }

    // If in bulk mode and user pasted text in the textarea
    if (entryMode === 'BULK' && parsedBulkSerials.length > 0) {
      parsedBulkSerials.forEach(sn => {
        if (!list.includes(sn)) {
          list.push(sn);
        }
      });
    }

    return list;
  };

  const allPendingSerials = getAllPendingSerials();
  const totalCountToSubmit = allPendingSerials.length;

  // Helper to add single serial to queue
  const handleAddSingleSerial = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = currentSerialInput.trim().toUpperCase();
    if (!clean) return;

    if (serialList.includes(clean)) {
      setFeedbackMsg(`⚠️ "${clean}" seri numarası zaten listede ekli!`);
      setTimeout(() => setFeedbackMsg(null), 2000);
      setCurrentSerialInput('');
      return;
    }

    setSerialList(prev => [...prev, clean]);
    setCurrentSerialInput('');
    serialInputRef.current?.focus();
  };

  // Helper to append bulk parsed text to the list
  const handleTransferBulkToList = () => {
    if (parsedBulkSerials.length === 0) return;

    const newSerials = parsedBulkSerials.filter(s => !serialList.includes(s));
    if (newSerials.length === 0) {
      setFeedbackMsg('⚠️ Yapıştırılan tüm seri numaraları zaten listede mevcut.');
      setTimeout(() => setFeedbackMsg(null), 2500);
      return;
    }

    setSerialList(prev => [...prev, ...newSerials]);
    setBulkTextInput('');
    setFeedbackMsg(`✓ ${newSerials.length} adet seri numarası listeye eklendi.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleRemoveSerial = (snToRemove: string) => {
    setSerialList(prev => prev.filter(sn => sn !== snToRemove));
  };

  const handleClearAllSerials = () => {
    setSerialList([]);
    setCurrentSerialInput('');
    setBulkTextInput('');
  };

  // Quick helper to fill sample serials for testing 20 items
  const handleLoadSampleSerials = () => {
    const samples = Array.from({ length: 20 }, (_, i) => `SN-RET-${1000 + i}`);
    setBulkTextInput(samples.join('\n'));
    setEntryMode('BULK');
    setFeedbackMsg('✓ Örnek 20 adet seri numarası alana yüklendi.');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Submit all serials to warehouse approval queue
  const handleCreateReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetSerials = getAllPendingSerials();

    if (targetSerials.length === 0) {
      setFeedbackMsg('⚠️ Lütfen en az bir seri numarası yazınız veya yapıştırınız!');
      setTimeout(() => setFeedbackMsg(null), 2500);
      return;
    }

    const noteToSave = returnNotes.trim() || 'Ön Ofis iade bildirimi.';
    const count = createBulkReturnRequests(targetSerials, noteToSave);

    if (count > 0) {
      setFeedbackMsg(`🎉 Başarılı! ${count} adet cihaz iade onayı için depoya gönderildi!`);
      setSerialList([]);
      setCurrentSerialInput('');
      setBulkTextInput('');
      setReturnNotes('');
      setTimeout(() => {
        setFeedbackMsg(null);
        if (!isOnOffis) setActiveTab('PENDING');
      }, 2500);
    }
  };

  const handleAccept = (reqId: string) => {
    acceptReturnRequest(reqId, 'Fiziksel kontroller tamamlandı. Cihaz sağlam olarak depoya alındı.');
  };

  const handleReject = (reqId: string) => {
    const reason = prompt('Lütfen iade reddetme gerekçesini giriniz:');
    if (reason) {
      rejectReturnRequest(reqId, reason);
    }
  };

  const canApprove = currentUser?.role === 'DEPO';
  const isOnOffis = currentUser?.role === 'ONOFIS';
  const isTeknik = currentUser?.role === 'TEKNIK';

  // -------------------------------------------------------------
  // DEDICATED VIEW FOR ÖN OFİS: ONLY "İade Onaya Gönder"
  // -------------------------------------------------------------
  if (isOnOffis) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Title Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <i className="fa-solid fa-headset"></i>
                Ön Ofis Masası
              </span>
              <span className="text-xs text-slate-400">
                Kullanıcı: <strong className="text-white">{currentUser?.name}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>İade Onaya Gönder</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Cihaz seçmenize gerek yoktur; sadece seri numarasını yazıp (veya 20'li toplu yapıştırıp) depo onayına gönderebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right bg-slate-950/70 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                Gönderilen Talepler
              </span>
              <span className="text-xl font-black text-emerald-400">
                {returnRequests.length} Adet
              </span>
            </div>
          </div>
        </div>

        {/* Ön Ofis Single Dedicated Form & Live Approval Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: İade Onaya Gönder (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold shadow-inner">
                  <i className="fa-solid fa-arrow-rotate-left"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Seri No ile İade Gönderimi</h3>
                  <p className="text-[11px] text-slate-400">
                    Sadece seri no yazın ve yollayın (Tek tek veya 20+ toplu)
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                Giriş: {currentUser?.name}
              </span>
            </div>

            {feedbackMsg && (
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateReturnSubmit} className="space-y-4 text-xs">
              {/* Mode Selection Tabs (Tekil / Barkod vs Toplu Seri No Girişi) */}
              <div className="flex items-center justify-between gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEntryMode('SINGLE')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    entryMode === 'SINGLE'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Tekil / Barkod Okutma</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode('BULK')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    entryMode === 'BULK'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Toplu Seri No Yapıştır (20+ Cihaz)</span>
                </button>
              </div>

              {/* Mode 1: Single Barcode / Serial Number Entry */}
              {entryMode === 'SINGLE' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-300 block">
                    Cihaz Seri Numarası <span className="text-emerald-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        ref={serialInputRef}
                        type="text"
                        placeholder="Seri no yazıp Enter'a basın veya barkod okutun..."
                        value={currentSerialInput}
                        onChange={e => setCurrentSerialInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSingleSerial();
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSingleSerial()}
                      disabled={!currentSerialInput.trim()}
                      className={`px-4 py-2.5 rounded-2xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        currentSerialInput.trim()
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ekle</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 İster 'Ekle' ile listeye ekleyip biriktirin, ister seri numarasını yazıp doğrudan aşağıdaki butona basın.
                  </p>
                </div>
              )}

              {/* Mode 2: Bulk Multi-Line Serial Number Paste */}
              {entryMode === 'BULK' && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-300 font-bold block">
                        Toplu Seri Numaraları Yapıştır
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Excel'den kopyalayıp alt alta, boşlukla veya virgülle yapıştırabilirsiniz
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    placeholder="Örnek:&#10;SN-MOD-88201&#10;SN-MOD-88202&#10;SN-MOD-88203&#10;SN-STB-99104&#10;SN-WIFI-55205..."
                    value={bulkTextInput}
                    onChange={e => setBulkTextInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-slate-300">
                      Algılanan Seri: <strong className="text-emerald-400">{parsedBulkSerials.length} Adet</strong>
                    </span>

                    {parsedBulkSerials.length > 0 && (
                      <button
                        type="button"
                        onClick={handleTransferBulkToList}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Listeye Aktar ({parsedBulkSerials.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Queued Serials Tags / Badges */}
              {serialList.length > 0 && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>Hazırlanan İade Listesi ({serialList.length} Cihaz)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllSerials}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Tümünü Temizle
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                    {serialList.map(sn => {
                      const match = devices.find(d => d.serialNumber.toUpperCase() === sn);

                      return (
                        <div
                          key={sn}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl font-mono text-[11px] flex items-center gap-1.5 text-white"
                        >
                          <span className="text-emerald-400 font-bold">{sn}</span>
                          {match ? (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-sans truncate max-w-[110px]">
                              {match.name}
                            </span>
                          ) : (
                            <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1 py-0.2 rounded font-sans">
                              Yeni
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSerial(sn)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Note input (Optional) */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Açıklama / Not <span className="text-slate-500 font-normal text-[11px]">(İsteğe bağlı)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Varsa iade notu veya açıklama yazınız..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={totalCountToSubmit === 0}
                className={`w-full py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  totalCountToSubmit > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {totalCountToSubmit > 1
                    ? `Toplu İadeyi Depo Onayına Gönder (${totalCountToSubmit} Cihaz)`
                    : 'İadeyi Depo Onayına Gönder'}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Submitted Return Requests Status (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Gönderilen İade Talepleri</h3>
                <p className="text-[11px] text-slate-400">Deponun onay durumu canlı takibi</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {returnRequests.length} Kayıt
              </span>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {returnRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  Henüz gönderilmiş bir iade talebi bulunmamaktadır.
                </div>
              ) : (
                deduplicateById(returnRequests).map((req, idx) => {
                  const statusBadge = {
                    BEKLEMEDE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    KABUL_EDILDI: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    REDDEDILDI: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                  }[req.status];

                  const statusText = {
                    BEKLEMEDE: 'Depo Onayı Bekliyor',
                    KABUL_EDILDI: 'Depoya Kabul Edildi',
                    REDDEDILDI: 'Reddedildi',
                  }[req.status];

                  return (
                    <div
                      key={`${req.id}-${idx}`}
                      className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-bold text-emerald-400">{req.serialNumber}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {statusText}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs">{req.deviceName || 'İade Cihazı'}</h4>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>
                          Gönderen: <strong className="text-slate-300">{req.submittedByName}</strong>
                        </span>
                        <span>{req.createdAt}</span>
                      </div>
                      {req.notes && (
                        <p className="text-[10px] text-slate-300 bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <strong>Not:</strong> {req.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEDICATED VIEW FOR TEKNİK: ONLY "Kendi İade Edecekleri & Etmiş Olan Cihazlar"
  // -------------------------------------------------------------
  if (isTeknik) {
    const isTeknikItem = (req: (typeof returnRequests)[0]) => {
      if (!currentUser) return false;
      const matchName =
        req.submittedByName?.toLowerCase().includes('emre') ||
        req.submittedByName?.toLowerCase() === currentUser.name?.toLowerCase();
      const matchRole = req.submittedByRole?.toLowerCase().includes('teknik');
      return matchName || matchRole;
    };

    const myPendingReturns = deduplicateById(
      returnRequests.filter(r => isTeknikItem(r) && r.status === 'BEKLEMEDE')
    );
    const myCompletedReturns = deduplicateById(
      returnRequests.filter(r => isTeknikItem(r) && r.status !== 'BEKLEMEDE')
    );
    const devicesInTeknik = devices.filter(
      d =>
        d.status === 'TEKNIKTE' &&
        !returnRequests.some(
          r => r.serialNumber.toUpperCase() === d.serialNumber.toUpperCase() && r.status === 'BEKLEMEDE'
        )
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Title Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <i className="fa-solid fa-screwdriver-wrench"></i>
                Teknik Servis Masası
              </span>
              <span className="text-xs text-slate-400">
                Kullanıcı: <strong className="text-white">{currentUser?.name}</strong> (Teknik Departmanı)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>İade Cihazlarım</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Bu ekranda yalnızca teknik servise ait <strong>iade edilecek (onay bekleyen)</strong> veya <strong>depoya iadesi tamamlanmış</strong> cihazlar listelenir. Başka bir işlev bulunmamaktadır.
            </p>
          </div>

          {/* Counters */}
          <div className="flex items-center gap-3">
            <div className="text-right bg-slate-950/70 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                İade Edilecek (Bekleyen)
              </span>
              <span className="text-xl font-black text-amber-400">
                {myPendingReturns.length} Adet
              </span>
            </div>
            <div className="text-right bg-slate-950/70 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                İade Edilmiş (Tamamlanan)
              </span>
              <span className="text-xl font-black text-emerald-400">
                {myCompletedReturns.length} Adet
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher for Teknik */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>İade Edilecek Cihazlarım</span>
            {myPendingReturns.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950 text-amber-300 font-black border border-amber-400/40">
                {myPendingReturns.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('PROCESSED')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'PROCESSED'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>İade Edilmiş Cihazlarım</span>
            {myCompletedReturns.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950 text-emerald-300 font-black border border-emerald-400/40">
                {myCompletedReturns.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'CREATE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Yeni İade Talebi Gönder</span>
          </button>
        </div>

        {/* TAB 1: İADE EDİLECEK CİHAZLARIM (Bekleyen İade Talepleri + Teknikteki Cihazlar) */}
        {activeTab === 'PENDING' && (
          <div className="space-y-6">
            {/* Info notice */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">İade Edilecek Cihazlar Bilgisi:</strong> Aşağıdaki cihazlar teknik servis tarafından depoya iade onayı için gönderilmiş olup deponun fiziksel kontrolleri yaparak depoya kabul etmesini beklemektedir. Depo yetkilisi teslim aldığında otomatik olarak <em>'İade Edilmiş Cihazlarım'</em> listesine geçecektir.
              </div>
            </div>

            {/* List of Pending Return Requests for Teknik */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Depo Onayı Bekleyen İade Cihazlarınız
                  </h3>
                  <p className="text-xs text-slate-400">
                    Depo sorumlusu fiziksel kontrollerini tamamlayıp teslim aldığında işlem tamamlanacaktır.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-amber-300 border border-amber-500/20">
                  {myPendingReturns.length} Bekleyen Cihaz
                </span>
              </div>

              {myPendingReturns.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  Şu an depoya gönderilmiş onay bekleyen bir iade talebiniz bulunmamaktadır.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {myPendingReturns.map((req, idx) => (
                    <div
                      key={`${req.id}-${idx}`}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-2xl transition"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-lg">
                            {req.serialNumber}
                          </span>
                          <h4 className="font-bold text-sm text-white truncate">
                            {req.deviceName || 'Teknik Servis Cihazı'}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            İadeyi Gönderen: <strong className="text-slate-300">{req.submittedByName} ({req.submittedByRole})</strong>
                          </span>
                          <span>Gönderim Tarihi: <strong className="text-slate-300">{req.createdAt}</strong></span>
                        </div>

                        {req.notes && (
                          <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-w-2xl">
                            <strong>İade Notu:</strong> {req.notes}
                          </p>
                        )}
                      </div>

                      {/* Pure status display - NO approve buttons! */}
                      <div className="shrink-0 flex items-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          Depo Onayı Bekliyor
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional: Devices currently physically in Teknik department ready to be returned */}
            {devicesInTeknik.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <i className="fa-solid fa-wrench text-amber-400"></i>
                      Teknik Servisteki Cihazlar (İadeye Hazırlanabilir)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Teknik laboratuvarında test veya arızası tamamlanmış ve depoya iade gönderilmeye hazır cihazlar
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                    {devicesInTeknik.length} Cihaz
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {devicesInTeknik.map(dev => (
                    <div
                      key={dev.id}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {dev.serialNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {dev.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-white mt-1">{dev.name}</h4>
                        <span className="text-[10px] text-slate-500 block">
                          Raf: {dev.shelfLocation} • Model: {dev.model}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentSerialInput(dev.serialNumber);
                          setActiveTab('CREATE');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition shadow-md"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>İadeye Gönder</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: İADE EDİLMİŞ CİHAZLARIM (Depoya İadesi Tamamlanan Cihazlar) */}
        {activeTab === 'PROCESSED' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">İade Edilmiş Cihazlar Geçmişi:</strong> Bu ekranda teknik birimi tarafından depoya iadesi tamamlanmış, deponun fiziksel kontrollerini tamamlayıp teslim aldığı cihazların dökümü yer alır.
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Depoya İadesi Tamamlanmış Cihazlarınız
                  </h3>
                  <p className="text-xs text-slate-400">Depo sorumlusu tarafından fiziki kontrolleri yapılıp depoya kabul edilmiş kayıtlar</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-emerald-300 border border-emerald-500/20">
                  {myCompletedReturns.length} Cihaz
                </span>
              </div>

              {myCompletedReturns.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Henüz depoya iadesi tamamlanmış bir cihaz bulunmamaktadır.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {myCompletedReturns.map((req, idx) => {
                    const isAccepted = req.status === 'KABUL_EDILDI';
                    return (
                      <div
                        key={`${req.id}-${idx}`}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-2xl transition"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-white bg-slate-950 border border-slate-700 px-2.5 py-0.5 rounded-lg">
                              {req.serialNumber}
                            </span>
                            <h4 className="font-bold text-sm text-white truncate">
                              {req.deviceName || 'Teknik Servis Cihazı'}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span>Gönderen: <strong className="text-slate-300">{req.submittedByName}</strong></span>
                            <span>İade Gönderim: <strong className="text-slate-300">{req.createdAt}</strong></span>
                            {req.processedAt && (
                              <span>Depoya Kabul Tarihi: <strong className="text-emerald-400">{req.processedAt}</strong></span>
                            )}
                            {req.processedBy && (
                              <span>Depo Yetkilisi: <strong className="text-slate-300">{req.processedBy}</strong></span>
                            )}
                          </div>

                          {req.notes && (
                            <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-w-2xl">
                              <strong>Not:</strong> {req.notes}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                              isAccepted
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Depoya Kabul Edildi</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>İade Reddedildi</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: YENİ İADE BİLDİRİMİ GÖNDER */}
        {activeTab === 'CREATE' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  Teknik Servis Cihazı İade Bildirimi
                </h3>
                <p className="text-xs text-slate-400">
                  Arızalı veya onarımı tamamlanamayan cihazların seri numarasını yazarak depoya iade talebi oluşturunuz.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                Giriş: {currentUser?.name}
              </span>
            </div>

            {feedbackMsg && (
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateReturnSubmit} className="space-y-4 text-xs">
              {/* Mode Selection */}
              <div className="flex items-center justify-between gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEntryMode('SINGLE')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    entryMode === 'SINGLE'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Tekil / Barkod Okutma</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode('BULK')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    entryMode === 'BULK'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Toplu Seri No Yapıştır</span>
                </button>
              </div>

              {/* Mode 1: Single */}
              {entryMode === 'SINGLE' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-300 block">
                    Cihaz Seri Numarası <span className="text-amber-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        ref={serialInputRef}
                        type="text"
                        placeholder="Seri no yazıp Enter'a basın veya barkod okutun..."
                        value={currentSerialInput}
                        onChange={e => setCurrentSerialInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSingleSerial();
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSingleSerial()}
                      disabled={!currentSerialInput.trim()}
                      className={`px-4 py-2.5 rounded-2xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        currentSerialInput.trim()
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ekle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 2: Bulk */}
              {entryMode === 'BULK' && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-bold">
                      Toplu Seri Numaraları Yapıştır
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    placeholder="Seri numaralarını alt alta yapıştırınız..."
                    value={bulkTextInput}
                    onChange={e => setBulkTextInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-slate-300">
                      Algılanan Seri: <strong className="text-amber-400">{parsedBulkSerials.length} Adet</strong>
                    </span>

                    {parsedBulkSerials.length > 0 && (
                      <button
                        type="button"
                        onClick={handleTransferBulkToList}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Listeye Aktar ({parsedBulkSerials.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Queued Serials Tags */}
              {serialList.length > 0 && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>İade Listesi ({serialList.length} Cihaz)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllSerials}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {serialList.map(sn => (
                      <div
                        key={sn}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl font-mono text-[11px] flex items-center gap-1.5 text-white"
                      >
                        <span className="text-amber-400 font-bold">{sn}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSerial(sn)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Teknik İade Notu / Arıza Açıklaması
                </label>
                <textarea
                  rows={2}
                  placeholder="Arıza sebebi, onarım durumu veya teknik not..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={totalCountToSubmit === 0}
                className={`w-full py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  totalCountToSubmit > 0
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {totalCountToSubmit > 1
                    ? `Toplu İadeyi Depo Onayına Gönder (${totalCountToSubmit} Cihaz)`
                    : 'İadeyi Depo Onayına Gönder'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEPO VIEW: Full Approval Pool & Action Desk (Only Depo role)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-arrow-rotate-left"></i>
              İade & Depoya Kabul Masası
            </span>
            <span className="text-xs text-slate-400">Onay Havuzu & Fiziksel Kabul</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Saha İade Onayları & Depoya Geri Alma
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Ön Ofis ve saha ekiplerinden depoya gönderilen iade cihazları fiziksel kontrollerini yapıp tek tıkla depoya kabul edin veya yeni iade kaydı oluşturun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'PENDING'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span>Onay Bekleyenler</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'CREATE'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni İade Talebi Aç</span>
          </button>

          <button
            onClick={() => setActiveTab('PROCESSED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'PROCESSED'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            İade Geçmişi ({processedRequests.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Pending Approvals Queue */}
      {activeTab === 'PENDING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Depoya Kabul Bekleyen İade Cihazlar Havuzu
              </h3>
              <p className="text-xs text-slate-400">
                Depo yetkilisi fiziki kontrolleri (adaptör, kumanda, kutu, seri no) tamamladıktan sonra kabul onayını verir.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
              {pendingRequests.length} Cihaz Beklemede
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/40 mb-2" />
              Şu an onay bekleyen herhangi bir iade cihaz bulunmamaktadır.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingRequests.map((req, idx) => (
                <div
                  key={`${req.id}-${idx}`}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 px-2 rounded-2xl transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2.5 py-0.5 rounded-lg">
                        {req.serialNumber}
                      </span>
                      <h4 className="font-bold text-sm text-white">{req.deviceName || 'İade Cihazı'}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        İadeyi Gönderen: <strong className="text-slate-200">{req.submittedByName} ({req.submittedByRole})</strong>
                      </span>
                      <span>Talep Tarihi: {req.createdAt}</span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-1 max-w-2xl">
                        <strong>Not:</strong> {req.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {canApprove ? (
                      <>
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Kabul Et (Depoya Al)</span>
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reddet</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic bg-slate-800 px-3 py-1 rounded-xl">
                        Onay Yetkisi: Depo / Teknik
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Create New Return Form */}
      {activeTab === 'CREATE' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Saha / Müşteri İade Talebi Oluştur
            </h3>
            <p className="text-xs text-slate-400">
              Cihaz seçmeden doğrudan seri numarasını yazarak veya toplu yapıştırarak depoya iade talebi oluşturunuz.
            </p>
          </div>

          {feedbackMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
              {feedbackMsg}
            </div>
          )}

          <form onSubmit={handleCreateReturnSubmit} className="space-y-4 text-xs">
            {/* Mode Selection Tabs */}
            <div className="flex items-center justify-between gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setEntryMode('SINGLE')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                  entryMode === 'SINGLE'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Tekil / Barkod Okutma</span>
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('BULK')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                  entryMode === 'BULK'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Toplu Seri No Yapıştır (20+ Cihaz)</span>
              </button>
            </div>

            {/* Mode 1: Single Barcode / Serial Number Entry */}
            {entryMode === 'SINGLE' && (
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block">
                  Cihaz Seri Numarası <span className="text-indigo-400">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      ref={serialInputRef}
                      type="text"
                      placeholder="Seri no yazıp Enter'a basın veya barkod okutun..."
                      value={currentSerialInput}
                      onChange={e => setCurrentSerialInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSingleSerial();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSingleSerial()}
                    disabled={!currentSerialInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Bulk Multi-Line Serial Number Paste */}
            {entryMode === 'BULK' && (
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-300 font-bold">
                    Toplu Seri Numaraları Yapıştır
                  </span>
                </div>

                <textarea
                  rows={5}
                  placeholder="Seri numaralarını alt alta yapıştırınız..."
                  value={bulkTextInput}
                  onChange={e => setBulkTextInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    Algılanan Seri: <strong className="text-indigo-400">{parsedBulkSerials.length} Adet</strong>
                  </span>

                  {parsedBulkSerials.length > 0 && (
                    <button
                      type="button"
                      onClick={handleTransferBulkToList}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Listeye Aktar ({parsedBulkSerials.length})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Queued Serials Tags */}
            {serialList.length > 0 && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Listelenen Seriler ({serialList.length})</span>
                  <button
                    type="button"
                    onClick={handleClearAllSerials}
                    className="text-[10px] text-rose-400 font-bold cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {serialList.map(sn => (
                    <span
                      key={sn}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-indigo-400 font-mono text-xs flex items-center gap-1"
                    >
                      {sn}
                      <button
                        type="button"
                        onClick={() => handleRemoveSerial(sn)}
                        className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Not <span className="text-slate-500 font-normal text-[11px]">(İsteğe bağlı)</span>
              </label>
              <textarea
                rows={2}
                placeholder="İade notu ve açıklamayı yazınız..."
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={totalCountToSubmit === 0}
              className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer ${
                totalCountToSubmit === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {totalCountToSubmit > 1
                  ? `İade Talebini Depo Onay Havuzuna Gönder (${totalCountToSubmit} Cihaz)`
                  : 'İade Talebini Depo Onay Havuzuna Gönder'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Processed Returns History */}
      {activeTab === 'PROCESSED' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-base text-white pb-2 border-b border-slate-800">
            Sonuçlanan İade Hareketleri
          </h3>

          <div className="divide-y divide-slate-800 text-xs">
            {processedRequests.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">Henüz sonuçlanmış bir iade işlemi bulunmuyor.</p>
            ) : (
              processedRequests.map((req, idx) => (
                <div key={`${req.id}-${idx}`} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{req.serialNumber}</span>
                      <span className="text-slate-400">• {req.deviceName || 'İade Cihazı'}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Gönderen: {req.submittedByName} ({req.submittedByRole}) • Onaylayan: {req.processedBy} ({req.processedAt})
                    </div>
                    {req.notes && (
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Not: {req.notes}
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                      req.status === 'KABUL_EDILDI'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {req.status === 'KABUL_EDILDI' ? '✓ Depoya Kabul Edildi' : '✕ Reddedildi'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
