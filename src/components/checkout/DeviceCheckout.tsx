import React, { useState, useRef } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { Device } from '../../types';
import {
  Barcode,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Scan,
  Sparkles,
  ArrowRight,
  Plus,
  Package,
} from 'lucide-react';

export const DeviceCheckout: React.FC = () => {
  const { devices, personnel, createTransferPackage, currentUser, setActiveTab } = useWarehouse();

  const [serialInput, setSerialInput] = useState('');
  const [cart, setCart] = useState<Device[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Available devices currently in DEPODA
  const availableDevices = devices.filter(d => d.status === 'DEPODA');

  const handleScanOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = serialInput.trim().toUpperCase();
    if (!query) return;

    // Check if already in cart
    if (cart.some(item => item.serialNumber.toUpperCase() === query)) {
      setFeedback({
        type: 'error',
        message: `⚠️ "${query}" seri numaralı cihaz zaten sepete eklenmiş!`,
      });
      setSerialInput('');
      return;
    }

    // Find device in inventory
    const targetDevice = devices.find(d => d.serialNumber.toUpperCase() === query);

    if (!targetDevice) {
      setFeedback({
        type: 'error',
        message: `❌ "${query}" seri numarasına ait kayıtlı bir cihaz bulunamadı!`,
      });
      setSerialInput('');
      return;
    }

    // Check if status is DEPODA
    if (targetDevice.status !== 'DEPODA') {
      setFeedback({
        type: 'error',
        message: `⚠️ Cihaz şu an depoda değil! Güncel durumu: ${targetDevice.status} (${targetDevice.assignedPersonnelName || 'Bilinmiyor'})`,
      });
      setSerialInput('');
      return;
    }

    // Add to cart with animation
    setCart(prev => [targetDevice, ...prev]);
    setFeedback({
      type: 'success',
      message: `✓ ${targetDevice.name} (${targetDevice.serialNumber}) sepete eklendi!`,
    });
    setSerialInput('');

    // Keep input focused for rapid scanning
    inputRef.current?.focus();
  };

  const handleQuickAdd = (device: Device) => {
    if (cart.some(item => item.id === device.id)) return;
    setCart(prev => [device, ...prev]);
    setFeedback({
      type: 'success',
      message: `✓ ${device.name} (${device.serialNumber}) sepete eklendi!`,
    });
    inputRef.current?.focus();
  };

  const handleRemoveFromCart = (deviceId: string) => {
    setCart(prev => prev.filter(item => item.id !== deviceId));
  };

  const handleClearCart = () => {
    setCart([]);
    setFeedback(null);
  };

  const handleCompleteCheckout = () => {
    if (cart.length === 0) {
      setFeedback({ type: 'error', message: 'Lütfen sepete en az bir cihaz ekleyiniz!' });
      return;
    }

    if (!selectedPersonnelId) {
      setFeedback({ type: 'error', message: 'Lütfen cihazların sevk edileceği birim veya personeli seçiniz!' });
      return;
    }

    const deviceIds = cart.map(d => d.id);
    const createdPkg = createTransferPackage(deviceIds, selectedPersonnelId, checkoutNotes);

    if (createdPkg) {
      setFeedback({
        type: 'success',
        message: `🎉 Tebrikler! ${createdPkg.packageNumber} nolu teslimat paketi (${cart.length} cihaz) "${createdPkg.targetName}" onayına sevk edildi. Karşı taraf sepeti kontrol edip kabul edene kadar 'Malzeme Onay' sekmesinden takip edebilirsiniz.`,
      });
      setCart([]);
      setSelectedPersonnelId('');
      setCheckoutNotes('');
    }
  };

  const selectedPerson = personnel.find(p => p.id === selectedPersonnelId);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-barcode"></i>
              Malzeme Çıkış & Zimmetleme Masası
            </span>
            <span className="text-xs text-slate-400">Hızlı El Terminali & Barkod Desteği</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Personele Cihaz Teslimi (Seri No Okutma & Sepet)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Barkod okuyucuyla art arda seri numaralarını okutun, sepeti doldurun ve seçtiğiniz personele tek tıkla toplu olarak zimmetleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block">Depodaki Müsait Cihazlar</span>
            <span className="text-xl font-black text-emerald-400">{availableDevices.length} Adet</span>
          </div>

          <button
            onClick={() => setActiveTab('stock_import')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:text-white"
          >
            <i className="fa-solid fa-file-excel text-emerald-400"></i>
            <span>Excel ile Stok Yükle</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Checkout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Barcode Scanning Input & Ready Devices (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode Scanner Box */}
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <i className="fa-solid fa-barcode text-base"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Hızlı Seri No Okutma Alanı</h3>
                  <p className="text-[11px] text-slate-400">Barkod tabancasıyla okutulduğunda otomatik algılar</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Lazer Aktif
              </span>
            </div>

            <form onSubmit={handleScanOrSubmit} className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  placeholder="Seri numarasını okutun veya yazıp ENTER'a basın (Örn: SN-ZTE-88201)..."
                  value={serialInput}
                  onChange={e => setSerialInput(e.target.value)}
                  className="w-full pl-11 pr-24 py-3.5 bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 rounded-2xl text-white font-mono text-sm tracking-wider focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition placeholder:text-slate-600"
                />
                <Scan className="w-5 h-5 text-indigo-400 absolute left-3.5 top-4" />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Ekle
                </button>
              </div>
            </form>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Quick Click Demo Devices */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Depoda Bekleyen Müsait Cihazlar (Tek Tıkla Sepete Ekle):
              </span>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {availableDevices.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Depoda müsait cihaz kalmadı.</span>
                ) : (
                  availableDevices.map(d => {
                    const isInCart = cart.some(c => c.id === d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        disabled={isInCart}
                        onClick={() => handleQuickAdd(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                          isInCart
                            ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                            : 'bg-slate-800 hover:bg-indigo-900/60 text-slate-200 border-slate-700 hover:border-indigo-500'
                        }`}
                      >
                        <i className="fa-solid fa-microchip text-[10px] text-indigo-400"></i>
                        <span>{d.serialNumber}</span>
                        <span className="text-[10px] text-slate-400">({d.model})</span>
                        {!isInCart && <Plus className="w-3 h-3 text-emerald-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Cart & Personnel Assignment (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Teslimat Sepeti</h3>
                    <p className="text-[11px] text-slate-400">Okutulan cihazların listesi</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                    {cart.length} Cihaz
                  </span>
                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* Cart Items List with Animation */}
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    <ShoppingCart className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                    Henüz cihaz okutulmadı. Sol taraftan barkod okutarak sepeti doldurunuz.
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 animate-in fade-in slide-in-from-right-4 duration-200"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-indigo-400">
                            {item.serialNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            • {item.itemCode}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-400">{item.model}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Sepetten Çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Personnel Selection & Complete Assignment */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Teslim Eden Depo Sorumlusu:</span>
                <strong className="text-white font-semibold">
                  {currentUser?.name} ({currentUser?.roleTitle})
                </strong>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Cihazların Sevk Edileceği Birim / Personel (Alıcı):
                </label>
                <select
                  value={selectedPersonnelId}
                  onChange={e => setSelectedPersonnelId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Teslim Edilecek Alıcıyı Seçiniz...</option>
                  <optgroup label="Teknik Servis Departmanı">
                    <option value="usr-teknik">
                      🛠️ Emre Yıldız - Teknik Servis & RMA Laboratuvarı Şefi
                    </option>
                  </optgroup>
                  <optgroup label="Saha Personelleri & Ekipler">
                    {personnel.map(p => (
                      <option key={p.id} value={p.id}>
                        👷 {p.name} - {p.title} ({p.team})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {selectedPersonnelId === 'usr-teknik' ? (
                <div className="p-2.5 bg-amber-950/40 rounded-xl border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2.5 animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <i className="fa-solid fa-screwdriver-wrench text-sm"></i>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Emre Yıldız (Teknik Servis Şefi)</span>
                    <span className="text-[10px] text-amber-300 block">
                      Paket hazırlandığında Tekniğe bildirim ve onay düşer. Teknik kontrol edip kabul ettiğinde cihazlar zimmetine geçer.
                    </span>
                  </div>
                </div>
              ) : (
                selectedPerson && (
                  <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2 animate-in fade-in">
                    <img
                      src={selectedPerson.avatar}
                      alt={selectedPerson.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-white block">{selectedPerson.name}</span>
                      <span className="text-[10px] text-slate-400">{selectedPerson.team} • {selectedPerson.phone}</span>
                    </div>
                  </div>
                )
              )}

              <div>
                <input
                  type="text"
                  placeholder="İsteğe bağlı teslimat notu / görev numarası..."
                  value={checkoutNotes}
                  onChange={e => setCheckoutNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || !selectedPersonnelId}
                onClick={handleCompleteCheckout}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  cart.length > 0 && selectedPersonnelId
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Paketi Hazırla & Onaya Gönder ({cart.length} Cihaz)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
