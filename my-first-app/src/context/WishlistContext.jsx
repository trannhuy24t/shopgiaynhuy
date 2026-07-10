/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

// Khởi tạo Context cho Wishlist
const WishlistContext = createContext();

// Custom hook để sử dụng WishlistContext dễ dàng
export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  // Trạng thái danh sách yêu thích, phục hồi từ localStorage
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('sneaker_wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  // Đồng bộ với localStorage mỗi khi wishlist thay đổi
  useEffect(() => {
    localStorage.setItem('sneaker_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Thêm hoặc Xóa sản phẩm khỏi danh sách yêu thích (Toggle)
  const toggleWishlist = (product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id);
      if (exists) {
        // Nếu đã có, xóa đi
        return prevWishlist.filter((item) => item.id !== product.id);
      } else {
        // Nếu chưa có, thêm vào
        return [...prevWishlist, product];
      }
    });
  };

  // Kiểm tra sản phẩm có trong wishlist không
  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  // Xóa toàn bộ sản phẩm yêu thích
  const clearWishlist = () => {
    setWishlist([]);
  };

  // Tổng số lượng sản phẩm yêu thích
  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
