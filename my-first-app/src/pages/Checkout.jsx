import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, Truck, ArrowLeft, ShoppingBag } from 'lucide-react';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();

  // Trạng thái Form thông tin khách hàng
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD hoặc Bank
  
  // Trạng thái thanh toán thành công
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }

    // Giả lập mã đơn hàng ngẫu nhiên
    const randomCode = 'SZ' + Math.floor(100000 + Math.random() * 900000);
    setOrderCode(randomCode);
    setIsSuccess(true);
    clearCart(); // Xóa sạch giỏ hàng toàn cục sau khi mua xong
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center space-y-6 animate-fade-in">
        <div className="bg-slate-900 border border-slate-850 p-8 rounded-3xl shadow-2xl relative">
          <div className="absolute -top-6 -right-6 bg-green-500/10 w-20 h-20 rounded-full blur-xl pointer-events-none" />
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Đặt hàng thành công!</h2>
          <p className="text-slate-400 text-sm mt-3">
            Cảm ơn bạn đã tin tưởng mua sắm tại <span className="text-orange-500 font-bold">SneakerZone</span>. Mã đơn hàng của bạn là: <span className="text-white font-extrabold tracking-wide">{orderCode}</span>
          </p>

          {paymentMethod === 'Bank' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left text-xs space-y-2 mt-6">
              <p className="text-orange-500 font-bold uppercase tracking-wider">Thông tin chuyển khoản:</p>
              <p className="text-slate-300">Ngân hàng: <span className="text-white font-semibold">Vietcombank</span></p>
              <p className="text-slate-300">Số tài khoản: <span className="text-white font-semibold">1029384756</span></p>
              <p className="text-slate-300">Chủ tài khoản: <span className="text-white font-semibold">CONG TY TNHH SNEAKERZONE</span></p>
              <p className="text-slate-300">Nội dung chuyển khoản: <span className="text-white font-bold">{orderCode}</span></p>
              <p className="text-[10px] text-slate-500 italic mt-1">(Đơn hàng sẽ được duyệt và vận chuyển ngay sau khi nhận được thanh toán)</p>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-6 leading-relaxed">
            Nhân viên của chúng tôi sẽ liên hệ xác nhận đơn hàng qua số điện thoại <span className="text-white font-semibold">{phone}</span> trong vòng 15 phút.
          </p>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Không có sản phẩm nào để thanh toán!</h2>
        <Link to="/shop" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Quay lại giỏ hàng
      </Link>

      <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Thanh toán đơn hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM NHẬP THÔNG TIN GIAO HÀNG */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="font-bold text-lg text-white border-b border-slate-850 pb-4 tracking-wide uppercase flex items-center gap-2">
              <Truck size={20} className="text-orange-500" /> Thông tin giao hàng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  placeholder="Nhập số điện thoại..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Địa chỉ giao hàng *</label>
              <textarea
                required
                rows="3"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
              />
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="pt-4">
              <h3 className="font-bold text-lg text-white border-b border-slate-850 pb-4 tracking-wide uppercase flex items-center gap-2 mb-6">
                <CreditCard size={20} className="text-orange-500" /> Phương thức thanh toán
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* COD */}
                <label className={`border rounded-2xl p-5 flex items-start gap-4 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-orange-500 bg-orange-500/5'
                    : 'border-slate-850 bg-slate-950 hover:border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 mt-1 text-orange-500 bg-slate-950 border-slate-800 focus:ring-orange-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-sm text-white block">Thanh toán khi nhận hàng (COD)</span>
                    <span className="text-xs text-slate-500 mt-1 block">Nhận hàng rồi mới thanh toán bằng tiền mặt cho shipper.</span>
                  </div>
                </label>

                {/* BANK TRANSFER */}
                <label className={`border rounded-2xl p-5 flex items-start gap-4 cursor-pointer transition-all ${
                  paymentMethod === 'Bank'
                    ? 'border-orange-500 bg-orange-500/5'
                    : 'border-slate-850 bg-slate-950 hover:border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Bank"
                    checked={paymentMethod === 'Bank'}
                    onChange={() => setPaymentMethod('Bank')}
                    className="w-4 h-4 mt-1 text-orange-500 bg-slate-950 border-slate-800 focus:ring-orange-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-sm text-white block">Chuyển khoản Ngân hàng</span>
                    <span className="text-xs text-slate-500 mt-1 block">Chuyển tiền trực tiếp vào tài khoản ngân hàng của cửa hàng.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Nút đặt hàng */}
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-center tracking-wide text-sm block cursor-pointer"
            >
              Xác nhận đặt hàng ({formatPrice(cartTotal)})
            </button>
          </form>
        </div>

        {/* TÓM TẮT GIỎ HÀNG */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl h-fit space-y-6">
          <h3 className="font-bold text-lg text-white border-b border-slate-850 pb-4 tracking-wide uppercase flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange-500" /> Giỏ hàng tóm tắt ({cart.length})
          </h3>

          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate max-w-[130px]">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Size: {item.size} | SL: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-300 shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-850 pt-4 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng cộng</span>
            <span className="text-xl font-black text-orange-500">{formatPrice(cartTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
