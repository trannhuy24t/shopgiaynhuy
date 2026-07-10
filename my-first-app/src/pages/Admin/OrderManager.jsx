import { useState } from 'react';
import { getOrders, saveOrders } from '../../mockData';
import { Eye } from 'lucide-react';

const OrderManager = () => {
  const [orders, setOrders] = useState(() => getOrders());
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Cập nhật trạng thái đơn hàng
  const handleStatusChange = (orderId, newStatus) => {
    const updated = orders.map((order) => {
      if (order.id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    });
    setOrders(updated);
    saveOrders(updated);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Tiêu đề */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-900">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Giao dịch khách hàng
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý đơn hàng</h1>
        </div>
        <div className="text-xs text-slate-500 font-semibold bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl">
          Tổng đơn: {orders.length} Đơn hàng
        </div>
      </div>

      {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                <th className="p-5">Mã Đơn</th>
                <th className="p-5">Khách Hàng</th>
                <th className="p-5">Số Điện Thoại</th>
                <th className="p-5">Ngày Mua</th>
                <th className="p-5">Chi Tiết Sản Phẩm</th>
                <th className="p-5">Tổng Thanh Toán</th>
                <th className="p-5">Trạng Thái</th>
                <th className="p-5 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50">
              {orders.map((order) => (
                <tr key={order.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                  <td className="p-5 font-bold text-white">{order.id}</td>
                  <td className="p-5 font-semibold text-slate-200">{order.customer}</td>
                  <td className="p-5 font-medium text-slate-400">{order.phone}</td>
                  <td className="p-5 font-medium text-slate-500">{order.date}</td>
                  <td className="p-5 font-medium text-slate-400 max-w-[180px] truncate" title={order.items}>
                    {order.items}
                  </td>
                  <td className="p-5 font-extrabold text-white">{formatPrice(order.total)}</td>
                  
                  {/* Thay đổi trạng thái */}
                  <td className="p-5">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer bg-slate-950 ${
                        order.status === 'Completed'
                          ? 'text-green-400 border-green-500/20 bg-green-500/5'
                          : order.status === 'Processing'
                          ? 'text-orange-400 border-orange-500/20 bg-orange-500/5'
                          : 'text-red-400 border-red-500/20 bg-red-500/5'
                      }`}
                    >
                      <option value="Processing">Đang xử lý</option>
                      <option value="Completed">Đã giao hàng</option>
                      <option value="Cancelled">Đã hủy đơn</option>
                    </select>
                  </td>

                  {/* Xem chi tiết */}
                  <td className="p-5 text-center">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-800 cursor-pointer"
                      title="Xem hóa đơn chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-scale-up text-xs">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <h3 className="font-bold text-lg text-white uppercase tracking-wide">Chi tiết đơn hàng {selectedOrder.id}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Thông tin hóa đơn */}
            <div className="space-y-4 text-slate-300 font-medium">
              <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-850">
                <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Họ tên người nhận</span> <span className="text-white font-semibold text-sm">{selectedOrder.customer}</span></p>
                <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Số điện thoại</span> <span className="text-white font-semibold">{selectedOrder.phone}</span></p>
                <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Địa chỉ nhận hàng</span> <span className="text-white font-semibold">{selectedOrder.address}</span></p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-850">
                <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Thời gian đặt mua</span> <span className="text-slate-200">{selectedOrder.date}</span></p>
                <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Chi tiết mặt hàng</span> <span className="text-orange-400 font-bold">{selectedOrder.items}</span></p>
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Tổng cộng</span>
                  <span className="text-slate-400 font-medium">Đã bao gồm phí ship (nếu có)</span>
                </div>
                <span className="text-lg font-black text-orange-500">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
