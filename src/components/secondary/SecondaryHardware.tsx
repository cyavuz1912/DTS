import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { Device, DeviceCategory, DeviceStatus } from '../../types';
import {
  Tablet,
  Camera,
  Wifi,
  FileSpreadsheet,
  Filter,
  Search,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';

export const SecondaryHardware: React.FC = () => {
  const { devices, exportDevicesToExcel } = useWarehouse();

  const [categoryFilter, setCategoryFilter] = useState<string>('TÜMÜ');
  const [statusFilter, setStatusFilter] = useState<string>('TÜMÜ');
  const [searchQuery, setSearchQuery] = useState('');

  // Secondary hardware items (or Tablet, Kamera, Wi-Fi Güçlendirici, El Terminali)
  const secondaryDevices = devices.filter(
    d =>
      d.isSecondaryHardware ||
      ['Tablet', 'Kamera', 'Wi-Fi Güçlendirici', 'El Terminali'].includes(d.category)
  );

  const filtered = secondaryDevices.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.assignedPersonnelName && d.assignedPersonnelName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'TÜMÜ' || d.category === categoryFilter;
    const matchesStatus = statusFilter === 'TÜMÜ' || d.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleExport = () => {
    exportDevicesToExcel(
      filtered,
      `DepoPro_2_Donanim_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const getCategoryIcon = (cat: DeviceCategory) => {
    switch (cat) {
      case 'Tablet':
        return <i className="fa-solid fa-tablet-screen-button text-purple-400"></i>;
      case 'Kamera':
        return <i className="fa-solid fa-video text-blue-400"></i>;
      case 'Wi-Fi Güçlendirici':
        return <i className="fa-solid fa-wifi text-emerald-400"></i>;
      case 'El Terminali':
        return <i className="fa-solid fa-barcode text-amber-400"></i>;
      default:
        return <i className="fa-solid fa-hard-drive text-indigo-400"></i>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-tablet-screen-button"></i>
              2. Donanım & Aksesuar Raporlama
            </span>
            <span className="text-xs text-slate-400">Tablet, Kamera, Wi-Fi Extender vb.</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            2. Donanım Takip & Excel Dışa Aktarım
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Saha ekiplerine dağıtılan tabletler, güvenlik kameraları ve sinyal güçlendiriciler gibi yan donanımları filtreleyin ve tek tıkla SheetJS ile Excel (.xlsx) formatında indirin.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel'e Aktar (.xlsx İndir)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Ürün adı, seri no, model veya personel ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
            >
              <option value="TÜMÜ">Tüm Donanım Türleri</option>
              <option value="Tablet">Tabletler</option>
              <option value="Kamera">Güvenlik Kameraları</option>
              <option value="Wi-Fi Güçlendirici">Wi-Fi Güçlendiriciler</option>
              <option value="El Terminali">El Terminalleri</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
            >
              <option value="TÜMÜ">Tüm Durumlar</option>
              <option value="DEPODA">Depoda (Müsait)</option>
              <option value="SAHADA">Sahada (Personele Zimmetli)</option>
              <option value="IADE_SURECINDE">İade Sürecinde</option>
              <option value="TEKNIKTE">Teknik Serviste</option>
            </select>
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span>
            Filtrelenen: <strong className="text-white">{filtered.length}</strong> / Toplam 2. Donanım:{' '}
            <strong className="text-white">{secondaryDevices.length}</strong>
          </span>
          <span>SheetJS (.xlsx) Gerçek Excel Desteği</span>
        </div>
      </div>

      {/* Hardware Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Donanım & Kategori</th>
                <th className="py-3.5 px-4">Seri No & Kalem</th>
                <th className="py-3.5 px-4">Model & Özellik</th>
                <th className="py-3.5 px-4">Güncel Durum</th>
                <th className="py-3.5 px-4">Zimmetli Personel</th>
                <th className="py-3.5 px-4">Raf Konumu</th>
                <th className="py-3.5 px-4">Zimmet Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Filtre kriterlerine uygun 2. donanım bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const statusConfig = {
                    DEPODA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    SAHADA: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
                    IADE_SURECINDE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                    TEKNIKTE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    HURDA: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                    TRANSFERDE: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                  }[item.status];

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-400 block">{item.serialNumber}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{item.itemCode}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {item.model || '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.assignedPersonnelName ? (
                          <span className="font-semibold text-amber-300">{item.assignedPersonnelName}</span>
                        ) : (
                          <span className="text-slate-500 italic">Depo Rafında</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {item.shelfLocation}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {item.assignedDate || '-'}
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
  );
};
