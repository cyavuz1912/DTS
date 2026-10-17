export type UserRole = 'DEPO' | 'ONOFIS' | 'BACKOFIS' | 'TEKNIK';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatar: string;
  department: string;
  phone: string;
  status: 'AKTIF' | 'PASIF';
}

export type DeviceStatus = 'DEPODA' | 'SAHADA' | 'IADE_SURECINDE' | 'TEKNIKTE' | 'HURDA' | 'TRANSFERDE';

export type DeviceCategory =
  | 'Modem & Router'
  | 'Set-Top Box & TV'
  | 'Tablet'
  | 'Kamera'
  | 'Wi-Fi Güçlendirici'
  | 'El Terminali'
  | 'Ağ & Switch';

export interface DeviceHistoryItem {
  id: string;
  date: string;
  action: string;
  personnelName?: string;
  performedBy: string;
  note?: string;
}

export interface Device {
  id: string;
  serialNumber: string;
  itemCode: string; // Kalem Kodu
  name: string;
  model: string;
  category: DeviceCategory;
  isSecondaryHardware: boolean; // Tablet, Kamera, Wi-Fi Güçlendirici gibi yan donanımlar
  status: DeviceStatus;
  assignedPersonnelId?: string | null;
  assignedPersonnelName?: string | null;
  assignedDate?: string | null;
  shelfLocation: string;
  macAddress?: string;
  notes?: string;
  createdAt: string;
  history: DeviceHistoryItem[];
}

export interface Personnel {
  id: string;
  name: string;
  title: string;
  team: string; // Bölge / Ekip
  phone: string;
  email: string;
  avatar: string;
}

export interface ReturnRequest {
  id: string;
  deviceId?: string;
  serialNumber: string;
  deviceName?: string;
  submittedByName: string; // Oturum açan kullanıcının adı (herkesin farklı logini var)
  submittedByRole: string; // Oturum açan kullanıcının rolü
  notes: string; // İade notu (iade sebebi kaldırıldı, sadece not)
  status: 'BEKLEMEDE' | 'KABUL_EDILDI' | 'REDDEDILDI';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface TransferPackageDevice {
  id: string;
  serialNumber: string;
  itemCode: string;
  name: string;
  model: string;
  category: DeviceCategory;
}

export interface TransferPackage {
  id: string;
  packageNumber: string; // Örn: PKT-2026-881
  senderName: string;
  senderRole: string; // DEPO
  targetPersonnelId?: string;
  targetName: string; // Örn: Emre Yıldız (Teknik Servis)
  targetRole: 'TEKNIK' | 'SAHA' | string;
  deviceIds: string[];
  devicesSummary: TransferPackageDevice[];
  status: 'ONAY_BEKLIYOR' | 'KABUL_EDILDI' | 'REDDEDILDI';
  notes?: string;
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
  rejectionReason?: string;
}

export interface ReconciliationResult {
  totalInSystem: number;
  totalInExcel: number;
  matchedCount: number;
  consumedInField: {
    serialNumber: string;
    name: string;
    itemCode: string;
    assignedPersonnelName?: string;
    detectedStatus: 'Müşteriye Takılmış / Listeden Düşmüş';
  }[];
  onlyInSystem: {
    serialNumber: string;
    name: string;
    status: DeviceStatus;
  }[];
  onlyInExcel: {
    serialNumber: string;
    name?: string;
  }[];
}

export interface SystemSettings {
  criticalStockThreshold: number;
  companyName: string;
  warehouseLocation: string;
}

export interface StockExcelRow {
  rowNumber: number;
  serialNumber: string;
  name: string;
  itemCode: string;
  model: string;
  category: DeviceCategory;
  shelfLocation: string;
  status: DeviceStatus;
  isSecondaryHardware: boolean;
  notes?: string;
  actionType: 'NEW' | 'UPDATE' | 'NO_CHANGE' | 'INVALID';
  changeDetails: string[];
  existingDevice?: Device;
}

export interface StockExcelScanResult {
  fileName: string;
  totalRows: number;
  validRowsCount: number;
  newCount: number;
  updateCount: number;
  noChangeCount: number;
  invalidCount: number;
  rows: StockExcelRow[];
}

export interface StockExcelApplySummary {
  newAddedCount: number;
  updatedCount: number;
  totalProcessed: number;
}

export type NotificationType =
  | 'PACKAGE_APPROVAL'   // Ahmet Özer malzemeleri onayladı
  | 'PACKAGE_REJECTION'  // Paket reddedildi
  | 'PACKAGE_DISPATCH'   // Depo malzeme çıkışı yaptı
  | 'RETURN_SUBMITTED'   // Ahmet Özer iade gönderdi
  | 'RETURN_APPROVED'    // Depo iadeyi kabul etti
  | 'RETURN_REJECTED'    // Depo iadeyi reddetti
  | 'STOCK_ALERT'        // Kritik stok uyarısı
  | 'EXCEL_IMPORT';      // Excel stok aktarımı

export interface WarehouseNotification {
  id: string;
  type: NotificationType;
  actorName: string;      // Örn: "Ahmet Özer", "Selin Arslan", "Emre Yıldız"
  actorRole: string;      // Örn: "Saha Ekibi", "Ön Ofis", "Teknik Servis", "Depo"
  title: string;          // Örn: "Ahmet Özer malzemeleri onayladı"
  description: string;    // Detay mesajı
  targetId?: string;      // İlgili paket veya iade ID'si
  timestamp: string;      // "17.10.2026 11:45"
  isRead: boolean;
  linkTab?: 'package_approvals' | 'returns' | 'devices' | 'checkout';
}
