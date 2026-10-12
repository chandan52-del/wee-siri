import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { ToastContainer } from './components/ui/Toast';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PolicyPage } from './pages/PolicyPage';
import { WishlistPage } from './pages/WishlistPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

const StoreContent: React.FC = () => {
  const { currentPage, isCustomerLoggedIn, isAdmin, loading, currentProductId } = useStore();

  const renderPage = () => {
    // 1. Separate Admin Portal: Authorized administrator can access Admin Login & Dashboard
    if (currentPage === 'admin-login' || currentPage === 'admin-dashboard') {
      return isAdmin ? <AdminDashboard /> : <AdminLogin />;
    }

    // 2. Customer Protection Guard: Require Google sign-in before accessing shopping website
    if (!isCustomerLoggedIn) {
      return <CustomerLoginPage />;
    }

    // 3. Authenticated Customer Pages: Full Shopping Experience
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'products':
        return <ProductsPage />;
      case 'product-detail':
        return <ProductDetailPage key={currentProductId || 'product-detail'} />;
      case 'categories':
        return <CategoriesPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'policy':
        return <PolicyPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'login':
      case 'account':
        return <CustomerLoginPage />;
      default:
        return <HomePage />;
    }
  };

  const isAuthPage = !isCustomerLoggedIn && currentPage !== 'admin-login' && currentPage !== 'admin-dashboard';
  const isAdminPage = currentPage === 'admin-login' || currentPage === 'admin-dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-stone-900 selection:bg-stone-900 selection:text-white font-sans">
      {!isAuthPage && !isAdminPage && <AnnouncementBar />}
      {!isAuthPage && !isAdminPage && <Navbar />}

      <main className="flex-1">
        {loading && (
          <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-emerald-100 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-full" />
          </div>
        )}
        {renderPage()}
      </main>

      {!isAuthPage && !isAdminPage && <Footer />}
      {!isAuthPage && !isAdminPage && <FloatingWhatsApp />}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StoreContent />
    </StoreProvider>
  );
}
