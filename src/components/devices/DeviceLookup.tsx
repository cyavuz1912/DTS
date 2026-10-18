import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { Device, DeviceCategory, DeviceStatus } from '../../types';
import {
  Search,
  History,
  MapPin,
  Barcode,
  Plus,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Wrench,
} from 'lucide-react';

export const DeviceLookup: React.FC = () => {
  const { devices, addDevice, currentUser, setActiveTab, canAccess } = useWarehouse();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(devices[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New device form state
  const [serialNumber, setSerialNumber] = useState('');
  const [itemCode, setItemCode] = useState('KLM-MOD-01');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<DeviceCategory>('Modem & Router');
  const [shelfLocation, setShelfLocation] = useState('A-01-R1');
  const [macAddress, setMacAddress] = useState('');
  const [condition, setCondition] = useState<string>('Sağlam');
  const [isSecondary, setIsSecondary] = useState(false);

  // Filtered devices list for fast selection
  const filteredDevices = devices.filter(
    d =>
      d.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.condition && d.condition.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.assignedPersonnelName && d.assignedPersonnelName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectDevice = (dev: Device) => {
    setSelectedDevice(dev);
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim() || !name.trim()) return;

    addDevice({
      serialNumber: serialNumber.trim().toUpperCase(),
      itemCode,
      name,
      model,
      category,
      isSecondaryHardware: isSecondary,
      status: 'DEPODA',
      condition,
      shelfLocation,
      macAddress: macAddress || undefined,
    });

    setSerialNumber('');
    setName('');
    setModel('');
    setMacAddress('');
    setCondition('Sağlam');
    setIsAddModalOpen(false);
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'DEPODA':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          label: 'DEPODA (Müsait)',
          icon: 'fa-solid fa-box-open',
        };
      case 'SAHADA':
        return {
          bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          label: 'SAHADA (Zimmetli)',
          icon: 'fa-solid fa-person-digging',
        };
      case 'IADE_SURECINDE':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          label: 'İADE SÜRECİNDE',
          icon: 'fa-solid fa-rotate-left',
        };
      case 'TEKNIKTE':
        return {
          bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          label: 'TEKNİK SERVİSTE',
          icon: 'fa-solid fa-wrench',
        };
      case 'HURDA':
        return {
          bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          label: 'MÜŞTERİDE / ERİTİLDİ',
          icon: 'fa-solid fa-check-double',
        };
      case 'TRANSFERDE':
        return {
          bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          label: 'TRANSFERDE (Onay Bekliyor)',
          icon: 'fa-solid fa-truck-fast',
        };
      default:
        return {
          bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          label: status,
          icon: 'fa-solid fa-circle-info',
        };
    }
  };

  const canAdd = currentUser?.role === 'DEPO' || currentUser?.role === 'BACKOFIS';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-magnifying-glass"></i>
              Cihaz Künyesi & Timeline Sorgulama
            </span>
            <span className="text-xs text-slate-400">Tüm Geçmiş Hareketler</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Cihaz Sorgulama & Detaylı Yaşam Döngüsü
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Seri numarasını aratın; cihazın kalem kodundan kimin üzerinde olduğuna, tüm geçmiş teslimat ve iade hareket loglarına kadar anında inceleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAccess('stock_import') && (
            <button
              onClick={() => setActiveTab('stock_import')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm hover:text-white"
            >
              <i className="fa-solid fa-file-excel text-emerald-400"></i>
              <span>Excel ile Stok Yükle</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Cihaz Kaydı Aç</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Layout: Search & List on Left, Comprehensive Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Device Search and Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Seri no, ürün adı, kalem kodu veya personel ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Sonuçlar ({filteredDevices.length})</span>
              <span>Seçmek için tıklayınız</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredDevices.map(d => {
                const isSelected = selectedDevice?.id === d.id;
                const statusMeta = getStatusBadge(d.status);

                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDevice(d)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-black text-indigo-400">
                        {d.serialNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          (d.condition || 'Sağlam') === 'Arıza'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : (d.condition || 'Sağlam') === 'Karantina'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : (d.condition || 'Sağlam') === 'Sağlam Dönen'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {d.condition || 'Sağlam'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.bg}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-xs text-white truncate">{d.name}</h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Kalem: {d.itemCode}</span>
                      <span>{d.assignedPersonnelName ? `Zimmet: ${d.assignedPersonnelName}` : `Raf: ${d.shelfLocation}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Device Dossier & Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedDevice ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-base font-black text-white bg-slate-950 border border-slate-700 px-3 py-1 rounded-xl">
                      {selectedDevice.serialNumber}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      (selectedDevice.condition || 'Sağlam') === 'Arıza'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : (selectedDevice.condition || 'Sağlam') === 'Karantina'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : (selectedDevice.condition || 'Sağlam') === 'Sağlam Dönen'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      Statü: {selectedDevice.condition || 'Sağlam'}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(selectedDevice.status).bg}`}>
                      {getStatusBadge(selectedDevice.status).label}
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-white mt-1">{selectedDevice.name}</h3>
                  <span className="text-xs text-slate-400">{selectedDevice.model}</span>
                </div>
              </div>

              {/* Identity Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Kodu</span>
                  <span className="font-mono font-bold text-slate-200 text-sm mt-0.5 block">{selectedDevice.itemCode}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Kategori</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5 block">{selectedDevice.category}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Raf Lokasyonu</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm mt-0.5 block">{selectedDevice.shelfLocation}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Şu An Kimin Üzerinde?</span>
                  <span className={`font-bold text-sm mt-0.5 block ${selectedDevice.assignedPersonnelName ? 'text-amber-400' : 'text-slate-400'}`}>
                    {selectedDevice.assignedPersonnelName || 'Depo Rafında'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Zimmet / Teslim Tarihi</span>
                  <span className="font-bold text-slate-200 text-xs mt-0.5 block">{selectedDevice.assignedDate || 'Henüz Çıkış Yapılmadı'}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">MAC Adresi</span>
                  <span className="font-mono font-bold text-slate-300 text-xs mt-0.5 block">{selectedDevice.macAddress || '-'}</span>
                </div>
              </div>

              {/* Vertical Timeline / History Logs */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-sm text-white">
                    Zaman Çizelgesi & Hareket Tarihçesi (Lifecycle Timeline)
                  </h4>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {selectedDevice.history.map((h, idx) => (
                    <div key={h.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-slate-900 border border-indigo-400"></div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{h.action}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{h.date}</span>
                        </div>

                        {h.personnelName && (
                          <div className="text-xs text-amber-300 font-medium">
                            İlgili Personel: {h.personnelName}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400">
                          İşlemi Yapan: <strong>{h.performedBy}</strong>
                        </div>

                        {h.note && (
                          <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl mt-1 border border-slate-800/80">
                            {h.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-500 text-xs">
              Detaylarını ve zaman çizelgesini görmek için sol taraftan bir cihaz seçiniz.
            </div>
          )}
        </div>
      </div>

      {/* Add Device Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Yeni Cihaz / Donanım Kaydı Aç
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Seri Numarası (SN)</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: SN-ZTE-99301"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Kalem Kodu</label>
                  <input
                    type="text"
                    required
                    value={itemCode}
                    onChange={e => setItemCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as DeviceCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Modem & Router">Modem & Router</option>
                    <option value="Set-Top Box & TV">Set-Top Box & TV</option>
                    <option value="Tablet">Tablet (2. Donanım)</option>
                    <option value="Kamera">Kamera (2. Donanım)</option>
                    <option value="Wi-Fi Güçlendirici">Wi-Fi Güçlendirici (2. Donanım)</option>
                    <option value="El Terminali">El Terminali (2. Donanım)</option>
                    <option value="Ağ & Switch">Ağ & Switch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Ürün Tanımı / Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: ZTE ZXHN H3600 Wi-Fi 6 Router"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Cihaz Modeli</label>
                  <input
                    type="text"
                    placeholder="Örn: H3600 V9"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Depo Raf Lokasyonu</label>
                  <input
                    type="text"
                    required
                    value={shelfLocation}
                    onChange={e => setShelfLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Cihaz Statüsü / Kondisyon</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                >
                  <option value="Sağlam">🟢 Sağlam (Kullanıma Hazır)</option>
                  <option value="Arıza">🔴 Arıza (Arızalı / Onarım Gerekiyor)</option>
                  <option value="Karantina">🟠 Karantina (İnceleme / Test Bekliyor)</option>
                  <option value="Sağlam Dönen">🔵 Sağlam Dönen (İadeden Sağlam Gelen)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">MAC Adresi</label>
                <input
                  type="text"
                  placeholder="CC:2D:E0:41:A8:10"
                  value={macAddress}
                  onChange={e => setMacAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="secondaryCheck"
                  checked={isSecondary}
                  onChange={e => setIsSecondary(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
                />
                <label htmlFor="secondaryCheck" className="text-slate-300 font-semibold cursor-pointer">
                  2. Donanım (Tablet, Kamera, Wi-Fi Güçlendirici vb. yan donanım olarak işaretle)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Cihazı Kaydet & Depoya Al
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
