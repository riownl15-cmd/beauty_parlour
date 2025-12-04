import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import BillingPage from './components/BillingPage';
import CustomersPage from './components/CustomersPage';
import ProductsPage from './components/ProductsPage';
import CategoriesPage from './components/CategoriesPage';
import ServicesPage from './components/ServicesPage';
import StockPage from './components/StockPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('billing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    setIsAuthenticated(loggedIn === 'true');
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setCurrentPage('billing');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'billing':
        return <BillingPage />;
      case 'customers':
        return <CustomersPage />;
      case 'products':
        return <ProductsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'services':
        return <ServicesPage />;
      case 'stock':
        return <StockPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <BillingPage />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}

export default App;
