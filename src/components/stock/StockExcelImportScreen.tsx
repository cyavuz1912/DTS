import React, { useState, useRef } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { StockExcelScanResult, StockExcelApplySummary, StockExcelRow } from '../../types';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Database,
  Info,
  Check,
  X,
  RefreshCw,
  FolderUp,
} from 'lucide-react';

export const StockExcelImportScreen: React.FC = () => {
  const {
    scanStockExcelFile,
    applyStockExcelUpdates,
    downloadStockExcelTemplate,
    createSampleStockExcelFile,
    currentUser,
    setActiveTab,
  } = useWarehouse();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<StockExcelScanResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEW' | 'UPDATE' | 'NO_CHANGE' | 'INVALID'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySummary, setApplySummary] = useState<StockExcelApplySummary | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setScanResult(null);
    setApplySummary(null);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Scan & analyze file
  const handleScanFile = async (fileToScan?: File) => {
    const targetFile = fileToScan || selectedFile;
    if (!targetFile) return;

    setIsScanning(true);
    setApplySummary(null);

    try {
      // Small artificial timeout to allow UI animation
      await new Promise(r => setTimeout(r, 400));
      const result = await scanStockExcelFile(targetFile);
      setScanResult(result);
    } catch (err: any) {
      alert(`Excel taranırken hata oluştu: ${err?.message || 'Geçerli bir Excel dosyası yükleyiniz.'}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Apply updates to warehouse database
  const handleApplyUpdates = () => {
    if (!scanResult) return;
    setIsApplying(true);

    try {
      const summary = applyStockExcelUpdates(scanResult);
      setApplySummary(summary);
      setScanResult(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert(`Güncelleme uygulanırken hata oluştu: ${err?.message || 'Lütfen tekrar deneyiniz.'}`);
    } finally {
      setIsApplying(false);
    }
  };

  // Reset view to scan a new file
  const handleReset = () => {
    setSelectedFile(null);
    setScanResult(null);
    setApplySummary(null);
    setSearchTerm('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter scanned rows
  const filteredRows = scanResult?.rows.filter(row => {
    if (activeFilter === 'NEW' && row.actionType !== 'NEW') return false;
    if (activeFilter === 'UPDATE' && row.actionType !== 'UPDATE') return false;
    if (activeFilter === 'NO_CHANGE' && row.actionType !== 'NO_CHANGE') return false;
    if (activeFilter === 'INVALID' && row.actionType !== 'INVALID') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchSN = row.serialNumber.toLowerCase().includes(q);
      const matchName = row.name.toLowerCase().includes(q);
      const matchItemCode = row.itemCode.toLowerCase().includes(q);
      const matchModel = row.model.toLowerCase().includes(q);
      const matchShelf = row.shelfLocation.toLowerCase().includes(q);
      return matchSN || matchName || matchItemCode || matchModel || matchShelf;
    }

    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Depo Stok Entegrasyonu
            </span>
            <span className="text-xs text-slate-400">
              İşlem Yapan: <strong className="text-white">{currentUser?.name}</strong>
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Excel ile Stok Yükleme, Tarama & Bilgi Güncelleme</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Tedarikçiden veya merkezden gelen stok Excel dosyasını yükleyin. Sistem otomatik olarak tüm cihazları tarar; yeni olanları depoya kaydeder, kayıtlı olanların ise raf konumu, model ve kalem kodlarını anında günceller.
          </p>
        </div>

        {/* Quick Template Download Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={downloadStockExcelTemplate}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm hover:text-white"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Stok Şablonu İndir (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Success Summary View (After Updates Applied) */}
      {applySummary && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                Excel Stok Yükleme Özeti
              </h3>
              <p className="text-xs text-emerald-200">
                Excel dosyasındaki veriler başarıyla taranarak sistem kayıtları ile eşleştirildi ve güncellendi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-black text-lg">
                📊
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-bold uppercase">Genel İşlem</span>
                <span className="text-base sm:text-lg font-black text-white">Toplam {applySummary.totalProcessed} satır işlendi.</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-indigo-500/30 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-lg">
                ✔
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-bold uppercase">Mevcut Cihazlar</span>
                <span className="text-base sm:text-lg font-black text-indigo-400">✔ {applySummary.updatedCount} adet mevcut cihaz güncellendi.</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg">
                ➕
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-bold uppercase">Yeni Kayıtlar</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">➕ {applySummary.newAddedCount} adet yeni cihaz eklendi.</span>
              </div>
            </div>
          </div>

          {/* Status Changes List if any */}
          {applySummary.statusChanges && applySummary.statusChanges.length > 0 && (
            <div className="mt-3 p-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Durum Değişikliği Olan Cihazlar ({applySummary.statusChanges.length} Cihaz)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto">
                {applySummary.statusChanges.map((change, cIdx) => (
                  <div
                    key={`${change.serialNumber}-${cIdx}`}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-mono font-bold text-white truncate text-[11px]">
                        {change.serialNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {change.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {change.oldCondition}
                      </span>
                      <span className="text-indigo-400 font-black">➔</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {change.newCondition}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('devices')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>Cihaz Sorgulama & Künyeye Git</span>
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Yeni Excel Yükle</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Excel Upload Area */}
      {!scanResult && !applySummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FolderUp className="w-5 h-5 text-indigo-400" />
                1. Adım: Excel Dosyasını Yükleyiniz
              </h3>
              <p className="text-xs text-slate-400">
                Sistem; Seri No, Ürün Adı, Kalem Kodu, Model, Kategori, Statü (Sağlam, Arıza, Karantina, Sağlam Dönen) ve Raf Konumu sütunlarını otomatik olarak tanır.
              </p>
            </div>

            <span className="text-[11px] font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              Format: .xlsx, .xls, .csv
            </span>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-indigo-400 bg-indigo-950/30'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition shadow-lg ${
              selectedFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-600/20 text-indigo-400'
            }`}>
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <span className="text-sm font-bold text-white block">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-400 block font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Dosya Seçildi
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold inline-block mt-1">
                  ✓ Taramaya hazır. Değiştirmek için tıklayınız.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-sm font-bold text-white block">
                  Excel dosyasını sürükleyip buraya bırakın veya bilgisayarınızdan seçin
                </span>
                <span className="text-xs text-slate-400 block">
                  Microsoft Excel (.xlsx, .xls) veya CSV formatları desteklenmektedir
                </span>
              </div>
            )}
          </div>

          {/* Scan Action Button */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Dosyayı taradıktan sonra tüm değişiklikleri onayınız için tablo halinde listeleyecektir.</span>
            </div>

            <button
              type="button"
              onClick={() => handleScanFile()}
              disabled={!selectedFile || isScanning}
              className={`px-6 py-3 rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-lg cursor-pointer ${
                selectedFile && !isScanning
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                  <span>Excel Taranıyor & Karşılaştırılıyor...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Exceli Tara & Bilgileri Analiz Et</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Scanned Dashboard & Comparison Review Table */}
      {scanResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Scan Result Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Total */}
            <div
              onClick={() => setActiveFilter('ALL')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam Satır</span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-xl font-black text-white">{scanResult.totalRows} Adet</span>
              <span className="text-[10px] text-slate-500 block">Taranan satır</span>
            </div>

            {/* New Devices */}
            <div
              onClick={() => setActiveFilter('NEW')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                activeFilter === 'NEW'
                  ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Yeni Stoklar</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-xl font-black text-emerald-400">+{scanResult.newCount} Adet</span>
              <span className="text-[10px] text-emerald-300/80 block">Depoya eklenecek</span>
            </div>

            {/* Updated Devices */}
            <div
              onClick={() => setActiveFilter('UPDATE')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                activeFilter === 'UPDATE'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Güncellenecek</span>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-xl font-black text-indigo-400">{scanResult.updateCount} Adet</span>
              <span className="text-[10px] text-indigo-300/80 block">Raf/Model değişecek</span>
            </div>

            {/* Unchanged Devices */}
            <div
              onClick={() => setActiveFilter('NO_CHANGE')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                activeFilter === 'NO_CHANGE'
                  ? 'bg-slate-800 border-slate-600 ring-2 ring-slate-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Değişmeyenler</span>
                <Check className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="text-xl font-black text-slate-300">{scanResult.noChangeCount} Adet</span>
              <span className="text-[10px] text-slate-500 block">Zaten en güncel</span>
            </div>

            {/* Invalid Rows */}
            <div
              onClick={() => setActiveFilter('INVALID')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                activeFilter === 'INVALID'
                  ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Hatalı Satır</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-xl font-black text-rose-400">{scanResult.invalidCount} Satır</span>
              <span className="text-[10px] text-rose-300/80 block">Seri no eksik</span>
            </div>
          </div>

          {/* Action Bar: Confirm & Apply Updates */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-400 font-semibold">Taranan Dosya: <strong className="text-white font-mono">{scanResult.fileName}</strong></span>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>İşleme Hazır: </span>
                <span className="text-emerald-400">{scanResult.newCount} Yeni Cihaz</span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-400">{scanResult.updateCount} Güncelleme</span>
              </h4>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer border border-slate-700"
              >
                Vazgeç & Yeni Dosya
              </button>

              <button
                type="button"
                onClick={handleApplyUpdates}
                disabled={isApplying || (scanResult.newCount === 0 && scanResult.updateCount === 0)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg cursor-pointer ${
                  scanResult.newCount > 0 || scanResult.updateCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Depo Stoğu Güncelleniyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Taranan Bilgileri Onayla & Depo Stoğunu Güncelle</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Table & Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Tümü ({scanResult.rows.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('NEW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'NEW'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
                  }`}
                >
                  <span>Yeni Eklenecekler</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20">
                    {scanResult.newCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('UPDATE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'UPDATE'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-indigo-400 hover:text-indigo-300 border border-slate-800'
                  }`}
                >
                  <span>Güncellenecekler</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20">
                    {scanResult.updateCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('NO_CHANGE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeFilter === 'NO_CHANGE'
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Değişmeyenler ({scanResult.noChangeCount})
                </button>
              </div>

              {/* Search Inside Scanned Rows */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Seri no, model veya raf ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Rows Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">Satır</th>
                    <th className="py-3 px-3">Seri Numarası</th>
                    <th className="py-3 px-3">Cihaz / Ürün Adı</th>
                    <th className="py-3 px-3">Model</th>
                    <th className="py-3 px-3">Kalem Kodu</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Statü (Excel)</th>
                    <th className="py-3 px-3">Raf Konumu</th>
                    <th className="py-3 px-3">İşlem Türü</th>
                    <th className="py-3 px-3">Tespit Edilen Değişiklikler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                        Seçili filtreye veya arama kriterine uygun cihaz satırı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map(row => {
                      const actionBadge = {
                        NEW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                        UPDATE: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
                        NO_CHANGE: 'bg-slate-800 text-slate-400 border-slate-700',
                        INVALID: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                      }[row.actionType];

                      const actionLabel = {
                        NEW: '🟢 Yeni Stok',
                        UPDATE: '🔵 Bilgi Güncelleme',
                        NO_CHANGE: '⚪ Değişiklik Yok',
                        INVALID: '🔴 Geçersiz',
                      }[row.actionType];

                      const c = (row.condition || 'Sağlam').toLowerCase();
                      let condBadgeCls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                      if (c.includes('arız') || c.includes('ariz') || c.includes('fault') || c.includes('bozuk')) {
                        condBadgeCls = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                      } else if (c.includes('karantin') || c.includes('quarantine')) {
                        condBadgeCls = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                      } else if (c.includes('dönen') || c.includes('donen') || c.includes('iade')) {
                        condBadgeCls = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                      }

                      return (
                        <tr
                          key={`${row.rowNumber}-${row.serialNumber}`}
                          className={`hover:bg-slate-800/30 transition ${
                            row.actionType === 'NEW'
                              ? 'bg-emerald-950/10'
                              : row.actionType === 'UPDATE'
                              ? 'bg-indigo-950/10'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {row.rowNumber}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            {row.serialNumber}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            {row.name}
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                            {row.model}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                            {row.itemCode}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {row.category}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border inline-block ${condBadgeCls}`}>
                              {row.condition || 'Sağlam'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] inline-block">
                                {row.shelfLocation}
                              </span>
                              {row.assignedPersonnelName && (
                                <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                                  <span>👤 {row.assignedPersonnelName}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${actionBadge}`}>
                              {actionLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5 max-w-xs">
                              {row.changeDetails.map((detail, dIdx) => (
                                <span
                                  key={dIdx}
                                  className={`text-[10px] block truncate ${
                                    row.actionType === 'UPDATE'
                                      ? 'text-indigo-300 font-semibold'
                                      : row.actionType === 'NEW'
                                      ? 'text-emerald-300'
                                      : 'text-slate-500'
                                  }`}
                                  title={detail}
                                >
                                  • {detail}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
