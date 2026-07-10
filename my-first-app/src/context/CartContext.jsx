/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

// Khởi tạo Context cho giỏ hàng
const CartContext = createContext();

// Custom hook để sử dụng CartContext dễ dàng hơn ở các components khác
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Trạng thái giỏ hàng, tự động tải dữ liệu từ localStorage nếu có
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('sneaker_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Trạng thái mã giảm giá đang áp dụng
  const [coupon, setCoupon] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Lưu giỏ hàng vào localStorage mỗi khi giỏ hàng thay đổi
  useEffect(() => {
    localStorage.setItem('sneaker_cart', JSON.stringify(cart));
  }, [cart]);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = (product, size, color = 'Standard', quantity = 1) => {
    if (!size) {
      alert('Vui lòng chọn size giày!');
      return;
    }

    setCart((prevCart) => {
      // Kiểm tra xem sản phẩm cùng size và cùng màu đã tồn tại trong giỏ hàng chưa
      const existingItemIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.size === size && item.color === color
      );

      if (existingItemIndex > -1) {
        // Nếu đã tồn tại, tăng số lượng lên
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        // Nếu chưa tồn tại, thêm mới item vào giỏ hàng
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            brand: product.brand,
            size: size,
            color: color,
            quantity: quantity,
          },
        ];
      }
    });
  };

  // Xóa sản phẩm khỏi giỏ hàng dựa trên id, size và màu
  const removeFromCart = (productId, size, color) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.id === productId && item.size === size && item.color === color)
      )
    );
  };

  // Cập nhật số lượng của một sản phẩm cụ thể
  const updateQuantity = (productId, size, color, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId && item.size === size && item.color === color
          ? { ...item, quantity: quantity }
          : item
      )
    );
  };

  // Áp dụng mã giảm giá
  const applyDiscount = (code) => {
    const uppercaseCode = code.trim().toUpperCase();
    if (uppercaseCode === 'SNEAKER10') {
      setCoupon(uppercaseCode);
      setDiscountPercent(10); // Giảm 10%
      return { success: true, message: 'Áp dụng mã SNEAKER10 thành công! Giảm 10%.' };
    } else if (uppercaseCode === 'VIP20') {
      setCoupon(uppercaseCode);
      setDiscountPercent(20); // Giảm 20%
      return { success: true, message: 'Áp dụng mã VIP20 thành công! Giảm 20%.' };
    } else {
      return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
    }
  };

  // Hủy áp dụng mã giảm giá
  const removeDiscount = () => {
    setCoupon(null);
    setDiscountPercent(0);
  };

  // Xóa sạch giỏ hàng (sử dụng sau khi đặt hàng thành công)
  const clearCart = () => {
    setCart([]);
    setCoupon(null);
    setDiscountPercent(0);
  };

  // --- CÁC THÔNG SỐ TÍNH TOÁN (Computed values) ---

  // Tổng số lượng sản phẩm trong giỏ hàng
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Tổng tiền hàng tạm tính (chưa giảm giá, chưa phí ship)
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Số tiền được giảm giá
  const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);

  // Phí giao hàng (cố định là 30,000đ, miễn phí nếu đơn hàng từ 1,500,000đ trở lên)
  const shippingFee = cartSubtotal >= 1500000 || cartSubtotal === 0 ? 0 : 30000;

  // Tổng tiền thanh toán cuối cùng
  const cartTotal = cartSubtotal - discountAmount + shippingFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        coupon,
        discountPercent,
        cartCount,
        cartSubtotal,
        discountAmount,
        shippingFee,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        applyDiscount,
        removeDiscount,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
