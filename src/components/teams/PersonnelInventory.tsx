import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { Personnel, Device } from '../../types';
import {
  Users,
  HardDrive,
  Phone,
  Mail,
  MapPin,
  Plus,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';

export const PersonnelInventory: React.FC = () => {
  const { personnel, devices, createReturnRequest, addPersonnel, exportDevicesToExcel, currentUser } = useWarehouse();
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel>(personnel[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New personnel form state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [team, setTeam] = useState('Avrupa Saha Ekibi');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Get devices assigned to the selected personnel
  const assignedDevices = devices.filter(
    d => d.assignedPersonnelId === selectedPersonnel.id && d.status === 'SAHADA'
  );

  const handleReturnDirectly = (device: Device) => {
    if (currentUser?.role === 'BACKOFIS') {
      alert('Backofis departmanının cihazları iadeye gönderme yetkisi bulunmamaktadır.');
      return;
    }
    if (confirm(`"${device.name}" (${device.serialNumber}) cihazı için iade süreci başlatılsın mı?`)) {
      createReturnRequest(
        device.serialNumber,
        `Zimmet listesi üzerinden doğrudan iade talebi başlatıldı (${selectedPersonnel.name})`
      );
      alert('İade talebi oluşturuldu ve depo onay havuzuna aktarıldı!');
    }
  };

  const handleExportPersonnelInventory = () => {
    exportDevicesToExcel(
      assignedDevices,
      `${selectedPersonnel.name.replace(/\s+/g, '_')}_Zimmet_Listesi.xlsx`
    );
  };

  const handleCreatePersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addPersonnel({
      name,
      title: title || 'Saha Kurulum Teknisyeni',
      team,
      phone: phone || '+90 530 000 0000',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@firma.com`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });

    setName('');
    setTitle('');
    setPhone('');
    setEmail('');
    setIsAddModalOpen(false);
  };

  const canAddPerson = currentUser?.role === 'DEPO';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-users-gear"></i>
              Ekipler & Personel Zimmet Takibi
            </span>
            <span className="text-xs text-slate-400">Saha Personeli Aktif Cihazları</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Saha Çalışanları & Anlık Zimmet Havuzu
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Personeli seçin; üzerinde anlık olarak bulunan modem, router, tablet veya kamera gibi tüm zimmetli cihazları ve veriliş tarihlerini inceleyin.
          </p>
        </div>

        {canAddPerson && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Saha Personeli Ekle</span>
          </button>
        )}
      </div>

      {/* 2-Column Split: Personnel List (Left 5) & Selected Personnel's Devices (Right 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personnel List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-white">Saha Çalışanları ({personnel.length})</span>
              <span className="text-slate-400 text-[11px]">Zimmetini görmek için tıklayın</span>
            </div>

            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {personnel.map(p => {
                const count = devices.filter(
                  d => d.assignedPersonnelId === p.id && d.status === 'SAHADA'
                ).length;
                const isSelected = selectedPersonnel?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPersonnel(p)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{p.name}</h4>
                        <span className="text-[11px] text-slate-400 block truncate">{p.title}</span>
                        <span className="text-[10px] text-indigo-400 font-medium block truncate">{p.team}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Zimmetli</span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full font-mono ${count > 0 ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-500'}`}>
                        {count} Cihaz
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Personnel's Devices Desk (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Personnel Profile Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPersonnel.avatar}
                  alt={selectedPersonnel.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                />
                <div>
                  <h3 className="font-black text-lg text-white">{selectedPersonnel.name}</h3>
                  <span className="text-xs text-indigo-400 font-semibold block">{selectedPersonnel.title}</span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {selectedPersonnel.team}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {selectedPersonnel.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPersonnelInventory}
                  disabled={assignedDevices.length === 0}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    assignedDevices.length > 0
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-800'
                  }`}
                  title="Bu personelin zimmet listesini Excel (.xlsx) olarak indir"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Zimmet Excel'i İndir</span>
                </button>
              </div>
            </div>

            {/* Total Devices Stat Pill */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">
                Personelin Üzerinde Bulunan Toplam Aktif Cihaz Sayısı:
              </span>
              <span className="text-base font-black text-indigo-400 font-mono">
                {assignedDevices.length} Adet
              </span>
            </div>

            {/* List of Devices on this Person */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Zimmetli Cihazların Dökümü:
              </span>

              {assignedDevices.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/60 rounded-2xl border border-slate-800">
                  <UserCheck className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                  Bu personelin üzerinde şu an kayıtlı herhangi bir zimmetli cihaz bulunmamaktadır.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {assignedDevices.map(d => (
                    <div
                      key={d.id}
                      className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-400">
                            {d.serialNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            • Kalem: {d.itemCode}
                          </span>
                          {d.isSecondaryHardware && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              2. Donanım
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-white mt-0.5">{d.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Teslim Tarihi: {d.assignedDate || 'Bilinmiyor'} • Model: {d.model}
                        </span>
                      </div>

                      {currentUser?.role !== 'BACKOFIS' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReturnDirectly(d)}
                            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Bu cihaz için iade süreci başlat"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>İadeye Gönder</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Personnel Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Yeni Saha Personeli Kaydı
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePersonnel} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Hasan Demir"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Görevi / Ünvanı</label>
                <input
                  type="text"
                  placeholder="Saha Kurulum Teknisyeni"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Bölge / Ekip</label>
                <select
                  value={team}
                  onChange={e => setTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Avrupa 1. Bölge Saha Ekibi">Avrupa 1. Bölge Saha Ekibi</option>
                  <option value="Anadolu 2. Bölge Saha Ekibi">Anadolu 2. Bölge Saha Ekibi</option>
                  <option value="Merkez Altyapı Ekibi">Merkez Altyapı Ekibi</option>
                  <option value="Trakya Bölge Ekibi">Trakya Bölge Ekibi</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Telefon Numarası</label>
                <input
                  type="text"
                  placeholder="+90 530 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
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
                  Personeli Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
