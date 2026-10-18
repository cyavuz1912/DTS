import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Personnel,
  Device,
  DeviceStatus,
  ReturnRequest,
  SystemSettings,
  ReconciliationResult,
  StockExcelRow,
  StockExcelScanResult,
  StockExcelApplySummary,
  StatusChangeRecord,
  TransferPackage,
  WarehouseNotification,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PERSONNEL,
  INITIAL_DEVICES,
  INITIAL_RETURNS,
  INITIAL_SETTINGS,
  INITIAL_PACKAGES,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import * as XLSX from 'xlsx';

interface WarehouseContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  personnel: Personnel[];
  devices: Device[];
  returnRequests: ReturnRequest[];
  packages: TransferPackage[];
  settings: SystemSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Role & Auth
  loginWithCredentials: (
    identifier: string,
    password: string
  ) => { success: boolean; message?: string; user?: User };
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  canAccess: (tab: string) => boolean;

  // Device & Checkout (Malzeme Çıkış / Personele Teslim)
  assignDevicesToPersonnel: (deviceIds: string[], personnelId: string, notes?: string) => boolean;
  createTransferPackage: (
    deviceIds: string[],
    targetPersonnelId: string,
    notes?: string
  ) => TransferPackage | null;
  acceptTransferPackage: (packageId: string) => boolean;
  rejectTransferPackage: (packageId: string, reason: string) => boolean;
  addDevice: (device: Omit<Device, 'id' | 'createdAt' | 'history'>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  // Stock Excel Import & Scan (Depo Departmanı İçin Stok Yükleme & Güncelleme)
  scanStockExcelFile: (file: File) => Promise<StockExcelScanResult>;
  applyStockExcelUpdates: (scanResult: StockExcelScanResult) => StockExcelApplySummary;
  downloadStockExcelTemplate: () => void;
  createSampleStockExcelFile: () => File;

  // Returns (İade Onay & Depoya Kabul)
  createReturnRequest: (
    serialNumber: string,
    notes: string
  ) => boolean;
  createBulkReturnRequests: (
    serialNumbers: string[],
    notes: string
  ) => number;
  acceptReturnRequest: (requestId: string, notes?: string) => void;
  rejectReturnRequest: (requestId: string, notes?: string) => void;

  // Personnel
  addPersonnel: (p: Omit<Personnel, 'id'>) => void;

  // Users Management
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Settings & Utilities
  updateSettings: (settings: Partial<SystemSettings>) => void;
  exportDevicesToExcel: (devicesToExport?: Device[], filename?: string) => void;
  reconcileWithExcel: (file: File) => Promise<ReconciliationResult>;
  applyReconciliation: (result: ReconciliationResult) => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => boolean;
  resetToDefaults: () => void;

  // Notifications (Depo Hareket Bildirim Çanı)
  notifications: WarehouseNotification[];
  addNotification: (notif: Omit<WarehouseNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  unreadNotificationsCount: number;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// Helper function to deduplicate entity arrays by id
export const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
};

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user / Login state (Starts unauthenticated at LoginScreen unless active session exists)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('depopro_wms_active_session_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('depopro_wms_users_list');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(u => {
            const initMatch = INITIAL_USERS.find(iu => iu.id === u.id || iu.role === u.role);
            return {
              ...u,
              username: u.username || initMatch?.username || u.email.split('@')[0],
              password: u.password || initMatch?.password || '123456',
            };
          });
        }
      } catch (e) {
        /* ignore */
      }
    }
    return INITIAL_USERS;
  });

  const [personnel, setPersonnel] = useState<Personnel[]>(() => {
    const saved = localStorage.getItem('depopro_wms_personnel');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_PERSONNEL;
  });

  const [devices, setDevices] = useState<Device[]>(() => {
    const saved = localStorage.getItem('depopro_wms_devices');
    if (saved) {
      try {
        const parsed: Device[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = deduplicateById([...INITIAL_DEVICES, ...parsed]);
          return merged.map(d => {
            const initMatch = INITIAL_DEVICES.find(i => i.id === d.id);
            // Clean out legacy demo mock history items
            const realHistory = (d.history || []).filter(h => {
              if (!h || !h.id) return false;
              return !/^hist-(1[0-7]?|[2-9])[a-c]?$/.test(h.id);
            });
            return {
              ...d,
              condition: d.condition || initMatch?.condition || 'Sağlam',
              history: realHistory,
            };
          });
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_DEVICES;
  });

  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>(() => {
    const saved = localStorage.getItem('depopro_wms_returns');
    if (saved) {
      try {
        const parsed: ReturnRequest[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realReturns = parsed.filter(r => !['ret-101', 'ret-102', 'ret-103', 'ret-104'].includes(r.id));
          return deduplicateById(realReturns);
        }
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [packages, setPackages] = useState<TransferPackage[]>(() => {
    const saved = localStorage.getItem('depopro_wms_packages');
    if (saved) {
      try {
        const parsed: TransferPackage[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realPackages = parsed.filter(p => !['pkg-101', 'pkg-102', 'pkg-103'].includes(p.id));
          return deduplicateById(realPackages);
        }
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('depopro_wms_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<string>('checkout');

  // Notifications State & LocalStorage persistence (Eylemler & Hareket Geçmişi)
  const [notifications, setNotifications] = useState<WarehouseNotification[]>(() => {
    const saved = localStorage.getItem('depopro_wms_notifications');
    if (saved) {
      try {
        const parsed: WarehouseNotification[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realNotifications = parsed.filter(n => !n.id.startsWith('notif-'));
          return deduplicateById(realNotifications);
        }
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // One-time automatic cleanup of legacy demo actions/movements from localStorage
  useEffect(() => {
    const isCleaned = localStorage.getItem('depopro_wms_demo_actions_cleared_v2');
    if (!isCleaned) {
      localStorage.removeItem('depopro_wms_notifications');
      localStorage.removeItem('depopro_wms_packages');
      localStorage.removeItem('depopro_wms_returns');
      localStorage.setItem('depopro_wms_demo_actions_cleared_v2', 'true');
      setNotifications([]);
      setPackages([]);
      setReturnRequests([]);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('depopro_wms_active_session_v1', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('depopro_wms_active_session_v1');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('depopro_wms_users_list', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('depopro_wms_personnel', JSON.stringify(personnel));
  }, [personnel]);

  useEffect(() => {
    localStorage.setItem('depopro_wms_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('depopro_wms_returns', JSON.stringify(returnRequests));
  }, [returnRequests]);

  useEffect(() => {
    localStorage.setItem('depopro_wms_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('depopro_wms_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('depopro_wms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Audio chime for live incoming movements
  const playNotificationChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const addNotification = (notif: Omit<WarehouseNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: WarehouseNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: nowStr(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    playNotificationChime();
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const getDefaultTabForRole = (role: UserRole): string => {
    if (role === 'DEPO') return 'checkout';
    if (role === 'TEKNIK') return 'teknik_inventory';
    if (role === 'ONOFIS') return 'returns';
    if (role === 'BACKOFIS') return 'devices';
    return 'devices';
  };

  // Date helper
  const nowStr = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Authenticate user with username/email & password
  const loginWithCredentials = (
    identifier: string,
    password: string
  ): { success: boolean; message?: string; user?: User } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        message: 'Lütfen kullanıcı adı/e-posta ve şifrenizi eksiksiz giriniz.',
      };
    }

    const matchedUser = users.find(
      u =>
        u.email.toLowerCase() === cleanId ||
        (u.username && u.username.toLowerCase() === cleanId) ||
        u.name.toLowerCase() === cleanId ||
        u.role.toLowerCase() === cleanId
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'Bu kullanıcı adı veya e-posta adresine kayıtlı bir hesap bulunamadı!',
      };
    }

    if (matchedUser.status === 'PASIF') {
      return {
        success: false,
        message: 'Bu kullanıcı hesabı pasif durumdadır. Giriş yetkiniz kısıtlanmıştır.',
      };
    }

    const expectedPassword = matchedUser.password || '123456';
    if (cleanPass !== expectedPassword) {
      return {
        success: false,
        message: 'Girdiğiniz şifre hatalı! Lütfen kontrol edip tekrar deneyiniz.',
      };
    }

    setCurrentUser(matchedUser);
    setActiveTab(getDefaultTabForRole(matchedUser.role));
    return {
      success: true,
      user: matchedUser,
    };
  };

  // Login as one of the 4 roles
  const loginAsRole = (role: UserRole) => {
    const target = users.find(u => u.role === role) || INITIAL_USERS.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
      setActiveTab(getDefaultTabForRole(role));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('depopro_wms_active_session_v1');
  };

  // Permission access check
  const canAccess = (tab: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;

    // DEPO: Depo Yönetimi & Genel İşlemler (Zimmetim sekmesi yalnızca TEKNIK rolüne özeldir)
    if (role === 'DEPO') {
      return tab !== 'teknik_inventory';
    }

    // ONOFIS: Sadece İade Onaya Gönder
    if (role === 'ONOFIS') {
      return tab === 'returns';
    }

    // BACKOFIS: Stok izleme, yeni ürün kaydı açma, ekip zimmetleri ve 2. donanım takip (Ayarlar kaldırıldı)
    if (role === 'BACKOFIS') {
      return ['devices', 'teams', 'secondary'].includes(tab);
    }

    // TEKNIK: Üzerimdeki Cihazlar (Zimmetim), malzeme onay, iade takip, cihaz sorgulama, 2. donanım
    if (role === 'TEKNIK') {
      return ['teknik_inventory', 'package_approvals', 'returns', 'devices', 'secondary'].includes(tab);
    }

    return false;
  };

  useEffect(() => {
    if (currentUser && !canAccess(activeTab)) {
      setActiveTab(getDefaultTabForRole(currentUser.role));
    }
  }, [currentUser, activeTab]);

  // Checkout: Assign devices in batch to personnel
  const assignDevicesToPersonnel = (
    deviceIds: string[],
    personnelId: string,
    notes?: string
  ): boolean => {
    const targetPersonnel = personnel.find(p => p.id === personnelId);
    if (!targetPersonnel || deviceIds.length === 0) return false;

    const dateStr = nowStr();
    const operatorName = currentUser?.name || 'Depo Sorumlusu';

    setDevices(prev =>
      prev.map(device => {
        if (deviceIds.includes(device.id)) {
          const newHistoryItem = {
            id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: dateStr,
            action: 'Personele Teslim Edildi (Zimmet)',
            personnelName: targetPersonnel.name,
            performedBy: `${operatorName} (${currentUser?.roleTitle || 'Depo'})`,
            note: notes || `${targetPersonnel.team} saha çalışması için zimmetlendi.`,
          };

          return {
            ...device,
            status: 'SAHADA',
            assignedPersonnelId: targetPersonnel.id,
            assignedPersonnelName: targetPersonnel.name,
            assignedDate: dateStr,
            history: [newHistoryItem, ...device.history],
          };
        }
        return device;
      })
    );

    return true;
  };

  // Create Dispatched Transfer Package (Depo -> Teknik / Saha)
  const createTransferPackage = (
    deviceIds: string[],
    targetPersonnelId: string,
    notes?: string
  ): TransferPackage | null => {
    if (deviceIds.length === 0) return null;

    const dateStr = nowStr();
    const operatorName = currentUser?.name || 'Depo Sorumlusu';
    const operatorRole = currentUser?.roleTitle || 'Depo Operasyon';

    const isTargetTeknik =
      targetPersonnelId === 'usr-teknik' ||
      targetPersonnelId === 'teknik' ||
      targetPersonnelId === 'teknik-dept';

    let targetName = 'Teknik Servis (Emre Yıldız)';
    let targetRole: 'TEKNIK' | 'SAHA' = 'TEKNIK';

    if (isTargetTeknik) {
      targetName = 'Emre Yıldız (Teknik Servis & RMA Şefi)';
      targetRole = 'TEKNIK';
    } else {
      const targetPerson = personnel.find(p => p.id === targetPersonnelId);
      if (targetPerson) {
        targetName = `${targetPerson.name} (${targetPerson.team})`;
        targetRole = 'SAHA';
      }
    }

    const packageNumber = `PKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const packageId = `pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const selectedDevices = devices.filter(d => deviceIds.includes(d.id));
    const devicesSummary = selectedDevices.map(d => ({
      id: d.id,
      serialNumber: d.serialNumber,
      itemCode: d.itemCode,
      name: d.name,
      model: d.model,
      category: d.category,
    }));

    const newPackage: TransferPackage = {
      id: packageId,
      packageNumber,
      senderName: `${operatorName} (${operatorRole})`,
      senderRole: 'DEPO',
      targetPersonnelId,
      targetName,
      targetRole,
      deviceIds,
      devicesSummary,
      status: 'ONAY_BEKLIYOR',
      notes:
        notes ||
        (isTargetTeknik
          ? 'Teknik servis inceleme / bakım için sevk edilen paket.'
          : 'Saha montaj ve kurulum sepeti.'),
      createdAt: dateStr,
    };

    // Update devices to status TRANSFERDE
    setDevices(prev =>
      prev.map(device => {
        if (deviceIds.includes(device.id)) {
          const newHistoryItem = {
            id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: dateStr,
            action: 'Depodan Sevk Edildi (Paket Hazırlandı)',
            personnelName: targetName,
            performedBy: `${operatorName} (${operatorRole})`,
            note: `Paket (${packageNumber}) hazırlandı ve sevk edildi. Alıcı onayı bekleniyor.${
              notes ? ` Not: ${notes}` : ''
            }`,
          };

          return {
            ...device,
            status: 'TRANSFERDE' as DeviceStatus,
            assignedPersonnelId: targetPersonnelId,
            assignedPersonnelName: targetName,
            assignedDate: dateStr,
            history: [newHistoryItem, ...device.history],
          };
        }
        return device;
      })
    );

    setPackages(prev => [newPackage, ...prev]);

    // Send dispatch notification
    addNotification({
      type: 'PACKAGE_DISPATCH',
      actorName: operatorName,
      actorRole: 'Depo',
      title: `${operatorName}, ${targetName} için malzeme çıkışı yaptı`,
      description: `${packageNumber} nolu sepet (${deviceIds.length} cihaz) hazırlanarak sevk edildi. Alıcı teslim onayı bekleniyor.`,
      targetId: packageId,
      linkTab: 'package_approvals',
    });

    return newPackage;
  };

  // Accept Dispatched Package (Teknik / Alıcı sepeti kontrol edip kabul eder ve zimmete alır)
  const acceptTransferPackage = (packageId: string): boolean => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg || pkg.status !== 'ONAY_BEKLIYOR') return false;

    const dateStr = nowStr();
    const accepterName = currentUser?.name || 'Yetkili';
    const accepterRole =
      currentUser?.roleTitle || (currentUser?.role === 'TEKNIK' ? 'Teknik Servis' : 'Saha');

    // Update package status to KABUL_EDILDI
    setPackages(prev =>
      prev.map(p =>
        p.id === packageId
          ? {
              ...p,
              status: 'KABUL_EDILDI',
              respondedAt: dateStr,
              respondedBy: `${accepterName} (${accepterRole})`,
            }
          : p
      )
    );

    // Update devices to TEKNIKTE or SAHADA
    setDevices(prev =>
      prev.map(device => {
        if (pkg.deviceIds.includes(device.id)) {
          const isTeknik = pkg.targetRole === 'TEKNIK' || pkg.targetPersonnelId === 'usr-teknik';
          const newStatus: DeviceStatus = isTeknik ? 'TEKNIKTE' : 'SAHADA';

          const newHistoryItem = {
            id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: dateStr,
            action: 'Zimmet Kabul Edildi (Paket Onaylandı)',
            personnelName: pkg.targetName,
            performedBy: `${accepterName} (${accepterRole})`,
            note: `Paket (${pkg.packageNumber}) fiziki kontrolleri yapıldı, sağlam teslim alındı ve zimmete geçirildi.`,
          };

          return {
            ...device,
            status: newStatus,
            technicalStatus: isTeknik ? 'INCELEMEDE' : device.technicalStatus,
            shelfLocation: isTeknik ? 'TEKNIK-RAF' : device.shelfLocation,
            assignedPersonnelId: pkg.targetPersonnelId,
            assignedPersonnelName: pkg.targetName,
            assignedDate: dateStr,
            history: [newHistoryItem, ...device.history],
          };
        }
        return device;
      })
    );

    // Live Notification for Depo
    addNotification({
      type: 'PACKAGE_APPROVAL',
      actorName: accepterName,
      actorRole: accepterRole,
      title: `${accepterName} malzemeleri onayladı`,
      description: `${pkg.packageNumber} nolu teslimat paketindeki ${pkg.devicesSummary.length} adet cihaz teslim alınıp zimmete geçirildi.`,
      targetId: pkg.id,
      linkTab: 'package_approvals',
    });

    return true;
  };

  // Reject Dispatched Package (Teknik / Alıcı paketi reddeder)
  const rejectTransferPackage = (packageId: string, reason: string): boolean => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg || pkg.status !== 'ONAY_BEKLIYOR') return false;

    const dateStr = nowStr();
    const rejecterName = currentUser?.name || 'Yetkili';
    const rejecterRole =
      currentUser?.roleTitle || (currentUser?.role === 'TEKNIK' ? 'Teknik Servis' : 'Saha');

    setPackages(prev =>
      prev.map(p =>
        p.id === packageId
          ? {
              ...p,
              status: 'REDDEDILDI',
              respondedAt: dateStr,
              respondedBy: `${rejecterName} (${rejecterRole})`,
              rejectionReason: reason,
            }
          : p
      )
    );

    // Revert devices to DEPODA
    setDevices(prev =>
      prev.map(device => {
        if (pkg.deviceIds.includes(device.id)) {
          const newHistoryItem = {
            id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: dateStr,
            action: 'Teslimat Reddedildi (Depoya Döndü)',
            personnelName: pkg.targetName,
            performedBy: `${rejecterName} (${rejecterRole})`,
            note: `Paket (${pkg.packageNumber}) reddedildi: "${reason}". Cihaz depoya geri döndü.`,
          };

          return {
            ...device,
            status: 'DEPODA' as DeviceStatus,
            assignedPersonnelId: null,
            assignedPersonnelName: null,
            history: [newHistoryItem, ...device.history],
          };
        }
        return device;
      })
    );

    // Live Notification for Depo
    addNotification({
      type: 'PACKAGE_REJECTION',
      actorName: rejecterName,
      actorRole: rejecterRole,
      title: `${rejecterName} teslimat paketini reddetti`,
      description: `${pkg.packageNumber} nolu sepet reddedildi ve cihazlar depoya geri döndürüldü. Gerekçe: ${reason}`,
      targetId: pkg.id,
      linkTab: 'package_approvals',
    });

    return true;
  };

  // Add new device
  const addDevice = (deviceData: Omit<Device, 'id' | 'createdAt' | 'history'>) => {
    const dateStr = nowStr();
    const operatorName = currentUser?.name || 'Sistem';

    const newDevice: Device = {
      ...deviceData,
      id: `dev-${Date.now()}`,
      createdAt: dateStr.split(' ')[0],
      history: [
        {
          id: `hist-${Date.now()}`,
          date: dateStr,
          action: 'Yeni Cihaz Depo Girişi',
          performedBy: `${operatorName} (${currentUser?.roleTitle || 'Depo'})`,
          note: 'Sisteme ilk stok kaydı açıldı.',
        },
      ],
    };

    setDevices(prev => [newDevice, ...prev]);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const deleteDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  // Returns Management (Kullanıcı cihaz seçmeden sadece seri no yazar, stokta olmasa bile eklenir, toplu giriş desteklenir)
  const createReturnRequest = (
    serialNumber: string,
    notes: string
  ): boolean => {
    return createBulkReturnRequests([serialNumber], notes) > 0;
  };

  const createBulkReturnRequests = (
    serialNumbers: string[],
    notes: string
  ): number => {
    const cleanSerials = Array.from(
      new Set(
        serialNumbers
          .map(s => s.trim().toUpperCase())
          .filter(s => s.length > 0)
      )
    );

    if (cleanSerials.length === 0) return 0;

    const submitterName = currentUser?.name || 'Yetkili';
    const submitterRole = currentUser?.roleTitle || 'Ön Ofis';
    const dateStr = nowStr();

    const newReqs: ReturnRequest[] = [];
    const matchedDeviceIds: string[] = [];

    cleanSerials.forEach((sn, idx) => {
      const existing = devices.find(d => d.serialNumber.toUpperCase() === sn);
      if (existing) {
        matchedDeviceIds.push(existing.id);
      }

      newReqs.push({
        id: `ret-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        deviceId: existing ? existing.id : undefined,
        serialNumber: sn,
        deviceName: existing ? existing.name : `İade Cihazı (${sn})`,
        submittedByName: submitterName,
        submittedByRole: submitterRole,
        notes: notes.trim() || 'İade onaya gönderildi.',
        status: 'BEKLEMEDE',
        createdAt: dateStr,
      });
    });

    // Update matched existing devices status to 'IADE_SURECINDE'
    if (matchedDeviceIds.length > 0) {
      setDevices(prev =>
        prev.map(d => {
          if (matchedDeviceIds.includes(d.id)) {
            const newHist = {
              id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              date: dateStr,
              action: 'İade Talebi Açıldı (Onay Bekliyor)',
              personnelName: submitterName,
              performedBy: `${submitterName} (${submitterRole})`,
              note: notes.trim() ? `İade Notu: ${notes.trim()}` : 'İade onaya gönderildi.',
            };
            return {
              ...d,
              status: 'IADE_SURECINDE',
              history: [newHist, ...d.history],
            };
          }
          return d;
        })
      );
    }

    setReturnRequests(prev => [...newReqs, ...prev]);

    // Live Notification for Depo
    addNotification({
      type: 'RETURN_SUBMITTED',
      actorName: submitterName,
      actorRole: submitterRole,
      title: `${submitterName} iade gönderdi`,
      description: `${cleanSerials.length} adet cihaz (${cleanSerials.slice(0, 2).join(', ')}${cleanSerials.length > 2 ? '...' : ''}) depoya iade onayına gönderildi.${notes.trim() ? ` Not: ${notes.trim()}` : ''}`,
      targetId: newReqs[0]?.id,
      linkTab: 'returns',
    });

    return cleanSerials.length;
  };

  const acceptReturnRequest = (requestId: string, notes?: string) => {
    const targetReq = returnRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    const dateStr = nowStr();
    const operatorName = currentUser?.name || 'Depo Yetkilisi';

    // Update return request status
    setReturnRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'KABUL_EDILDI',
              processedAt: dateStr,
              processedBy: operatorName,
            }
          : r
      )
    );

    // Cihaz sistemde zaten var mı kontrol et (id veya seri no ile)
    const existing = devices.find(
      d =>
        (targetReq.deviceId && d.id === targetReq.deviceId) ||
        d.serialNumber.toUpperCase() === targetReq.serialNumber.toUpperCase()
    );

    if (existing) {
      setDevices(prev =>
        prev.map(d => {
          if (d.id === existing.id) {
            const newHist = {
              id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              date: dateStr,
              action: 'İade Depoya Kabul Edildi',
              performedBy: `${operatorName} (${currentUser?.roleTitle || 'Depo'})`,
              note: notes || 'Fiziksel ve teknik kontroller tamamlandı, depoya geri alındı.',
            };
            return {
              ...d,
              status: 'DEPODA',
              assignedPersonnelId: null,
              assignedPersonnelName: null,
              assignedDate: null,
              history: [newHist, ...d.history],
            };
          }
          return d;
        })
      );
    } else {
      // Cihaz sistemde önceden kayıtlı değilse bile depoya yeni stok olarak otomatik kaydedilir!
      const newDev: Device = {
        id: `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        serialNumber: targetReq.serialNumber.toUpperCase(),
        itemCode: 'KLM-IADE-GEN',
        name: targetReq.deviceName || `İade Alınan Cihaz (${targetReq.serialNumber})`,
        model: 'Standart Cihaz',
        category: 'Modem & Router',
        isSecondaryHardware: false,
        status: 'DEPODA',
        shelfLocation: 'İADE-KABUL-RAF',
        createdAt: dateStr.split(' ')[0],
        history: [
          {
            id: `hist-${Date.now()}`,
            date: dateStr,
            action: 'İade Kabul Edilerek Stok Kaydı Açıldı',
            performedBy: `${operatorName} (${currentUser?.roleTitle || 'Depo'})`,
            note: notes || `${targetReq.submittedByName} tarafından gönderilen iade depoya kabul edildi.`,
          },
        ],
      };
      setDevices(prev => [newDev, ...prev]);
    }

    // Live Notification for Depo
    addNotification({
      type: 'RETURN_APPROVED',
      actorName: operatorName,
      actorRole: 'Depo',
      title: `İade depoya kabul edildi: ${targetReq.serialNumber}`,
      description: `${targetReq.submittedByName} tarafından gönderilen ${targetReq.deviceName} depoya fiziki kabulü yapılarak stoğa alındı.`,
      targetId: requestId,
      linkTab: 'returns',
    });
  };

  const rejectReturnRequest = (requestId: string, notes?: string) => {
    const targetReq = returnRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    const dateStr = nowStr();
    const operatorName = currentUser?.name || 'Depo Yetkilisi';

    setReturnRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'REDDEDILDI',
              processedAt: dateStr,
              processedBy: operatorName,
            }
          : r
      )
    );

    // Return device back to previous assigned state
    setDevices(prev =>
      prev.map(d => {
        if (d.id === targetReq.deviceId) {
          const newHist = {
            id: `hist-${Date.now()}`,
            date: dateStr,
            action: 'İade Talebi Reddedildi',
            performedBy: `${operatorName} (${currentUser?.roleTitle || 'Depo'})`,
            note: notes || 'Fiziksel eksiklik veya hasar nedeniyle iade reddedildi, personelde kaldı.',
          };
          return {
            ...d,
            status: 'SAHADA',
            history: [newHist, ...d.history],
          };
        }
        return d;
      })
    );

    // Live Notification for Depo
    addNotification({
      type: 'RETURN_REJECTED',
      actorName: operatorName,
      actorRole: 'Depo',
      title: `İade reddedildi: ${targetReq.serialNumber}`,
      description: `${targetReq.submittedByName} tarafından gönderilen ${targetReq.deviceName} depoya kabul edilmedi.${notes ? ` Gerekçe: ${notes}` : ''}`,
      targetId: requestId,
      linkTab: 'returns',
    });
  };

  // Personnel Management
  const addPersonnel = (p: Omit<Personnel, 'id'>) => {
    const newPerson: Personnel = {
      ...p,
      id: `per-${Date.now()}`,
    };
    setPersonnel(prev => [...prev, newPerson]);
  };

  // User Management
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Real Excel (.xlsx) Export using SheetJS
  const exportDevicesToExcel = (devicesToExport?: Device[], filename?: string) => {
    const targetDevices = devicesToExport || devices;
    const excelData = targetDevices.map(d => ({
      'Seri Numarası': d.serialNumber,
      'Kalem Kodu': d.itemCode,
      'Ürün Adı': d.name,
      'Model': d.model,
      'Kategori': d.category,
      '2. Donanım mı?': d.isSecondaryHardware ? 'Evet' : 'Hayır',
      'Güncel Durum': d.status,
      'Zimmetli Personel': d.assignedPersonnelName || '-',
      'Zimmet Tarihi': d.assignedDate || '-',
      'Depo Raf Konumu': d.shelfLocation,
      'MAC Adresi': d.macAddress || '-',
      'Kayıt Tarihi': d.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Envanter Listesi');

    // Generate buffer & trigger native download
    const exportFileName = filename || `DepoPro_Envanter_${nowStr().split(' ')[0]}.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
  };

  // Excel Reconciliation (Merkez Stok Listesi ile Karşılaştırma)
  const reconcileWithExcel = async (file: File): Promise<ReconciliationResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          // Extract serial numbers from Excel (looking for keys containing 'seri', 'serial', 'sn')
          const excelSerialSet = new Set<string>();
          jsonData.forEach(row => {
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('seri') || lowerKey.includes('serial') || lowerKey.includes('sn')) {
                const val = String(row[key]).trim();
                if (val) excelSerialSet.add(val.toUpperCase());
              }
            }
          });

          // Perform Comparison
          const systemSerialMap = new Map(devices.map(d => [d.serialNumber.toUpperCase(), d]));

          const consumedInField: ReconciliationResult['consumedInField'] = [];
          const onlyInSystem: ReconciliationResult['onlyInSystem'] = [];
          let matchedCount = 0;

          // 1. Check system devices against Excel
          devices.forEach(dev => {
            const snUpper = dev.serialNumber.toUpperCase();
            if (excelSerialSet.has(snUpper)) {
              matchedCount++;
            } else {
              // Device exists in our system, but missing in central Excel!
              if (dev.status === 'SAHADA') {
                // Sahada müşteriye takılarak merkez listesinden düşmüş cihaz!
                consumedInField.push({
                  serialNumber: dev.serialNumber,
                  name: dev.name,
                  itemCode: dev.itemCode,
                  assignedPersonnelName: dev.assignedPersonnelName || undefined,
                  detectedStatus: 'Müşteriye Takılmış / Listeden Düşmüş',
                });
              } else {
                onlyInSystem.push({
                  serialNumber: dev.serialNumber,
                  name: dev.name,
                  status: dev.status,
                });
              }
            }
          });

          // 2. Devices in Excel but not in our system
          const onlyInExcel: ReconciliationResult['onlyInExcel'] = [];
          excelSerialSet.forEach(sn => {
            if (!systemSerialMap.has(sn)) {
              onlyInExcel.push({ serialNumber: sn });
            }
          });

          resolve({
            totalInSystem: devices.length,
            totalInExcel: excelSerialSet.size,
            matchedCount,
            consumedInField,
            onlyInSystem,
            onlyInExcel,
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = err => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  // Apply Reconciliation (Drop consumed devices from personnel/system)
  const applyReconciliation = (result: ReconciliationResult) => {
    const consumedSNs = new Set(result.consumedInField.map(c => c.serialNumber.toUpperCase()));
    const dateStr = nowStr();
    const operatorName = currentUser?.name || 'Backofis Yetkilisi';

    setDevices(prev =>
      prev.map(dev => {
        if (consumedSNs.has(dev.serialNumber.toUpperCase())) {
          const newHist = {
            id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: dateStr,
            action: 'Mutabakatla Düşürüldü (Müşteriye Takıldı)',
            performedBy: `${operatorName} (Excel Mutabakatı)`,
            note: 'Merkez Excel listesinde bulunamadı; sahada aboneye aktif edilerek eritildiği teyit edildi.',
          };
          return {
            ...dev,
            status: 'HURDA' as any, // veya sistem dışı / müşteride
            notes: 'Müşteriye takıldı (Merkez Mutabakatı ile düşüldü)',
            history: [newHist, ...dev.history],
          };
        }
        return dev;
      })
    );
  };

  // -------------------------------------------------------------
  // DEPO İÇİN EXCEL İLE STOK YÜKLEME, TARAMA & BİLGİ GÜNCELLEME
  // -------------------------------------------------------------
  const scanStockExcelFile = (file: File): Promise<StockExcelScanResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            throw new Error('Yüklenen Excel dosyasında okunabilir veri satırı bulunamadı.');
          }

          const parsedRows: StockExcelRow[] = [];
          let newCount = 0;
          let updateCount = 0;
          let noChangeCount = 0;
          let invalidCount = 0;

          rawRows.forEach((row, index) => {
            const rowNumber = index + 2;

            // Helper for flexible header matching
            const getValue = (...keys: string[]): string => {
              for (const k of keys) {
                if (row[k] !== undefined && String(row[k]).trim() !== '') {
                  return String(row[k]).trim();
                }
                const foundKey = Object.keys(row).find(
                  rk => rk.trim().toLowerCase() === k.trim().toLowerCase()
                );
                if (foundKey && String(row[foundKey]).trim() !== '') {
                  return String(row[foundKey]).trim();
                }
              }
              return '';
            };

            // Helper to check if any of the given keys exist in row headers
            const hasKey = (...keys: string[]): boolean => {
              return keys.some(k => {
                if (row[k] !== undefined) return true;
                return Object.keys(row).some(rk => rk.trim().toLowerCase() === k.trim().toLowerCase());
              });
            };

            const rawSerial = getValue(
              'SERİ NO',
              'SERİ NUMARASI',
              'SERI NO',
              'SERI NUMARASI',
              'SERI_NO',
              'SERIAL',
              'SERIAL NUMBER',
              'SERIAL_NO',
              'SN',
              'BARKOD',
              'BARCODE'
            );
            const serialNumber = rawSerial.toUpperCase().trim();
            const name = getValue(
              'ÜRÜN ADI',
              'URUN ADI',
              'URUN_ADI',
              'ÜRÜN',
              'URUN',
              'CİHAZ ADI',
              'CIHAZ ADI',
              'CİHAZ',
              'CIHAZ',
              'DEVICE NAME',
              'DEVICE',
              'NAME'
            ) || (serialNumber ? `Cihaz (${serialNumber})` : 'Bilinmeyen Cihaz');

            const itemCode = getValue(
              'KALEM KODU',
              'KALEM_KODU',
              'STOK KODU',
              'ITEM_CODE',
              'MALZEME KODU',
              'KOD'
            ) || 'KLM-GEN-01';

            const model = getValue(
              'MODEL',
              'MODELİ',
              'MODELI',
              'CİHAZ MODELİ',
              'CIHAZ MODELI'
            ) || 'Standart Model';

            const rawCategory = getValue('KATEGORİ', 'KATEGORI', 'CATEGORY', 'TÜR');
            const shelfLocation = getValue('RAF KONUMU', 'RAF', 'LOKASYON', 'SHELF', 'DEPO KONUMU') || 'GENEL-RAF';
            const notes = getValue('NOT', 'NOTLAR', 'AÇIKLAMA', 'NOTES', 'DESCRIPTION') || '';

            const rawCondition = getValue(
              'STATÜ',
              'STATU',
              'STATÜSÜ',
              'STATUSU',
              'DURUM',
              'DURUMU',
              'CİHAZ STATÜSÜ',
              'CIHAZ STATUSU',
              'CİHAZ STATÜ',
              'CIHAZ STATU',
              'FİZİKSEL DURUM',
              'FIZIKSEL DURUM',
              'STATUS',
              'CONDITION',
              'CİHAZ DURUMU',
              'CIHAZ DURUMU'
            );

            // Normalize condition based on user guidelines:
            // "sağlam", "aktif", "çalışıyor", "stokta" -> Sağlam
            // "arızalı", "arıza", "bozuk", "tamirde" -> Arızalı
            // "karantina", "karantinada", "incelemede", "test" -> Karantinada
            // "hurda", "pert" -> Hurda
            // "sağlam dönen" -> Sağlam Dönen
            const normalizeCondition = (val: string): 'Sağlam' | 'Arızalı' | 'Karantinada' | 'Sağlam Dönen' | 'Hurda' | string => {
              const v = val.trim().toLowerCase();
              if (!v) return 'Sağlam';
              if (v.includes('hurda') || v.includes('pert') || v.includes('scrap')) {
                return 'Hurda';
              }
              if (v.includes('dönen') || v.includes('donen') || v.includes('dönüş') || v.includes('donus') || v.includes('iade')) {
                return 'Sağlam Dönen';
              }
              if (v.includes('karantin') || v.includes('quarantine') || v.includes('inceleme') || v.includes('test')) {
                return 'Karantinada';
              }
              if (v.includes('arız') || v.includes('ariz') || v.includes('fault') || v.includes('defect') || v.includes('bozuk') || v.includes('hasar') || v.includes('tamir')) {
                return 'Arızalı';
              }
              if (v.includes('sağlam') || v.includes('saglam') || v.includes('aktif') || v.includes('çalış') || v.includes('calis') || v.includes('stokta') || v.includes('ok') || v.includes('iyi') || v.includes('faal')) {
                return 'Sağlam';
              }
              return val.trim();
            };

            const condition = normalizeCondition(rawCondition);

            // Flexible Personnel / Zimmet Column Detection
            const personnelKeys = [
              'ZİMMETLİ KİŞİ',
              'ZIMMETLI KISI',
              'ZİMMETLİ',
              'ZIMMETLI',
              'ZİMMET',
              'ZIMMET',
              'PERSONEL',
              'PERSONEL ADI',
              'SAHİBİ',
              'SAHIBI',
              'KULLANICI',
              'KULLANICI ADI',
              'KULLANICI_ADI',
              'ASSIGNED TO',
              'ASSIGNED_TO',
              'ASSIGNED',
              'USER'
            ];
            const hasPersonnelColumn = hasKey(...personnelKeys);
            const rawPersonnel = hasPersonnelColumn ? getValue(...personnelKeys) : '';

            // Match personnel name to known list if available
            let assignedPersonnelName: string | null = null;
            let assignedPersonnelId: string | null = null;
            let targetStatus: DeviceStatus = 'DEPODA';

            if (hasPersonnelColumn) {
              if (rawPersonnel) {
                assignedPersonnelName = rawPersonnel;
                const matchedUser = users.find(u => u.name.toLowerCase() === rawPersonnel.toLowerCase());
                const matchedPers = personnel.find(p => p.name.toLowerCase() === rawPersonnel.toLowerCase());
                assignedPersonnelId = matchedUser?.id || matchedPers?.id || `usr-${rawPersonnel.toLowerCase().replace(/\s+/g, '-')}`;
                const isTeknik = (matchedUser?.role === 'TEKNIK') || rawPersonnel.toLowerCase().includes('teknik');
                targetStatus = isTeknik ? 'TEKNIKTE' : 'SAHADA';
              } else {
                // Sütun var ama hücre boş: Cihazı zimmetten düşürüp Ana Depo Stoğu'na çek
                assignedPersonnelName = null;
                assignedPersonnelId = null;
                targetStatus = 'DEPODA';
              }
            }

            let category: any = 'Modem & Router';
            const lowerCat = rawCategory.toLowerCase();
            if (lowerCat.includes('set') || lowerCat.includes('tv') || lowerCat.includes('stb') || lowerCat.includes('box')) {
              category = 'Set-Top Box & TV';
            } else if (lowerCat.includes('tablet')) {
              category = 'Tablet';
            } else if (lowerCat.includes('kamera') || lowerCat.includes('camera')) {
              category = 'Kamera';
            } else if (lowerCat.includes('güçlendirici') || lowerCat.includes('wifi') || lowerCat.includes('extender')) {
              category = 'Wi-Fi Güçlendirici';
            } else if (lowerCat.includes('terminal') || lowerCat.includes('el')) {
              category = 'El Terminali';
            } else if (lowerCat.includes('switch') || lowerCat.includes('ağ') || lowerCat.includes('network')) {
              category = 'Ağ & Switch';
            }

            const isSecondary = ['Tablet', 'Kamera', 'Wi-Fi Güçlendirici', 'El Terminali'].includes(category);

            if (!serialNumber) {
              invalidCount++;
              parsedRows.push({
                rowNumber,
                serialNumber: '-',
                name,
                itemCode,
                model,
                category,
                shelfLocation,
                status: 'DEPODA',
                condition,
                isSecondaryHardware: isSecondary,
                notes,
                actionType: 'INVALID',
                changeDetails: ['Seri numarası hücresi boş veya eksik'],
              });
              return;
            }

            // Check if device already exists in system (Upsert Primary Key: Serial Number)
            const existing = devices.find(d => d.serialNumber.toUpperCase() === serialNumber);

            if (existing) {
              const diffs: string[] = [];
              if (name && name !== existing.name && !name.startsWith('Cihaz (')) {
                diffs.push(`İsim: "${existing.name}" ➔ "${name}"`);
              }
              if (itemCode && itemCode !== existing.itemCode) {
                diffs.push(`Kalem Kodu: "${existing.itemCode}" ➔ "${itemCode}"`);
              }
              if (model && model !== existing.model && model !== 'Standart Model') {
                diffs.push(`Model: "${existing.model}" ➔ "${model}"`);
              }
              if (shelfLocation && shelfLocation !== existing.shelfLocation) {
                diffs.push(`Raf: "${existing.shelfLocation}" ➔ "${shelfLocation}"`);
              }
              if (category && category !== existing.category) {
                diffs.push(`Kategori: "${existing.category}" ➔ "${category}"`);
              }
              if (condition && condition !== (existing.condition || 'Sağlam')) {
                diffs.push(`Statü: "${existing.condition || 'Sağlam'}" ➔ "${condition}"`);
              }

              // Handle zimmet change diff
              if (hasPersonnelColumn) {
                if (rawPersonnel && rawPersonnel !== existing.assignedPersonnelName) {
                  diffs.push(`Zimmet: "${existing.assignedPersonnelName || 'Depoda'}" ➔ "${rawPersonnel}"`);
                } else if (!rawPersonnel && existing.assignedPersonnelName) {
                  diffs.push(`Zimmetten Düşürüldü: "${existing.assignedPersonnelName}" ➔ "Ana Depo Stoğu"`);
                }
              }

              if (diffs.length > 0) {
                updateCount++;
                parsedRows.push({
                  rowNumber,
                  serialNumber,
                  name: name && !name.startsWith('Cihaz (') ? name : existing.name,
                  itemCode: itemCode || existing.itemCode,
                  model: model !== 'Standart Model' ? model : existing.model,
                  category: category || existing.category,
                  shelfLocation: shelfLocation || existing.shelfLocation,
                  status: hasPersonnelColumn ? targetStatus : existing.status,
                  condition,
                  assignedPersonnelName: hasPersonnelColumn ? assignedPersonnelName : existing.assignedPersonnelName,
                  assignedPersonnelId: hasPersonnelColumn ? assignedPersonnelId : existing.assignedPersonnelId,
                  hasPersonnelColumn,
                  isSecondaryHardware: isSecondary,
                  notes: notes || existing.notes,
                  actionType: 'UPDATE',
                  changeDetails: diffs,
                  existingDevice: existing,
                });
              } else {
                noChangeCount++;
                parsedRows.push({
                  rowNumber,
                  serialNumber,
                  name: existing.name,
                  itemCode: existing.itemCode,
                  model: existing.model,
                  category: existing.category,
                  shelfLocation: existing.shelfLocation,
                  status: existing.status,
                  condition: existing.condition || 'Sağlam',
                  assignedPersonnelName: existing.assignedPersonnelName,
                  assignedPersonnelId: existing.assignedPersonnelId,
                  hasPersonnelColumn,
                  isSecondaryHardware: existing.isSecondaryHardware,
                  notes: existing.notes,
                  actionType: 'NO_CHANGE',
                  changeDetails: ['Bilgiler sistemdeki kayıtla birebir aynı, değişiklik yok'],
                  existingDevice: existing,
                });
              }
            } else {
              newCount++;
              parsedRows.push({
                rowNumber,
                serialNumber,
                name,
                itemCode,
                model,
                category,
                shelfLocation,
                status: hasPersonnelColumn ? targetStatus : 'DEPODA',
                condition,
                assignedPersonnelName: hasPersonnelColumn ? assignedPersonnelName : null,
                assignedPersonnelId: hasPersonnelColumn ? assignedPersonnelId : null,
                hasPersonnelColumn,
                isSecondaryHardware: isSecondary,
                notes,
                actionType: 'NEW',
                changeDetails: [
                  `Yeni cihaz olarak kaydedilecek (Statü: ${condition}${assignedPersonnelName ? `, Zimmet: ${assignedPersonnelName}` : ''})`
                ],
              });
            }
          });

          resolve({
            fileName: file.name,
            totalRows: rawRows.length,
            validRowsCount: rawRows.length - invalidCount,
            newCount,
            updateCount,
            noChangeCount,
            invalidCount,
            rows: parsedRows,
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = err => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const applyStockExcelUpdates = (scanResult: StockExcelScanResult): StockExcelApplySummary => {
    const dateStr = nowStr();
    const operatorName = currentUser?.name || 'Depo Yetkilisi';
    const operatorRole = currentUser?.roleTitle || 'Depo';

    let newAddedCount = 0;
    let updatedCount = 0;
    const statusChanges: StatusChangeRecord[] = [];

    const newRows = scanResult.rows.filter(r => r.actionType === 'NEW');
    const updateRows = scanResult.rows.filter(r => r.actionType === 'UPDATE');

    const updateMap = new Map<string, StockExcelRow>();
    updateRows.forEach(r => updateMap.set(r.serialNumber.toUpperCase(), r));

    // Update existing devices
    const updatedDevices = devices.map(dev => {
      const updateData = updateMap.get(dev.serialNumber.toUpperCase());
      if (!updateData) return dev;

      updatedCount++;

      // Track condition / status changes (e.g. SN-10293: Arızalı ➔ Sağlam)
      const oldCond = dev.condition || 'Sağlam';
      const newCond = updateData.condition !== undefined ? updateData.condition : oldCond;
      if (oldCond !== newCond) {
        statusChanges.push({
          serialNumber: dev.serialNumber,
          name: updateData.name || dev.name,
          oldCondition: String(oldCond),
          newCondition: String(newCond),
        });
      }

      // Determine target assignment & status:
      let targetStatus: DeviceStatus = dev.status;
      let targetAssignedId = dev.assignedPersonnelId;
      let targetAssignedName = dev.assignedPersonnelName;
      let targetAssignedDate = dev.assignedDate;

      if (updateData.hasPersonnelColumn) {
        if (updateData.assignedPersonnelName) {
          targetAssignedName = updateData.assignedPersonnelName;
          targetAssignedId = updateData.assignedPersonnelId || dev.assignedPersonnelId || 'usr-custom';
          targetAssignedDate = dev.assignedDate || dateStr;
          targetStatus = (targetAssignedName.toLowerCase().includes('teknik') || targetAssignedId === 'usr-teknik')
            ? 'TEKNIKTE'
            : 'SAHADA';
        } else {
          // Boş bırakılmışsa cihazı zimmetten düşürüp Ana Depo Stoğu'na çek
          targetStatus = 'DEPODA';
          targetAssignedName = null;
          targetAssignedId = null;
          targetAssignedDate = null;
        }
      }

      const newHist = {
        id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: dateStr,
        action: 'Excel ile Stok Bilgileri Güncellendi',
        performedBy: `${operatorName} (${operatorRole})`,
        note: `Excel güncellemesi: ${updateData.changeDetails.join(', ')}`,
      };

      return {
        ...dev,
        name: updateData.name || dev.name,
        itemCode: updateData.itemCode || dev.itemCode,
        model: updateData.model || dev.model,
        category: updateData.category || dev.category,
        shelfLocation: updateData.shelfLocation || dev.shelfLocation,
        status: targetStatus,
        condition: newCond,
        assignedPersonnelId: targetAssignedId,
        assignedPersonnelName: targetAssignedName,
        assignedDate: targetAssignedDate,
        notes: updateData.notes ? `${dev.notes ? dev.notes + ' | ' : ''}${updateData.notes}` : dev.notes,
        history: [newHist, ...dev.history],
      };
    });

    // Add new devices
    const createdDevices: Device[] = newRows.map((r, idx) => {
      newAddedCount++;

      let targetStatus: DeviceStatus = 'DEPODA';
      let targetAssignedId: string | null = null;
      let targetAssignedName: string | null = null;
      let targetAssignedDate: string | null = null;

      if (r.hasPersonnelColumn && r.assignedPersonnelName) {
        targetAssignedName = r.assignedPersonnelName;
        targetAssignedId = r.assignedPersonnelId || 'usr-custom';
        targetAssignedDate = dateStr;
        targetStatus = (targetAssignedName.toLowerCase().includes('teknik') || targetAssignedId === 'usr-teknik')
          ? 'TEKNIKTE'
          : 'SAHADA';
      }

      return {
        id: `dev-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        serialNumber: r.serialNumber.toUpperCase(),
        itemCode: r.itemCode,
        name: r.name,
        model: r.model,
        category: r.category,
        isSecondaryHardware: r.isSecondaryHardware,
        status: targetStatus,
        condition: r.condition || 'Sağlam',
        assignedPersonnelId: targetAssignedId,
        assignedPersonnelName: targetAssignedName,
        assignedDate: targetAssignedDate,
        shelfLocation: r.shelfLocation,
        createdAt: dateStr.split(' ')[0],
        notes: r.notes || `Excel toplu stok yüklemesi ile eklendi (Statü: ${r.condition || 'Sağlam'}).`,
        history: [
          {
            id: `hist-${Date.now()}-${idx}`,
            date: dateStr,
            action: 'Excel ile Yeni Stok Girişi Yapıldı',
            performedBy: `${operatorName} (${operatorRole})`,
            note: `Toplu Excel yüklemesi (${scanResult.fileName}) ile depoya kaydedildi. Statü: ${r.condition || 'Sağlam'}${targetAssignedName ? ` - Zimmet: ${targetAssignedName}` : ''}.`,
          },
        ],
      };
    });

    setDevices([...createdDevices, ...updatedDevices]);

    // Live Notification for Depo
    addNotification({
      type: 'EXCEL_IMPORT',
      actorName: operatorName,
      actorRole: operatorRole,
      title: 'Toplu Stok Güncellemesi Yapıldı',
      description: `Excel dosyasından (${scanResult.fileName}) ${newAddedCount} yeni cihaz stoğa eklendi, ${updatedCount} cihaz güncellendi.${statusChanges.length > 0 ? ` (${statusChanges.length} cihazın durumu güncellendi)` : ''}`,
      linkTab: 'devices',
    });

    return {
      newAddedCount,
      updatedCount,
      totalProcessed: newAddedCount + updatedCount,
      statusChanges,
    };
  };

  const downloadStockExcelTemplate = () => {
    const templateData = [
      {
        'SERİ NUMARASI': 'SN-MOD-2026-001',
        'ÜRÜN ADI': 'Huawei AX3 Dual Band Wi-Fi 6 Router',
        'KALEM KODU': 'KLM-MOD-AX3',
        'MODEL': 'WS7100 V2',
        'KATEGORİ': 'Modem & Router',
        'STATÜ': 'Sağlam',
        'ZİMMETLİ KİŞİ': '',
        'RAF KONUMU': 'RAF-A01',
        'AÇIKLAMA': 'Sıfır kutulu tedarik partisi',
      },
      {
        'SERİ NUMARASI': 'SN-STB-2026-002',
        'ÜRÜN ADI': 'Sagemcom 4K Android TV Box',
        'KALEM KODU': 'KLM-STB-4K',
        'MODEL': 'DIW7022',
        'KATEGORİ': 'Set-Top Box & TV',
        'STATÜ': 'Arıza',
        'ZİMMETLİ KİŞİ': 'Emre Yıldız (Teknik)',
        'RAF KONUMU': 'TEKNIK-RAF',
        'AÇIKLAMA': 'Görüntü çıkışı vermiyor, arızalı cihaz',
      },
      {
        'SERİ NUMARASI': 'SN-WIFI-2026-003',
        'ÜRÜN ADI': 'TP-Link RE305 Mesh Wi-Fi Extender',
        'KALEM KODU': 'KLM-WIFI-EXT',
        'MODEL': 'RE305 V4',
        'KATEGORİ': 'Wi-Fi Güçlendirici',
        'STATÜ': 'Karantina',
        'ZİMMETLİ KİŞİ': '',
        'RAF KONUMU': 'KARANTINA-01',
        'AÇIKLAMA': 'Parti bazlı test için karantinaya alındı',
      },
      {
        'SERİ NUMARASI': 'SN-TAB-2026-004',
        'ÜRÜN ADI': 'Samsung Galaxy Tab A9 64GB',
        'KALEM KODU': 'KLM-TAB-S01',
        'MODEL': 'SM-X110',
        'KATEGORİ': 'Tablet',
        'STATÜ': 'Sağlam Dönen',
        'ZİMMETLİ KİŞİ': 'Ahmet Özer (Saha)',
        'RAF KONUMU': 'RAF-D01',
        'AÇIKLAMA': 'Abonelik iptali sonrası depoya sağlam dönen cihaz',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Depo Stok Listesi');
    XLSX.writeFile(workbook, 'Depo_Stok_Yukleme_Sablonu.xlsx');
  };

  const createSampleStockExcelFile = (): File => {
    // Generates an in-memory sample Excel containing:
    // - 3 existing devices with updated shelf locations / models / statü / zimmet
    // - 5 brand new devices demonstrating all statü variations (Sağlam, Arıza, Karantina, Sağlam Dönen)
    const sampleRows = [
      {
        'SERİ NUMARASI': devices[0]?.serialNumber || 'SN-MOD-88201',
        'ÜRÜN ADI': devices[0]?.name || 'ZTE ZXHN H3600 V9 Wi-Fi 6 Modem',
        'KALEM KODU': devices[0]?.itemCode || 'KLM-MOD-01',
        'MODEL': 'H3600 V9.2 Güncel',
        'KATEGORİ': 'Modem & Router',
        'STATÜ': 'Sağlam',
        'ZİMMETLİ KİŞİ': '',
        'RAF KONUMU': 'RAF-YENI-A99',
        'AÇIKLAMA': 'Yeni rafa taşındı & revizyon güncellendi',
      },
      {
        'SERİ NUMARASI': devices[1]?.serialNumber || 'SN-MOD-88202',
        'ÜRÜN ADI': devices[1]?.name || 'ZTE ZXHN H3600 V9 Wi-Fi 6 Modem',
        'KALEM KODU': devices[1]?.itemCode || 'KLM-MOD-01',
        'MODEL': devices[1]?.model || 'H3600 V9',
        'KATEGORİ': 'Modem & Router',
        'STATÜ': 'Sağlam Dönen',
        'RAF KONUMU': devices[1]?.shelfLocation || 'RAF-A02',
        'AÇIKLAMA': 'Saha iadesinden depoya sağlam dönen',
      },
      {
        'SERİ NUMARASI': 'SN-YENI-STOK-101',
        'ÜRÜN ADI': 'Huawei OptiXstar HG8245X6 GPON Wi-Fi 6',
        'KALEM KODU': 'KLM-GPON-01',
        'MODEL': 'HG8245X6',
        'KATEGORİ': 'Modem & Router',
        'STATÜ': 'Sağlam',
        'RAF KONUMU': 'RAF-GPON-01',
        'AÇIKLAMA': 'Merkez sevkiyat sıfır kutulu parti',
      },
      {
        'SERİ NUMARASI': 'SN-YENI-STOK-102',
        'ÜRÜN ADI': 'Huawei OptiXstar HG8245X6 GPON Wi-Fi 6',
        'KALEM KODU': 'KLM-GPON-01',
        'MODEL': 'HG8245X6',
        'KATEGORİ': 'Modem & Router',
        'STATÜ': 'Arıza',
        'RAF KONUMU': 'TEKNIK-RAF',
        'AÇIKLAMA': 'Güç ışığı yanmıyor, arızalı geldi',
      },
      {
        'SERİ NUMARASI': 'SN-YENI-STOK-103',
        'ÜRÜN ADI': 'Sagemcom 4K Android IPTV Box',
        'KALEM KODU': 'KLM-STB-01',
        'MODEL': 'DIW7022',
        'KATEGORİ': 'Set-Top Box & TV',
        'STATÜ': 'Karantina',
        'RAF KONUMU': 'KARANTINA-02',
        'AÇIKLAMA': 'Yazılım güvenlik kontrolü için karantinaya alındı',
      },
      {
        'SERİ NUMARASI': 'SN-YENI-STOK-104',
        'ÜRÜN ADI': 'ZTE Mesh Wi-Fi 6 Extender',
        'KALEM KODU': 'KLM-WIFI-02',
        'MODEL': 'H196A V2',
        'KATEGORİ': 'Wi-Fi Güçlendirici',
        'STATÜ': 'Sağlam Dönen',
        'RAF KONUMU': 'RAF-EXT-04',
        'AÇIKLAMA': 'Depoya sağlam dönen cihaz',
      },
      {
        'SERİ NUMARASI': 'SN-YENI-STOK-105',
        'ÜRÜN ADI': 'Honeywell ScanPal EDA52 El Terminali',
        'KALEM KODU': 'KLM-TRM-01',
        'MODEL': 'EDA52 Android',
        'KATEGORİ': 'El Terminali',
        'STATÜ': 'Sağlam',
        'RAF KONUMU': 'RAF-GUV-01',
        'AÇIKLAMA': 'Saha sayım terminali',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Depo Stok');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new File([excelBuffer], 'Ornek_Depo_Stok_Guncelleme.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  };

  // Full Database JSON Backup & Restore
  const exportDatabaseJSON = () => {
    const fullBackup = {
      version: '2.0',
      exportedAt: nowStr(),
      company: settings.companyName,
      users,
      personnel,
      devices,
      returnRequests,
      settings,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DepoPro_Sistem_Yedegi_${nowStr().split(' ')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.devices && parsed.personnel) {
        if (parsed.users) setUsers(parsed.users);
        if (parsed.personnel) setPersonnel(parsed.personnel);
        if (parsed.devices) setDevices(parsed.devices);
        if (parsed.returnRequests) setReturnRequests(parsed.returnRequests);
        if (parsed.settings) setSettings(parsed.settings);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setCurrentUser(null);
    setUsers(INITIAL_USERS);
    setPersonnel(INITIAL_PERSONNEL);
    setDevices(INITIAL_DEVICES);
    setReturnRequests(INITIAL_RETURNS);
    setPackages(INITIAL_PACKAGES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    setActiveTab('checkout');
  };

  return (
    <WarehouseContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        personnel,
        devices,
        returnRequests,
        packages,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        unreadNotificationsCount,
        settings,
        activeTab,
        setActiveTab,
        loginWithCredentials,
        loginAsRole,
        logout,
        canAccess,
        assignDevicesToPersonnel,
        createTransferPackage,
        acceptTransferPackage,
        rejectTransferPackage,
        addDevice,
        updateDevice,
        deleteDevice,
        createReturnRequest,
        createBulkReturnRequests,
        acceptReturnRequest,
        rejectReturnRequest,
        addPersonnel,
        addUser,
        updateUser,
        deleteUser,
        updateSettings,
        exportDevicesToExcel,
        scanStockExcelFile,
        applyStockExcelUpdates,
        downloadStockExcelTemplate,
        createSampleStockExcelFile,
        reconcileWithExcel,
        applyReconciliation,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToDefaults,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};
