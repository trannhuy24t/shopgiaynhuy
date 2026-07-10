import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProducts } from '../services/productService';
import { Search, SlidersHorizontal, ArrowUpDown, Star, X, Heart } from 'lucide-react';

const FilterSidebar = ({
  brandsList,
  selectedBrands,
  handleBrandChange,
  selectedSize,
  setSelectedSize,
  maxPrice,
  setMaxPrice,
  handleResetFilters,
  sizesList,
  formatPrice,
}) => (
  <div className="space-y-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-850">
    {/* Tiêu đề & Nút Reset */}
    <div className="flex justify-between items-center pb-4 border-b border-slate-800">
      <h3 className="font-bold text-lg text-white tracking-wide">Bộ lọc tìm kiếm</h3>
      <button
        onClick={handleResetFilters}
        className="text-xs text-orange-500 hover:text-orange-400 font-semibold transition-colors cursor-pointer"
      >
        Xóa tất cả
      </button>
    </div>

    {/* Lọc theo Thương hiệu */}
    <div>
      <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-4">Thương hiệu</h4>
      <div className="space-y-3">
        {brandsList.map((brand) => (
          <label key={brand} className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={selectedBrands.includes(brand)}
              onChange={() => handleBrandChange(brand)}
              className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-700 focus:ring-orange-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm font-medium">{brand}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Lọc theo Size giày */}
    <div>
      <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-4">Size Giày</h4>
      <div className="grid grid-cols-4 gap-2">
        {sizesList.map((size) => (
          <button
            key={size}
            onClick={() => setSelectedSize(selectedSize === size ? null : size)}
            className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              selectedSize === size
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>

    {/* Lọc theo Khoảng giá */}
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Khoảng giá</h4>
        <span className="text-xs text-orange-500 font-bold">{formatPrice(maxPrice)}</span>
      </div>
      <input
        type="range"
        min="1000000"
        max="10000000"
        step="500000"
        value={maxPrice}
        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
      <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-semibold">
        <span>1,000,000đ</span>
        <span>10,000,000đ</span>
      </div>
    </div>
  </div>
);

const Shop = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  // --- TRẠNG THÁI BỘ LỌC (Filters State) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [maxPrice, setMaxPrice] = useState(8000000); // Mặc định lọc tối đa 8 triệu
  const [sortBy, setSortBy] = useState('newest'); // Mặc định xếp theo mới nhất
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // Đóng/mở bộ lọc trên mobile

  // Danh sách thương hiệu để render bộ lọc
  const brandsList = ['Nike', 'Adidas', 'Jordan', 'New Balance', 'Puma'];
  // Danh sách size giày để render bộ lọc
  const sizesList = [37, 38, 39, 40, 41, 42, 43, 44, 45];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await getProducts();
        const fetchedProducts = response.data || [];

        setProducts(
          fetchedProducts.map((product) => ({
            id: product.id ?? product.productId ?? Math.random().toString(36).slice(2),
            name: product.name ?? product.title ?? 'Sản phẩm Sneaker',
            image:
              product.image ??
              (product.imageUrl
                ? `https://localhost:7097${product.imageUrl}`
                : null) ??
              'https://via.placeholder.com/400x400?text=No+Image',
            brand: product.brand ?? product.categoryName ?? product.category ?? 'Unknown',
            price: typeof product.price === 'number' ? product.price : Number(product.price) || 0,
            rating: typeof product.rating === 'number' ? product.rating : product.rating ?? 4.5,
            reviewsCount: product.reviewsCount ?? product.reviewCount ?? 0,
            sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : [37, 38, 39, 40, 41],
            isNew: product.isNew ?? product.isLatest ?? false,
            isBestSeller: product.isBestSeller ?? product.isHot ?? false,
          }))
        );
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

  // --- XỬ LÝ SỰ KIỆN LỌC ---
  
  // Chọn / bỏ chọn thương hiệu
  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Reset toàn bộ bộ lọc về mặc định
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBrands([]);
    setSelectedSize(null);
    setMaxPrice(8000000);
    setSortBy('newest');
  };

  // --- LOGIC LỌC & SẮP XẾP SẢN PHẨM ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Lọc theo thanh tìm kiếm (Search)
    if (searchTerm.trim() !== '') {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Lọc theo Thương hiệu (Brands)
    if (selectedBrands.length > 0) {
      result = result.filter((product) => selectedBrands.includes(product.brand));
    }

    // 3. Lọc theo Size giày
    if (selectedSize) {
      result = result.filter((product) => product.sizes.includes(selectedSize));
    }

    // 4. Lọc theo Khoảng giá (Price Range)
    result = result.filter((product) => product.price <= maxPrice);

    // 5. Sắp xếp sản phẩm (Sorting)
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return result;
  }, [products, searchTerm, selectedBrands, selectedSize, maxPrice, sortBy]);

  // Định dạng tiền tệ VNĐ
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Banner nhỏ của trang Shop */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 md:p-12 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center">
          <span className="text-9xl font-black italic tracking-tighter">SNEAKERS</span>
        </div>
        <div className="relative z-10 max-w-lg text-left">
          <span className="bg-white/10 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-white/20 tracking-wider">
            Bộ Sưu Tập 2026
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight leading-none uppercase">
            Bứt phá mọi giới hạn
          </h1>
          <p className="text-orange-100 text-sm md:text-base mt-3 font-medium">
            Khám phá những mẫu giày hot nhất, dẫn đầu xu thế thời trang đường phố từ các thương hiệu hàng đầu thế giới.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* --- SIDEBAR BỘ LỌC CHO DESKTOP --- */}
        <aside className="hidden lg:block lg:w-1/4 shrink-0">
          <FilterSidebar
            brandsList={brandsList}
            selectedBrands={selectedBrands}
            handleBrandChange={handleBrandChange}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            handleResetFilters={handleResetFilters}
            sizesList={sizesList}
            formatPrice={formatPrice}
          />
        </aside>

        {/* --- KHU VỰC DANH SÁCH SẢN PHẨM --- */}
        <section className="flex-grow">
          {/* Hộp Tìm kiếm & Thanh sắp xếp */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
            {/* Thanh tìm kiếm */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm giày sneaker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-slate-200 transition-colors"
              />
            </div>

            {/* Sắp xếp & Nút Lọc Mobile */}
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={18} />
                Lọc
              </button>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <ArrowUpDown size={16} className="text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none border-none pr-6 cursor-pointer"
                >
                  <option value="newest" className="bg-slate-950">Mới nhất</option>
                  <option value="price-asc" className="bg-slate-950">Giá: Thấp đến Cao</option>
                  <option value="price-desc" className="bg-slate-950">Giá: Cao đến Thấp</option>
                  <option value="rating" className="bg-slate-950">Đánh giá cao nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lưới sản phẩm */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const liked = isInWishlist(product.id);
                return (
                  <div
                    key={product.id}
                    className="group bg-slate-900 border border-slate-850 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/5"
                  >
                    {/* Ảnh sản phẩm + Nhãn */}
                    <div className="relative aspect-square overflow-hidden bg-slate-950">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      
                      {/* Nút Thả Tim yêu thích */}
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="absolute top-4 right-4 bg-slate-950/80 border border-slate-850 p-2.5 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-md cursor-pointer z-10"
                        title={liked ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                      >
                        <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-slate-400"} />
                      </button>

                      {/* Nhãn Hot/New */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        {product.isNew && (
                          <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider shadow-md shadow-orange-500/20">
                            Mới về
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider shadow-md shadow-red-500/20">
                            Bán chạy
                          </span>
                        )}
                      </div>

                      {/* Thương hiệu */}
                      <span className="absolute bottom-4 left-4 bg-slate-950/75 backdrop-blur-sm text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-800">
                        {product.brand}
                      </span>
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div className="text-left">
                        {/* Đánh giá */}
                        <div className="flex items-center space-x-1 mb-2.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-amber-400">{product.rating}</span>
                          <span className="text-[10px] text-slate-500">({product.reviewsCount} đánh giá)</span>
                        </div>

                        {/* Tên giày */}
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-bold text-white group-hover:text-orange-500 text-base leading-snug transition-colors line-clamp-1 mb-1">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Các size hiện có */}
                        <p className="text-[11px] text-slate-500 font-medium mb-3">
                          Sizes: {product.sizes.join(', ')}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-850">
                        <div className="text-left">
                          <span className="text-xs text-slate-500 block font-semibold">Giá bán</span>
                          <span className="text-lg font-extrabold text-orange-500">{formatPrice(product.price)}</span>
                        </div>
                        <button
                          onClick={() => addToCart(product, product.sizes[0])}
                          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-orange-500/15 cursor-pointer"
                        >
                          Thêm nhanh
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-400 font-medium text-lg">Không tìm thấy sản phẩm nào khớp với bộ lọc.</p>
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Xóa các bộ lọc
              </button>
            </div>
          )}
        </section>
      </div>

      {/* --- MOBILE FILTER DRAWER --- */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop tối */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          {/* Nội dung Drawer */}
          <div className="relative w-full max-w-xs bg-slate-950 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white">Bộ lọc nâng cao</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <FilterSidebar
                brandsList={brandsList}
                selectedBrands={selectedBrands}
                handleBrandChange={handleBrandChange}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                handleResetFilters={handleResetFilters}
                sizesList={sizesList}
                formatPrice={formatPrice}
              />
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mt-6 cursor-pointer"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
