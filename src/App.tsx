import React from 'react';
import { WarehouseProvider, useWarehouse } from './context/WarehouseContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// 7 Core Screens
import { DeviceCheckout } from './components/checkout/DeviceCheckout';
import { ReturnApprovalDesk } from './components/returns/ReturnApprovalDesk';
import { DeviceLookup } from './components/devices/DeviceLookup';
import { PersonnelInventory } from './components/teams/PersonnelInventory';
import { SecondaryHardware } from './components/secondary/SecondaryHardware';
import { UserManagementScreen } from './components/users/UserManagementScreen';
import { ReconciliationScreen } from './components/settings/ReconciliationScreen';
import { StockExcelImportScreen } from './components/stock/StockExcelImportScreen';
import { PackageApprovalScreen } from './components/packages/PackageApprovalScreen';

const AppContent: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, canAccess } = useWarehouse();

  // If user is not logged in, show Department Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Render active page based on role permissions
  const renderPage = () => {
    const defaultRoleTab =
      currentUser.role === 'DEPO'
        ? 'checkout'
        : currentUser.role === 'TEKNIK'
        ? 'package_approvals'
        : currentUser.role === 'ONOFIS'
        ? 'returns'
        : 'devices';

    const effectiveTab = canAccess(activeTab) ? activeTab : defaultRoleTab;

    switch (effectiveTab) {
      case 'checkout':
        return <DeviceCheckout />;
      case 'package_approvals':
        return <PackageApprovalScreen />;
      case 'returns':
        return <ReturnApprovalDesk />;
      case 'devices':
        return <DeviceLookup />;
      case 'stock_import':
        return <StockExcelImportScreen />;
      case 'teams':
        return <PersonnelInventory />;
      case 'secondary':
        return <SecondaryHardware />;
      case 'users':
        return <UserManagementScreen />;
      case 'reconciliation':
        return <ReconciliationScreen />;
      default:
        return <DeviceLookup />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Pane */}
        <main className="flex-1 min-w-0 pb-16 md:pb-6">
          {renderPage()}
        </main>
      </div>

      {/* Mobile Responsive Navigation Bar (Ön Ofis için tek ekran olduğundan alt bar gizlenir) */}
      {currentUser.role !== 'ONOFIS' && (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-50 px-2 py-2 flex justify-around items-center text-[10px] font-bold">
          {canAccess('checkout') && (
            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'checkout' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-barcode text-sm"></i>
              <span>Çıkış</span>
            </button>
          )}

          {canAccess('package_approvals') && (
            <button
              onClick={() => setActiveTab('package_approvals')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'package_approvals' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-boxes-packing text-sm"></i>
              <span>Paketler</span>
            </button>
          )}

          {canAccess('returns') && (
            <button
              onClick={() => setActiveTab('returns')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'returns' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-arrow-rotate-left text-sm"></i>
              <span>İade</span>
            </button>
          )}

          {canAccess('devices') && (
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'devices' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
              <span>Sorgu</span>
            </button>
          )}

          {canAccess('stock_import') && (
            <button
              onClick={() => setActiveTab('stock_import')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'stock_import' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-file-arrow-up text-sm"></i>
              <span>Stok Yükle</span>
            </button>
          )}

          {canAccess('teams') && (
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'teams' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-users-gear text-sm"></i>
              <span>Zimmet</span>
            </button>
          )}

          {canAccess('secondary') && (
            <button
              onClick={() => setActiveTab('secondary')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'secondary' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-tablet-screen-button text-sm"></i>
              <span>2. Donanım</span>
            </button>
          )}

          {canAccess('reconciliation') && (
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'reconciliation' ? 'text-indigo-400 font-black' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-file-excel text-sm"></i>
              <span>Mutabakat</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <WarehouseProvider>
      <AppContent />
    </WarehouseProvider>
  );
}
