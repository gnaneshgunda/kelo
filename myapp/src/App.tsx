import { Routes, Route } from 'react-router-dom';
import './App.css';
import Footer from './footer/footer.tsx';
import Nav from './nav/nav.tsx';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import CartPage from './pages/CartPage.tsx';
import EventsPage from './pages/EventsPage.tsx';
import AdminLogin from './pages/Admin/AdminLogin.tsx';
import AdminDashboard from './pages/Admin/AdminDashboard.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { ProductProvider } from './context/ProductContext.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import AIChat from './components/AIChat.tsx';

function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <SplashScreen />
        <div className="app-container">
          <Nav />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
        {/* Floating AI Shopping Assistant */}
        <AIChat />
      </CartProvider>
    </ProductProvider>
  );
}

export default App;
