import { Link } from 'react-router-dom';
import { getNewArrivals, getBestSellers } from '../mockData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ArrowRight, Star, Truck, RefreshCw, Shield, Sparkles, Heart } from 'lucide-react';

const Home = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const newArrivals = getNewArrivals().slice(0, 4); // Lấy 4 sản phẩm mới nhất
  const bestSellers = getBestSellers().slice(0, 4); // Lấy 4 sản phẩm bán chạy nhất

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Component hiển thị thẻ sản phẩm
  const ProductCard = ({ product }) => {
    const liked = isInWishlist(product.id);
    return (
      <div className="group bg-slate-900 border border-slate-850 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5">
        <div className="relative aspect-square overflow-hidden bg-slate-950 block">
          <Link to={`/product/${product.id}`}>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
            />
          </Link>
          
          {/* Nút Thả Tim */}
          <button
            onClick={() => toggleWishlist(product)}
            className="absolute top-4 right-4 bg-slate-950/80 border border-slate-850 p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-md cursor-pointer z-10"
            title={liked ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart size={14} className={liked ? "fill-red-500 text-red-500" : "text-slate-400"} />
          </button>

          {product.isNew && (
            <span className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider shadow-md">
              New
            </span>
          )}
        </div>
        
        <div className="p-5 flex-grow flex flex-col justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-1">
              {product.brand}
            </span>
            <Link to={`/product/${product.id}`}>
              <h3 className="font-bold text-white group-hover:text-orange-500 text-sm sm:text-base leading-snug line-clamp-1 transition-colors">
                {product.name}
              </h3>
            </Link>
            <div className="flex items-center mt-2.5 space-x-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">{product.rating}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-850">
            <span className="text-base font-extrabold text-orange-500">{formatPrice(product.price)}</span>
            <button
              onClick={() => addToCart(product, product.sizes[0])}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              Thêm nhanh
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-20 pb-20">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[75vh] flex items-center justify-center bg-slate-950 overflow-hidden pt-12">
        <div className="absolute top-1/4 left-1/4 bg-orange-500/10 w-96 h-96 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 bg-amber-500/10 w-96 h-96 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 max-w-7xl">
          {/* Hero Text */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-full text-orange-500 text-xs font-bold tracking-wider uppercase">
              <Sparkles size={14} /> Hệ thống phân phối Sneaker chính hãng
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight uppercase tracking-tight">
              Bước đi của <br />
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Sự Khác Biệt
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Trải nghiệm các dòng sản phẩm giày thể thao đường phố mới nhất từ các nhà mốt tên tuổi. Thiết kế năng động, êm ái cùng độ bền ấn tượng, sẵn sàng cùng bạn chinh phục mọi chặng đường.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                to="/shop"
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Mua ngay bây giờ
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center cursor-pointer"
              >
                Xem bộ sưu tập
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex justify-center items-center">
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 opacity-20 blur-2xl animate-pulse" />
            <img
              src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80"
              alt="Giày Sneaker Nổi Bật"
              className="w-full max-w-[450px] object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] animate-float transform -rotate-12 transition-transform duration-700 hover:rotate-0"
            />
          </div>
        </div>
      </section>

      {/* --- CAM KẾT DỊCH VỤ --- */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex items-start gap-4">
            <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500 shrink-0">
              <Truck size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-2">Vận chuyển siêu tốc</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Miễn phí vận chuyển toàn quốc cho tất cả đơn hàng trị giá từ 1,500,000đ trở lên.
              </p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex items-start gap-4">
            <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500 shrink-0">
              <RefreshCw size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-2">Đổi trả linh hoạt</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hỗ trợ đổi size hoặc hoàn trả tiền trong vòng 7 ngày nếu phát hiện lỗi từ nhà sản xuất.
              </p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex items-start gap-4">
            <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500 shrink-0">
              <Shield size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-2">Chính hãng 100%</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cam kết nguồn gốc xuất xứ rõ ràng, đền bù gấp 10 lần giá trị nếu phát hiện hàng giả hàng nhái.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- NEW ARRIVALS (SẢN PHẨM MỚI) --- */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-end mb-8">
          <div className="text-left">
            <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
              Hàng mới cập bến
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Sản phẩm mới về</h2>
          </div>
          <Link
            to="/shop"
            className="text-sm text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* --- BANNER KHUYẾN MÃI LỚN --- */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="bg-gradient-to-r from-slate-900 via-orange-950/40 to-slate-900 border border-slate-850 p-8 md:p-16 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative overflow-hidden">
          <div className="space-y-6 text-left">
            <span className="bg-orange-500 text-white text-xs font-extrabold px-3 py-1 rounded-md tracking-wider uppercase">
              Ưu đãi đặc biệt
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase leading-none">
              Mùa tựu trường <br />
              giảm tới 20%
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Nhập mã giảm giá <span className="text-orange-500 font-bold border border-orange-500/20 px-2 py-0.5 rounded bg-orange-500/10">SNEAKER10</span> tại bước thanh toán để được giảm ngay 10% cho đơn hàng của bạn. Giảm thêm 20% cho đơn hàng VIP khi áp dụng mã <span className="text-orange-500 font-bold border border-orange-500/20 px-2 py-0.5 rounded bg-orange-500/10">VIP20</span>.
            </p>
            <div>
              <Link
                to="/shop"
                className="inline-flex bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                Nhận ưu đãi ngay
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80"
              alt="Giày Sneaker Khuyến Mãi"
              className="w-full max-w-[380px] object-cover rounded-2xl shadow-2xl shadow-orange-500/5 rotate-3 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* --- BEST SELLERS (SẢN PHẨM BÁN CHẠY) --- */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-end mb-8">
          <div className="text-left">
            <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
              Xu hướng mua sắm
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Sản phẩm bán chạy nhất</h2>
          </div>
          <Link
            to="/shop"
            className="text-sm text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
