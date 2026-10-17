import React, { useState, useRef } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { ReconciliationResult } from '../../types';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  Settings,
  Database,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const ReconciliationScreen: React.FC = () => {
  const {
    devices,
    settings,
    updateSettings,
    reconcileWithExcel,
    applyReconciliation,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDefaults,
    setActiveTab,
    canAccess,
  } = useWarehouse();

  const [isProcessing, setIsProcessing] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [thresholdInput, setThresholdInput] = useState(settings.criticalStockThreshold);
  const [companyInput, setCompanyInput] = useState(settings.companyName);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!canAccess('reconciliation')) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
          <i className="fa-solid fa-lock"></i>
        </div>
        <h3 className="text-xl font-black text-white">Erişim Yetkisi Yok</h3>
        <p className="text-slate-400 text-sm mt-2">
          Ayarlar ve Sistem Mutabakatı ekranı yalnızca Depo Yönetimi yetkisi altındadır.
        </p>
        <button
          onClick={() => setActiveTab('devices')}
          className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Cihaz Sorgulama Ekranına Dön
        </button>
      </div>
    );
  }

  // File Upload & Reconciliation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const res = await reconcileWithExcel(file);
      setReconciliationResult(res);
    } catch (err) {
      alert('Excel dosyası okunurken hata oluştu. Lütfen geçerli bir .xlsx veya .xls dosyası yükleyiniz.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Generate Sample Central Excel for Instant Testing
  const handleDownloadSampleExcel = () => {
    // We will generate an Excel file with some devices from the system,
    // intentionally leaving out 2 field devices so the user can immediately witness
    // "Sahada müşteriye takılarak listeden düşmüş cihazlar" in action!
    const sampleRows = devices
      .filter((d, idx) => idx !== 1 && idx !== 3) // Leave out dev-002 and dev-004
      .map(d => ({
        'SERİ NUMARASI': d.serialNumber,
        'KALEM KODU': d.itemCode,
        'ÜRÜN ADI': d.name,
        'MODEL': d.model,
        'DURUM': 'MERKEZ STOKTA',
      }));

    // Add one fake external device to test "Merkezde var ama depoda yok"
    sampleRows.push({
      'SERİ NUMARASI': 'SN-MERKEZ-99999',
      'KALEM KODU': 'KLM-MOD-01',
      'ÜRÜN ADI': 'Merkezden Gelecek Yeni Parti Cihaz',
      'MODEL': 'H3600 V9',
      'DURUM': 'SEVKİYATTA',
    });

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Merkez Güncel Liste');
    XLSX.writeFile(workbook, 'Ornek_Merkez_Stok_Listesi.xlsx');
  };

  const handleApplyReconciliationAction = () => {
    if (!reconciliationResult) return;
    applyReconciliation(reconciliationResult);
    alert('Mutabakat başarıyla tamamlandı! Müşteriye takılarak listeden düşen cihazlar sistemde düşüldü.');
    setReconciliationResult(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      criticalStockThreshold: thresholdInput,
      companyName: companyInput,
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  const handleJSONFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const ok = importDatabaseJSON(content);
      if (ok) {
        alert('Sistem yedeği başarıyla geri yüklendi!');
      } else {
        alert('Geçersiz JSON yedek dosyası!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-file-excel"></i>
              Merkez Stok Kıyaslama & Sistem Ayarları
            </span>
            <span className="text-xs text-slate-400">SheetJS Entegrasyonu</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Excel ile Stok Mutabakatı & Ayarlar
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Merkezden gelen güncel Excel listesini yükleyin; sistemdeki cihazlarla kıyaslayıp sahada müşteriye takılarak listeden düşen cihazları otomatik olarak tespit edin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('stock_import')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <i className="fa-solid fa-file-arrow-up"></i>
            <span>Depo Stok Yükleme Masası</span>
          </button>

          <button
            onClick={handleDownloadSampleExcel}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            title="Mutabakat testi için örnek bir merkez Excel dosyası indir"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Örnek Merkez Excelini İndir</span>
          </button>
        </div>
      </div>

      {/* Excel Upload & Reconciliation Dropzone */}
      <div className="bg-slate-900 border-2 border-dashed border-indigo-500/40 rounded-3xl p-8 text-center space-y-4 shadow-xl relative overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto text-2xl shadow-inner">
          <i className="fa-solid fa-cloud-arrow-up"></i>
        </div>

        <div>
          <h3 className="font-bold text-lg text-white">
            Merkez Excel Listesini Yükleyin (Mutabakat Başlat)
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Merkezden indirilen .xlsx veya .xls dosyasını sürükleyip bırakın veya bilgisayarınızdan seçin. Sistem seri numaralarını otomatik olarak eşleştirecektir.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? 'Excel Dosyası Taranıyor...' : 'Excel Dosyası Seç (.xlsx / .xls)'}</span>
          </button>
        </div>
      </div>

      {/* Reconciliation Comparison Results */}
      {reconciliationResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">Stok Mutabakat Analiz Raporu</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                  Kıyaslama Tamamlandı
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sistemdeki aktif cihazlar ile merkez Excel dosyası arasındaki fark dökümü.
              </p>
            </div>

            {reconciliationResult.consumedInField.length > 0 && (
              <button
                onClick={handleApplyReconciliationAction}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mutabakatı Onayla & Sahada Eritilenleri Düşür</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Sistemdeki Toplam Cihaz</span>
              <span className="text-xl font-black text-white mt-0.5 block">{reconciliationResult.totalInSystem}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Excel'deki Seri No Sayısı</span>
              <span className="text-xl font-black text-white mt-0.5 block">{reconciliationResult.totalInExcel}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Tam Eşleşen Cihazlar</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">{reconciliationResult.matchedCount}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Sahada Müşteriye Takılan</span>
              <span className="text-xl font-black text-amber-400 mt-0.5 block">
                {reconciliationResult.consumedInField.length} Adet
              </span>
            </div>
          </div>

          {/* Section: Consumed in Field (Sahada aboneye aktif edilip merkezden düşmüş olanlar) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-sm text-white">
                Sahada Müşteriye Takılarak Merkez Listesinden Düşen Cihazlar ({reconciliationResult.consumedInField.length})
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Aşağıdaki cihazlar sistemde bir personele zimmetli görünmekte ancak merkez Excel listesinde artık yer almamaktadır (abone kurulumu yapılmıştır):
            </p>

            {reconciliationResult.consumedInField.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-500 text-center">
                Sahada eritilen tespit edilmedi, tüm zimmetli cihazlar merkez listesinde mevcut.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-xs">
                {reconciliationResult.consumedInField.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-400">{item.serialNumber}</span>
                        <span className="text-white font-bold">{item.name}</span>
                        <span className="text-slate-500 font-mono">({item.itemCode})</span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Zimmetli Olduğu Personel: <strong className="text-slate-200">{item.assignedPersonnelName || 'Saha Personeli'}</strong>
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Müşteriye Takıldı (Listeden Düşmüş)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Settings & Backup Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Sistem & Eşik Seviyesi Ayarları
            </h3>
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Kaydedildi!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Şirket / Kuruluş Ünvanı
              </label>
              <input
                type="text"
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Kritik Depo Stok Eşiği (Minimum Cihaz Adedi)
              </label>
              <input
                type="number"
                min="1"
                value={thresholdInput}
                onChange={e => setThresholdInput(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Depoda kalan cihaz sayısı bu eşiğin altına indiğinde sistem başlıkta kırmızı alarm verir.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition cursor-pointer shadow-md"
            >
              Ayarları Kaydet
            </button>
          </form>
        </div>

        {/* Database JSON Backup & Restore Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Veritabanı Yedeği & Sıfırlama
              </h3>
              <p className="text-xs text-slate-400">
                Tüm envanteri, personelleri ve cihaz tarihçelerini JSON formatında dışa aktarın veya geri yükleyin.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleJSONFileImport}
                className="hidden"
              />

              <button
                type="button"
                onClick={exportDatabaseJSON}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Tüm Veritabanını Dışa Aktar (.json İndir)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const htmlSource = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Depo ve Envanter Yönetim Sistemi - Tek Dosyalık Sürüm</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="p-6 max-w-6xl mx-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-boxes-stacked text-2xl text-indigo-400"></i>
          <div>
            <h1 class="text-xl font-bold text-white">Depo ve Envanter Yönetim Sistemi</h1>
            <p class="text-xs text-slate-400">Tek Dosyalık Bağımsız Sürüm (Single File HTML)</p>
          </div>
        </div>
      </div>
      <div class="py-6 text-sm text-slate-300">
        Bu dosya tarayıcınızda doğrudan çift tıklanarak çalışacak şekilde tasarlanmıştır. Tüm veriler ve iş akışları yerel olarak işlenir.
      </div>
    </div>
  </div>
</body>
</html>`;
                  const blob = new Blob([htmlSource], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'depo_envanter_sistemi_standalone.html';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-indigo-500/40 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Tek Dosyalık (.html) İndir</span>
              </button>

              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>JSON Yedeğini Geri Yükle (Import)</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => resetToDefaults()}
              className="w-full py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sistem Verilerini Sıfırla</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
