import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/useAuth';
import { Trash2, Plus, Minus, ArrowLeft, Ticket, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const {
    cart,
    coupon,
    cartSubtotal,
    discountAmount,
    shippingFee,
    cartTotal,
    removeFromCart,
    updateQuantity,
    applyDiscount,
    removeDiscount
  } = useCart();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Trạng thái cho input mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Xử lý áp mã giảm giá
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const res = applyDiscount(couponCode);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setCouponCode('');
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  // Định dạng tiền tệ VNĐ
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Tiến hành thanh toán
  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập trước khi tiến hành thanh toán!');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center space-y-6">
        <div className="bg-slate-900 border border-slate-850 p-8 rounded-3xl inline-block shadow-xl relative">
          <div className="absolute -top-6 -right-6 bg-orange-500/10 w-20 h-20 rounded-full blur-xl pointer-events-none" />
          <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Giỏ hàng trống</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Không có sản phẩm nào trong giỏ hàng của bạn. Hãy quay lại cửa hàng để chọn cho mình đôi giày ưng ý nhất nhé!
          </p>
        </div>
        <div>
          <Link
            to="/shop"
            className="inline-flex bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
          >
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Giỏ hàng của bạn</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DANH SÁCH SẢN PHẨM TRONG GIỎ */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={`${item.id}-${item.size}-${item.color}`}
              className="bg-slate-900 border border-slate-850 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between"
            >
              {/* Ảnh và thông tin */}
              <div className="flex gap-4 items-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-white hover:text-orange-500 text-sm sm:text-base transition-colors truncate max-w-[200px] sm:max-w-sm">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">{item.brand}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Size: <span className="text-white font-bold">{item.size}</span> | Màu: <span className="text-white font-bold">{item.color}</span>
                  </p>
                </div>
              </div>

              {/* Tăng giảm số lượng & Thành tiền */}
              <div className="flex flex-row sm:flex-col lg:flex-row items-center justify-between sm:justify-center gap-4">
                {/* Bộ đếm số lượng */}
                <div className="flex items-center border border-slate-850 rounded-xl bg-slate-950 p-0.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-bold text-white text-xs w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Thành tiền */}
                <div className="text-right min-w-[100px]">
                  <p className="text-xs text-slate-500 font-semibold block sm:hidden lg:block">Thành tiền</p>
                  <p className="font-bold text-white text-sm sm:text-base">{formatPrice(item.price * item.quantity)}</p>
                </div>

                {/* Nút xóa */}
                <button
                  onClick={() => removeFromCart(item.id, item.size, item.color)}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer border border-red-500/10"
                  title="Xóa khỏi giỏ hàng"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Nút tiếp tục mua sắm */}
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white pt-4 transition-colors"
          >
            <ArrowLeft size={16} /> Tiếp tục chọn thêm sản phẩm
          </Link>
        </div>

        {/* TÓM TẮT HÓA ĐƠN VÀ THANH TOÁN */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6">
            <h3 className="font-bold text-lg text-white border-b border-slate-850 pb-4 tracking-wide uppercase">
              Tóm tắt đơn hàng
            </h3>

            {/* Giá trị tạm tính */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Tạm tính</span>
                <span className="text-white font-bold">{formatPrice(cartSubtotal)}</span>
              </div>

              {coupon && (
                <div className="flex justify-between text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="text-green-500 font-bold border border-green-500/20 bg-green-500/5 px-1.5 py-0.5 rounded text-[10px]">
                      {coupon}
                    </span>
                    <button
                      onClick={removeDiscount}
                      className="text-[10px] text-red-400 hover:underline cursor-pointer"
                    >
                      (Xóa)
                    </button>
                  </div>
                  <span className="text-green-400 font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 font-medium">
                <span>Phí vận chuyển</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
              </div>
              {shippingFee > 0 && (
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  (Miễn phí vận chuyển cho đơn hàng từ 1,500,000đ trở lên)
                </p>
              )}
            </div>

            {/* Tổng cộng */}
            <div className="flex justify-between items-end border-t border-slate-850 pt-4">
              <div>
                <span className="text-sm font-bold text-white block">Tổng tiền thanh toán</span>
                <span className="text-xs text-slate-500 font-semibold">(Đã bao gồm VAT)</span>
              </div>
              <span className="text-2xl font-black text-orange-500">{formatPrice(cartTotal)}</span>
            </div>

            {/* Nút thanh toán */}
            <button
              onClick={handleCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-center tracking-wide text-sm block cursor-pointer"
            >
              Tiến hành thanh toán
            </button>
          </div>

          {/* Form nhập mã giảm giá */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl">
            <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Ticket size={16} /> Mã giảm giá / Voucher
            </h4>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã (SNEAKER10, VIP20)..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-grow bg-slate-950 border border-slate-850 focus:border-orange-500 px-4 py-2.5 rounded-xl text-xs text-white outline-none transition-colors"
              />
              <button
                type="submit"
                className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Áp dụng
              </button>
            </form>
            {message.text && (
              <p
                className={`text-[10px] font-semibold mt-3 ${
                  message.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
