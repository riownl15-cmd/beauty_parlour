import { useState } from 'react';
import Layout from './components/Layout';
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

  return <Layout currentPage={currentPage} onPageChange={setCurrentPage}>{renderPage()}</Layout>;
}

export default App;
