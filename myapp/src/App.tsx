import { Routes, Route } from 'react-router-dom';
import './App.css';
import Footer from './footer/footer.tsx';
import Nav from './nav/nav.tsx';
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import CartPage from './pages/CartPage.tsx';
import { CartProvider } from './context/CartContext.tsx';

function App() {
  return (
    <CartProvider>
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
    </CartProvider>
  );
}

export default App;
