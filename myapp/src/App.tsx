import { Routes, Route } from 'react-router-dom';
import './App.css';
import Footer from './footer/footer.tsx';
import Nav from './nav/nav.tsx';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import CartPage from './pages/CartPage.tsx';
import { CartProvider } from './context/CartContext.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import AIChat from './components/AIChat.tsx';

function App() {
  return (
    <CartProvider>
      <SplashScreen />
      <div className="app-container">
        <Nav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      {/* Floating AI Shopping Assistant */}
      <AIChat />
    </CartProvider>
  );
}

export default App;

