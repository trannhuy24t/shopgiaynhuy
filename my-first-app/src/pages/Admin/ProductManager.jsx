import { useState } from 'react';
import { getProducts, saveProducts } from '../../mockData';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const ProductManager = () => {
  const [products, setProducts] = useState(() => getProducts());
  
  // Trạng thái Form Modal (Thêm/Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = Thêm mới, có ID = Chỉnh sửa

  // Các trường của Form
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Nike',
    price: '',
    image: '',
    sizes: [38, 39, 40, 41, 42],
    colors: 'Trắng, Đen',
    description: '',
    isNew: true,
    isBestSeller: false
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Mở Form thêm mới
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      brand: 'Nike',
      price: '',
      image: '',
      sizes: [38, 39, 40, 41, 42],
      colors: 'Trắng, Đen',
      description: '',
      isNew: true,
      isBestSeller: false
    });
    setIsModalOpen(true);
  };

  // Mở Form chỉnh sửa
  const handleOpenEditModal = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      sizes: product.sizes,
      colors: product.colors.join(', '),
      description: product.description,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller
    });
    setIsModalOpen(true);
  };

  // Xóa sản phẩm
  const handleDeleteProduct = (productId) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?');
    if (!confirmDelete) return;

    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
  };

  // Xử lý Checkbox Size giày
  const handleSizeChange = (size) => {
    setFormData((prev) => {
      const currentSizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: currentSizes.sort((a, b) => a - b) };
    });
  };

  // Gửi Form (Submit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    const priceNum = parseInt(formData.price);
    const colorArray = formData.colors.split(',').map((c) => c.trim()).filter((c) => c !== '');

    const updatedProducts = editingId
      ? products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: formData.name,
                brand: formData.brand,
                price: priceNum,
                image: formData.image,
                sizes: formData.sizes,
                colors: colorArray,
                description: formData.description,
                isNew: formData.isNew,
                isBestSeller: formData.isBestSeller,
              }
            : p
        )
      : [
          {
            id: Date.now(),
            name: formData.name,
            brand: formData.brand,
            price: priceNum,
            image: formData.image,
            images: [formData.image],
            rating: 5.0,
            reviewsCount: 0,
            sizes: formData.sizes,
            colors: colorArray,
            description: formData.description,
            isNew: formData.isNew,
            isBestSeller: formData.isBestSeller,
          },
          ...products,
        ];

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setIsModalOpen(false);
  };

  const sizesList = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Tiêu đề & Nút thêm */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-900">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Danh sách kho giày
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý sản phẩm</h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
        >
          <Plus size={16} /> Thêm sản phẩm mới
        </button>
      </div>

      {/* BẢNG DANH SÁCH SẢN PHẨM */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                <th className="p-5">Ảnh</th>
                <th className="p-5">Tên Giày</th>
                <th className="p-5">Thương Hiệu</th>
                <th className="p-5">Giá Bán</th>
                <th className="p-5">Sizes Có Sẵn</th>
                <th className="p-5">Thuộc tính</th>
                <th className="p-5 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50">
              {products.map((product) => (
                <tr key={product.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                  <td className="p-5 shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800"
                    />
                  </td>
                  <td className="p-5 font-bold text-white max-w-[200px] truncate">{product.name}</td>
                  <td className="p-5 font-semibold text-slate-400">{product.brand}</td>
                  <td className="p-5 font-extrabold text-orange-500">{formatPrice(product.price)}</td>
                  <td className="p-5 font-medium text-slate-500">{product.sizes.join(', ')}</td>
                  <td className="p-5">
                    <div className="flex gap-1.5">
                      {product.isNew && (
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Mới
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Hot
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-800 cursor-pointer"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/10 cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (THÊM / SỬA) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-6">
              {editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Tên sản phẩm */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tên giày *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nike Air Max..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                  />
                </div>

                {/* Thương hiệu */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Thương hiệu *</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="Nike">Nike</option>
                    <option value="Adidas">Adidas</option>
                    <option value="Jordan">Jordan</option>
                    <option value="New Balance">New Balance</option>
                    <option value="Puma">Puma</option>
                  </select>
                </div>

                {/* Giá bán */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="3500000"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                  />
                </div>

                {/* Link ảnh */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Đường dẫn ảnh sản phẩm *</label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Mô tả sản phẩm */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mô tả sản phẩm</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chất liệu, thiết kế, form dáng..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                />
              </div>

              {/* Nhãn thuộc tính */}
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 text-slate-300 font-semibold text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-800 focus:ring-orange-500"
                  />
                  <span>Sản phẩm Mới (New Arrival)</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 font-semibold text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-800 focus:ring-orange-500"
                  />
                  <span>Sản phẩm Bán chạy (Best Seller)</span>
                </label>
              </div>

              {/* Chọn kích cỡ (Sizes) */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">Kích thước (Sizes) *</label>
                <div className="flex flex-wrap gap-3">
                  {sizesList.map((size) => (
                    <label
                      key={size}
                      className={`flex items-center justify-center border w-11 h-11 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                        formData.sizes.includes(size)
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10'
                          : 'bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.sizes.includes(size)}
                        onChange={() => handleSizeChange(size)}
                        className="hidden"
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              {/* Màu sắc */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Màu sắc (Cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="Trắng, Đen, Xanh Dương"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                />
              </div>

              {/* Nút gửi */}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors mt-4 cursor-pointer"
              >
                {editingId ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm mới'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
