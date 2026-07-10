import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingCart, Heart, ArrowLeft } from 'lucide-react';

const Wishlist = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center space-y-6">
        <div className="bg-slate-900 border border-slate-850 p-8 rounded-3xl inline-block shadow-xl relative">
          <div className="absolute -top-6 -right-6 bg-red-500/10 w-20 h-20 rounded-full blur-xl pointer-events-none" />
          <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Chưa có sản phẩm yêu thích</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Hãy khám phá các sản phẩm tuyệt vời của chúng tôi và nhấn nút "Thả tim" để lưu chúng lại đây nhé!
          </p>
        </div>
        <div>
          <Link
            to="/shop"
            className="inline-flex bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
          >
            Đến Cửa hàng ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Quay lại shop */}
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Quay lại cửa hàng
      </Link>

      <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8 flex items-center gap-2">
        <Heart className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" /> Danh sách yêu thích của bạn ({wishlist.length})
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <div
            key={product.id}
            className="group bg-slate-900 border border-slate-850 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5"
          >
            {/* Ảnh sản phẩm */}
            <div className="relative aspect-square overflow-hidden bg-slate-950">
              <Link to={`/product/${product.id}`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
              </Link>
              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 bg-slate-950/80 border border-slate-850 p-2.5 rounded-full text-red-500 hover:bg-red-500/10 transition-colors shadow-md cursor-pointer"
                title="Xóa khỏi yêu thích"
              >
                <Trash2 size={16} />
              </button>
              
              <span className="absolute bottom-4 left-4 bg-slate-950/75 backdrop-blur-sm text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-800">
                {product.brand}
              </span>
            </div>

            {/* Thông tin */}
            <div className="p-5 flex-grow flex flex-col justify-between">
              <div>
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-bold text-white group-hover:text-orange-500 text-sm sm:text-base leading-snug line-clamp-2 transition-colors">
                    {product.name}
                  </h3>
                </Link>
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-850">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Giá bán</span>
                  <span className="text-sm sm:text-base font-extrabold text-orange-500">{formatPrice(product.price)}</span>
                </div>
                <button
                  onClick={() => addToCart(product, product.sizes[0])}
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md shadow-orange-500/15"
                >
                  <ShoppingCart size={14} /> Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
