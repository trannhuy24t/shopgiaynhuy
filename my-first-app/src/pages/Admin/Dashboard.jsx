import { Link } from 'react-router-dom';
import { getOrders, getProducts } from '../../mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Package, ArrowUpRight, CheckCircle, Clock, MessageSquare, Shield, XCircle } from 'lucide-react';

const Dashboard = () => {
  const orders = getOrders();
  const productsCount = getProducts().length;

  // --- TÍNH TOÁN CÁC THỐNG KÊ ĐỘNG (Computed Dynamic Stats) ---
  
  // Tổng doanh thu: chỉ tính các đơn hàng đã giao thành công (status === 'Completed')
  const totalRevenue = orders
    .filter((order) => order.status === 'Completed')
    .reduce((sum, order) => sum + order.total, 0);

  // Tổng số đơn hàng đang xử lý
  const pendingOrdersCount = orders.filter((order) => order.status === 'Processing').length;

  // Dữ liệu doanh thu cho biểu đồ (Được cập nhật nhẹ theo tổng doanh thu thực tế)
  const revenueData = [
    { name: 'Tháng 1', DoanhThu: 45000000 },
    { name: 'Tháng 2', DoanhThu: 52000000 },
    { name: 'Tháng 3', DoanhThu: 49000000 },
    { name: 'Tháng 4', DoanhThu: 72000000 },
    { name: 'Tháng 5', DoanhThu: 85000000 },
    { name: 'Tháng 6', DoanhThu: totalRevenue > 0 ? totalRevenue : 98000000 }, // Đồng bộ tháng 6 với doanh thu thực tế
  ];

  // 5 đơn hàng mới nhất
  const recentOrders = [...orders].reverse().slice(0, 5);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Thống kê dạng mảng
  const stats = [
    { title: 'Doanh Thu Thực Tế (Đã Giao)', value: formatPrice(totalRevenue), icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Tổng Đơn Hàng', value: `${orders.length} Đơn`, icon: ShoppingBag, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { title: 'Đơn Đang Xử Lý', value: `${pendingOrdersCount} Đơn`, icon: Clock, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { title: 'Tổng Sản Phẩm', value: `${productsCount} Mẫu`, icon: Package, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Tiêu đề & Vai trò */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-900 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500/10 p-2.5 rounded-xl text-orange-500 border border-orange-500/20">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
              Bảng điều khiển hệ thống
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Admin Dashboard</h1>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Trạng thái: Quản trị viên
        </div>
      </div>

      {/* THANH MENU ĐIỀU HƯỚNG NHANH CỦA ADMIN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/products"
          className="bg-slate-900 border border-slate-850 hover:border-orange-500/40 p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-101 group cursor-pointer"
        >
          <div className="space-y-1 text-left">
            <h4 className="font-bold text-white text-sm">Quản lý Sản phẩm</h4>
            <p className="text-[10px] text-slate-500 font-semibold">Thêm, sửa, xóa các mẫu giày sneaker</p>
          </div>
          <Package className="w-6 h-6 text-slate-600 group-hover:text-orange-500 transition-colors" />
        </Link>

        <Link
          to="/admin/orders"
          className="bg-slate-900 border border-slate-850 hover:border-orange-500/40 p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-101 group cursor-pointer"
        >
          <div className="space-y-1 text-left">
            <h4 className="font-bold text-white text-sm">Quản lý Đơn hàng</h4>
            <p className="text-[10px] text-slate-500 font-semibold">Xử lý, duyệt và hủy đơn của khách</p>
          </div>
          <ShoppingBag className="w-6 h-6 text-slate-600 group-hover:text-orange-500 transition-colors" />
        </Link>

        <Link
          to="/admin/chat"
          className="bg-slate-900 border border-slate-850 hover:border-orange-500/40 p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-101 group cursor-pointer"
        >
          <div className="space-y-1 text-left">
            <h4 className="font-bold text-white text-sm">Hỗ trợ khách hàng</h4>
            <p className="text-[10px] text-slate-500 font-semibold">Nhắn tin trực tiếp Live Chat</p>
          </div>
          <MessageSquare className="w-6 h-6 text-slate-600 group-hover:text-orange-500 transition-colors" />
        </Link>
      </div>

      {/* THẺ THỐNG KÊ NHANH (Stats Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{stat.title}</span>
                <span className="text-xl sm:text-2xl font-black text-white block">{stat.value}</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${stat.color} shrink-0`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* BIỂU ĐỒ DOANH THU & KHO HÀNG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Biểu đồ Recharts */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-md">
          <h3 className="font-bold text-lg text-white uppercase tracking-wide">Xu hướng doanh thu</h3>
          <div className="h-80 w-full text-xs font-medium">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                  formatter={(value) => [formatPrice(value), 'Doanh thu']}
                />
                <Line type="monotone" dataKey="DoanhThu" stroke="#f97316" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Thông tin kho hàng */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-md">
          <div>
            <h3 className="font-bold text-lg text-white uppercase tracking-wide pb-2 border-b border-slate-850 mb-4">
              Sản phẩm sắp hết hàng
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0 text-left">
                  <span className="font-bold text-xs text-white block truncate">Nike Air Force 1 '07</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">Size: 42 | Đen</span>
                </div>
                <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">
                  Chỉ còn 1
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0 text-left">
                  <span className="font-bold text-xs text-white block truncate">New Balance 550 White</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">Size: 39 | Trắng</span>
                </div>
                <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">
                  Chỉ còn 2
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0 text-left">
                  <span className="font-bold text-xs text-white block truncate">Puma Suede Classic</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">Size: 40 | Đỏ</span>
                </div>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">
                  Chỉ còn 4
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/admin/products"
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold py-3 rounded-xl text-xs transition-colors block text-center cursor-pointer"
          >
            Nhập thêm hàng hóa / Quản lý sản phẩm
          </Link>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG MỚI ĐẶT */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6 shadow-md">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-white uppercase tracking-wide">Đơn hàng mới nhất</h3>
          <Link
            to="/admin/orders"
            className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Quản lý tất cả đơn hàng <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                <th className="pb-4 pt-2 pl-2">Mã Đơn</th>
                <th className="pb-4 pt-2">Khách Hàng</th>
                <th className="pb-4 pt-2">Ngày Mua</th>
                <th className="pb-4 pt-2">Sản Phẩm</th>
                <th className="pb-4 pt-2">Tổng Tiền</th>
                <th className="pb-4 pt-2">Trạng Thế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="text-slate-300 hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 font-bold text-white pl-2">{order.id}</td>
                  <td className="py-4 font-semibold">{order.customer}</td>
                  <td className="py-4 font-medium text-slate-500">{order.date}</td>
                  <td className="py-4 font-medium text-slate-400 max-w-[150px] truncate">{order.items}</td>
                  <td className="py-4 font-extrabold text-white">{formatPrice(order.total)}</td>
                  <td className="py-4">
                    {order.status === 'Completed' ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded font-bold">
                        <CheckCircle size={10} /> Đã giao
                      </span>
                    ) : order.status === 'Processing' ? (
                      <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded font-bold">
                        <Clock size={10} /> Đang xử lý
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded font-bold">
                        <XCircle size={10} /> Hủy bỏ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
