import { useState, useEffect } from 'react';
import { Menu, Package, ShoppingCart, BarChart3, Settings, Box, Tag, Users, X, LogOut, Barcode } from 'lucide-react';

type LayoutProps = {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  showSidebar?: boolean;
  sidebarExpanded?: boolean;
  onSidebarToggle?: () => void;
};

export default function Layout({ children, currentPage, onPageChange, onLogout, showSidebar = true, sidebarExpanded = true, onSidebarToggle }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'billing', label: 'Billing', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'services', label: 'Services', icon: Menu },
    { id: 'stock', label: 'Stock', icon: Box },
    { id: 'barcode', label: 'Barcode', icon: Barcode },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleMenuItemClick = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${showSidebar ? '' : 'lg:hidden'}
        ${sidebarExpanded ? 'w-64' : 'w-20'}
      `}>
        {sidebarExpanded && (
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between lg:justify-center">
              <img
                src="/asset_2smile_struct.png"
                alt="Smile Struck Bridal Studios"
                className="w-40 lg:w-full h-auto"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        )}
        <nav className="p-2 lg:p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                title={!sidebarExpanded ? item.label : undefined}
                className={`w-full flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarExpanded && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-2 lg:p-4 border-t border-gray-200 space-y-2">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              title={!sidebarExpanded ? 'Toggle Menu' : undefined}
              className={`w-full flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100`}
            >
              <Menu className="w-5 h-5 flex-shrink-0" />
              {sidebarExpanded && <span className="font-medium">Toggle Menu</span>}
            </button>
          )}
          <button
            onClick={onLogout}
            title={!sidebarExpanded ? 'Logout' : undefined}
            className={`w-full flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarExpanded && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto w-full">
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30 p-4 flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find(item => item.id === currentPage)?.label || 'Beauty Parlour'}
          </h2>
        </div>
        <div className="p-4 lg:p-8 pt-20 lg:pt-8 pb-20">{children}</div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 text-white py-2 overflow-hidden z-40 shadow-lg">
        <div className="animate-scroll whitespace-nowrap text-xs font-bold">
          <span className="inline-block px-4">
            SOFTWARE SOLUTIONS BY ZOUIS CORP. | CONTACT: 6383702551 | WWW.ZOUISCORP.IN | © SMILE STRUCT BRIDAL STUDIOS
          </span>
          <span className="inline-block px-4">
            SOFTWARE SOLUTIONS BY ZOUIS CORP. | CONTACT: 6383702551 | WWW.ZOUISCORP.IN | © SMILE STRUCT BRIDAL STUDIOS
          </span>
          <span className="inline-block px-4">
            SOFTWARE SOLUTIONS BY ZOUIS CORP. | CONTACT: 6383702551 | WWW.ZOUISCORP.IN | © SMILE STRUCT BRIDAL STUDIOS
          </span>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll {
          display: inline-block;
          animation: scroll 25s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}