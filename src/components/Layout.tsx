import { Menu, Package, ShoppingCart, BarChart3, Settings, Box, DollarSign } from 'lucide-react';

type LayoutProps = {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
};

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const menuItems = [
    { id: 'billing', label: 'Billing', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'services', label: 'Services', icon: Menu },
    { id: 'stock', label: 'Stock', icon: Box },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">Beauty Parlour</h1>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}