import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/productService';
import { useCart } from '../context/CartContext';
import { Star, Truck, Shield, RefreshCw, ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trạng thái tương tác của người dùng
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([
    { id: 1, author: 'Lê Minh H.', rating: 5, date: '12/05/2026', comment: 'Giày đi cực kỳ êm chân, đúng như mô tả. Size chuẩn xác, đóng gói cẩn thận.' },
    { id: 2, author: 'Trần Thị Thu T.', rating: 4, date: '28/04/2026', comment: 'Giao hàng nhanh, da giày mềm mại. Rất đáng đồng tiền bát gạo!' }
  ]);

  // Trạng thái cho form đánh giá mới
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);

        const res = await getProduct(id);
        const productData = res.data;

        if (!productData) {
          setProduct(null);
          return;
        }

        const normalizedProduct = {
          ...productData,
          image:
            productData.image ??
            (productData.imageUrl
              ? `https://localhost:7097${productData.imageUrl}`
              : 'https://via.placeholder.com/600'),
          brand: productData.brand ?? productData.categoryName ?? 'Unknown',
          rating: productData.rating ?? 5,
          reviewsCount: productData.reviewsCount ?? 0,
          sizes: productData.sizes ?? [38, 39, 40, 41],
          colors: productData.colors ?? ['Default'],
          images:
            productData.images ??
            [
              productData.image ??
              (productData.imageUrl
                ? `https://localhost:7097${productData.imageUrl}`
                : 'https://via.placeholder.com/600'),
            ],
        };

        setProduct(normalizedProduct);
        setSelectedImage(normalizedProduct.image);
        setSelectedSize(normalizedProduct.sizes[0]);
        setSelectedColor(normalizedProduct.colors[0]);
      } catch (error) {
        console.error(error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Sản phẩm không tồn tại!</h2>
        <Link to="/shop" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  // Tăng giảm số lượng mua
  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Gửi đánh giá mới
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) {
      alert('Vui lòng điền tên và viết nhận xét!');
      return;
    }
    const reviewObj = {
      id: Date.now(),
      author: newAuthor,
      rating: newRating,
      date: new Date().toLocaleDateString('vi-VN'),
      comment: newComment
    };
    setReviews([reviewObj, ...reviews]);
    setNewAuthor('');
    setNewComment('');
    setNewRating(5);
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    // Thông báo nhanh và mở giỏ hàng hoặc ở lại trang
    const confirmGoToCart = window.confirm(`Đã thêm ${quantity} đôi ${product.name} (Size: ${selectedSize}) vào giỏ hàng. Đi tới giỏ hàng ngay?`);
    if (confirmGoToCart) {
      navigate('/cart');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Quay lại shop */}
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Quay lại cửa hàng
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* KHU VỰC HÌNH ẢNH */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-slate-850">
            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {/* Carousel ảnh phụ */}
          {product.images && product.images.length > 0 && (
            <div className="flex gap-4">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border transition-all cursor-pointer ${
                    selectedImage === imgUrl ? 'border-orange-500 scale-102 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} view ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* KHU VỰC THÔNG TIN VÀ CHỌN LỰA */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-orange-500 font-extrabold text-xs uppercase tracking-widest">{product.brand}</span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight">{product.name}</h1>
            
            {/* Đánh giá sao */}
            <div className="flex items-center space-x-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-slate-600'}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-200">{product.rating}</span>
              <span className="text-xs text-slate-500">({reviews.length} đánh giá từ khách hàng)</span>
            </div>

            {/* Giá sản phẩm */}
            <div className="text-2xl md:text-3xl font-black text-orange-500 pt-2">
              {formatPrice(product.price)}
            </div>

            {/* Mô tả tóm tắt */}
            <p className="text-slate-400 text-sm leading-relaxed pt-2">
              {product.description}
            </p>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-900">
            {/* Chọn Màu sắc */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Màu sắc</h4>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedColor === color
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chọn Size giày */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chọn Size giày</h4>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                      selectedSize === size
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn Số lượng & Nút giỏ hàng */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch pt-2">
              {/* Tăng giảm số lượng */}
              <div className="flex items-center justify-between border border-slate-850 rounded-2xl bg-slate-900/60 p-1 w-full sm:w-36">
                <button
                  onClick={handleDecrease}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <span className="font-bold text-white text-base w-8 text-center">{quantity}</span>
                <button
                  onClick={handleIncrease}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Nút Thêm vào giỏ hàng */}
              <button
                onClick={handleAddToCart}
                className="flex-grow bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <ShoppingCart size={18} /> Thêm vào giỏ hàng
              </button>
            </div>
          </div>

          {/* Dịch vụ cam kết */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-900 text-center">
            <div className="flex flex-col items-center">
              <Truck size={20} className="text-orange-500 mb-1" />
              <span className="text-[10px] text-slate-400 font-semibold">Giao Hàng Nhanh</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-900">
              <Shield size={20} className="text-orange-500 mb-1" />
              <span className="text-[10px] text-slate-400 font-semibold">Bảo Hành 12 Tháng</span>
            </div>
            <div className="flex flex-col items-center">
              <RefreshCw size={20} className="text-orange-500 mb-1" />
              <span className="text-[10px] text-slate-400 font-semibold">Đổi Trả 7 Ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- PHÂN HỆ ĐÁNH GIÁ (REVIEWS) --- */}
      <section className="border-t border-slate-900 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form gửi đánh giá mới */}
          <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">Viết đánh giá</h3>
            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tên của bạn</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Nhập tên..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Số sao đánh giá</label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="5">⭐⭐⭐⭐⭐ 5 Sao</option>
                  <option value="4">⭐⭐⭐⭐ 4 Sao</option>
                  <option value="3">⭐⭐⭐ 3 Sao</option>
                  <option value="2">⭐⭐ 2 Sao</option>
                  <option value="1">⭐ 1 Sao</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nhận xét của bạn</label>
                <textarea
                  rows="4"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Nhận xét chi tiết về sản phẩm..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Gửi đánh giá
              </button>
            </form>
          </div>

          {/* Danh sách các đánh giá trước */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">
              Đánh giá từ khách hàng ({reviews.length})
            </h3>
            
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-slate-200">{rev.author}</h5>
                    <span className="text-[10px] text-slate-500">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < rev.rating ? 'fill-amber-400' : 'text-slate-800'} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
