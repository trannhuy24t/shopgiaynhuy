import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ShoppingBag, User, LogOut, ShieldCheck, Home as HomeIcon, Store, Heart } from 'lucide-react';

// Context Providers
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { WishlistProvider, useWishlist } from './context/WishlistContext';

// Components
import ChatWidget from './components/Common/ChatWidget';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Admin/Dashboard';
import Login from './pages/Login';
import Wishlist from './pages/Wishlist';

// Admin Pages
import ProductManager from './pages/Admin/ProductManager';
import OrderManager from './pages/Admin/OrderManager';
import AdminChat from './pages/Admin/AdminChat';

// Component bảo vệ Route dành cho User đăng nhập (ví dụ: Checkout)
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Component bảo vệ Route dành cho Admin (ví dụ: Admin Dashboard)
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    alert('Bạn không có quyền truy cập trang quản trị!');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Component Navbar dùng chung cho toàn trang
const Header = () => {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-2xl font-black tracking-wider text-orange-500 hover:text-orange-400 transition-colors">
          <span className="bg-orange-500 text-white px-2.5 py-1 rounded-lg text-lg font-bold shadow-lg shadow-orange-500/35 mr-1">S</span>
          SNEAKERZONE
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium tracking-wide">
          <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 py-1">
            <HomeIcon size={16} /> Trang chủ
          </Link>
          <Link to="/shop" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 py-1">
            <Store size={16} /> Cửa hàng
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-5">
          {/* Admin Link */}
          {isAdmin && (
            <Link to="/admin" className="text-orange-400 hover:text-orange-300 font-semibold text-xs flex items-center gap-1 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 transition-all duration-300">
              <ShieldCheck size={14} /> Admin Dashboard
            </Link>
          )}

          {/* Wishlist Link */}
          <Link to="/wishlist" className="relative group p-2 hover:bg-slate-800 rounded-full transition-all">
            <Heart className="w-5.5 h-5.5 text-slate-300 group-hover:text-red-500 transition-colors" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link to="/cart" className="relative group p-2 hover:bg-slate-800 rounded-full transition-all">
            <ShoppingBag className="w-5.5 h-5.5 text-slate-300 group-hover:text-orange-500 transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-md">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center space-x-3 border-l border-slate-700 pl-4">
              <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full border-2 border-orange-500 object-cover" />
              <div className="hidden lg:block text-left">
                <p className="text-[10px] text-slate-400 font-semibold leading-none">Xin chào,</p>
                <p className="text-xs font-bold max-w-[100px] truncate mt-0.5">{user.name}</p>
              </div>
              <button 
                onClick={logout} 
                className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-full transition-all cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl text-xs font-bold tracking-wide shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

// Component Footer dùng chung
const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-900">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10 max-w-7xl">
        <div className="md:col-span-2">
          <Link to="/" className="text-2xl font-black tracking-wider text-orange-500 hover:text-orange-400 transition-colors block mb-4">
            SNEAKERZONE
          </Link>
          <p className="text-sm leading-relaxed mb-6 max-w-sm">
            Nơi cung cấp các dòng giày sneaker chính hãng cao cấp từ những thương hiệu hàng đầu thế giới như Nike, Adidas, Jordan. Kiến tạo phong cách thể thao đường phố của riêng bạn.
          </p>
          <p className="text-xs text-slate-500">© 2026 SneakerZone. All rights reserved.</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wider uppercase">Liên kết nhanh</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Trang chủ</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Cửa hàng</Link></li>
            <li><Link to="/wishlist" className="hover:text-white transition-colors">Yêu thích</Link></li>
            <li><Link to="/cart" className="hover:text-white transition-colors">Giỏ hàng</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wider uppercase">Liên hệ hỗ trợ</h4>
          <ul className="space-y-3 text-sm">
            <li className="text-slate-300">Hotline: 1900 8198</li>
            <li className="text-slate-300">Email: support@sneakerzone.com</li>
            <li className="text-slate-300">Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
              <Header />
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/login" element={<Login />} />

                  {/* Private User Routes */}
                  <Route 
                    path="/checkout" 
                    element={
                      <PrivateRoute>
                        <Checkout />
                      </PrivateRoute>
                    } 
                  />

                  {/* Private Admin Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <Dashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/products" 
                    element={
                      <AdminRoute>
                        <ProductManager />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/orders" 
                    element={
                      <AdminRoute>
                        <OrderManager />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/chat" 
                    element={
                      <AdminRoute>
                        <AdminChat />
                      </AdminRoute>
                    } 
                  />

                  {/* Fallback - Điều hướng về trang chủ */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
              {/* Live Chat Widget nổi cho tất cả khách hàng */}
              <ChatWidget />
              
              <Footer />
            </div>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;