// Danh sách giày sneaker ban đầu làm dữ liệu mặc định
const initialProducts = [
  {
    id: 1,
    name: "Nike Air Force 1 '07",
    brand: "Nike",
    price: 2900000,
    rating: 4.8,
    reviewsCount: 124,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80"
    ],
    sizes: [38, 39, 40, 41, 42, 43, 44],
    colors: ["Trắng", "Đen"],
    description: "Vẻ ngoài rực rỡ tiếp tục tỏa sáng với Nike Air Force 1 '07. Mẫu giày bóng rổ nguyên bản mang lại diện mạo mới cho những gì bạn biết rõ nhất: các lớp phủ được khâu bền bỉ, bề mặt hoàn thiện sạch sẽ và lượng chi tiết hoàn hảo giúp bạn tỏa sáng.",
    isNew: true,
    isBestSeller: true
  },
  {
    id: 2,
    name: "Adidas Yeezy Boost 350 V2",
    brand: "Adidas",
    price: 6500000,
    rating: 4.9,
    reviewsCount: 89,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=600&q=80"
    ],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    colors: ["Xám", "Đen Zebra"],
    description: "Yeezy Boost 350 V2 là dòng giày mang tính biểu tượng được hợp tác giữa Adidas và Kanye West. Với công nghệ đệm Boost êm ái cùng chất liệu Primeknit co giãn, đôi giày này mang lại sự thoải mái tối đa và phong cách thời trang đường phố thời thượng.",
    isNew: false,
    isBestSeller: true
  },
  {
    id: 3,
    name: "Air Jordan 1 Retro High OG",
    brand: "Jordan",
    price: 4800000,
    rating: 4.9,
    reviewsCount: 210,
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=600&q=80"
    ],
    sizes: [40, 41, 42, 43, 44],
    colors: ["Đỏ Đen (Bred)", "Xanh Royal"],
    description: "Jordan 1 Retro High OG thiết lập lại tiêu chuẩn cho phong cách bóng rổ đường phố. Da cao cấp, đệm Air êm ái dưới gót chân và logo Wings biểu tượng giúp đôi giày này trở thành một tác phẩm nghệ thuật lịch sử không thể thiếu trong tủ đồ.",
    isNew: true,
    isBestSeller: false
  },
  {
    id: 4,
    name: "New Balance 550 White Grey",
    brand: "New Balance",
    price: 3200000,
    rating: 4.6,
    reviewsCount: 64,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80"
    ],
    sizes: [38, 39, 40, 41, 42, 43],
    colors: ["Trắng Xám"],
    description: "Lần đầu ra mắt vào năm 1989, New Balance 550 đã quay trở lại mạnh mẽ và chiếm trọn tình cảm của giới mộ điệu. Thiết kế retro mang âm hưởng bóng rổ cổ điển với chất liệu da cao cấp và logo chữ N đặc trưng mang lại sự tinh tế hàng ngày.",
    isNew: true,
    isBestSeller: true
  },
  {
    id: 5,
    name: "Puma Suede Classic XXI",
    brand: "Puma",
    price: 2100000,
    rating: 4.5,
    reviewsCount: 42,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80"
    ],
    sizes: [37, 38, 39, 40, 41, 42],
    colors: ["Đỏ Đậm", "Đen"],
    description: "Được ra mắt vào năm 1968, Puma Suede đã thay đổi cuộc chơi và đồng hành cùng các biểu tượng qua nhiều thế hệ. Phiên bản XXI cập nhật chất liệu da lộn mềm mại hơn, giữ nguyên form dáng classic huyền thoại và dải formstrip đặc trưng ở bên hông.",
    isNew: false,
    isBestSeller: false
  }
];

// Khởi tạo các đơn hàng ban đầu
const initialOrders = [
  { id: 'SZ-90182', customer: 'Nguyễn Văn A', phone: '0901234567', address: '123 Ba Tháng Hai, Quận 10, TP.HCM', date: '19/06/2026', total: 3200000, status: 'Completed', items: 'NB 550 White Grey (1)' },
  { id: 'SZ-90181', customer: 'Lê Minh H.', phone: '0987654321', address: '456 Lê Lợi, Quận 1, TP.HCM', date: '19/06/2026', total: 7200000, status: 'Processing', items: 'Jordan 4 Retro Military (1)' },
  { id: 'SZ-90180', customer: 'Trần Thị Thu T.', phone: '0912345678', address: '789 Nguyễn Huệ, Quận 1, TP.HCM', date: '18/06/2026', total: 2900000, status: 'Completed', items: 'Nike Air Force 1 (1)' }
];

// Khởi tạo các đoạn hội thoại chat ban đầu
const initialChats = [
  {
    userId: 'guest_1',
    userName: 'Khách hàng ẩn danh 1',
    messages: [
      { id: 1, sender: 'user', text: 'Chào shop, đôi Yeezy Boost 350 có được freeship không ạ?', time: '15:30' },
      { id: 2, sender: 'admin', text: 'Chào bạn, đơn hàng Yeezy Boost trị giá trên 1,500,000đ nên shop hỗ trợ miễn phí vận chuyển toàn quốc bạn nhé!', time: '15:32' }
    ]
  }
];

// --- HÀM HELPER ĐỂ ĐỌC/GHI LOCALSTORAGE AN TOÀN ---

export const getProducts = () => {
  const products = localStorage.getItem('sneaker_products');
  if (!products) {
    localStorage.setItem('sneaker_products', JSON.stringify(initialProducts));
    return initialProducts;
  }
  return JSON.parse(products);
};

export const saveProducts = (products) => {
  localStorage.setItem('sneaker_products', JSON.stringify(products));
};

export const getOrders = () => {
  const orders = localStorage.getItem('sneaker_orders');
  if (!orders) {
    localStorage.setItem('sneaker_orders', JSON.stringify(initialOrders));
    return initialOrders;
  }
  return JSON.parse(orders);
};

export const saveOrders = (orders) => {
  localStorage.setItem('sneaker_orders', JSON.stringify(orders));
};

export const getChats = () => {
  const chats = localStorage.getItem('sneaker_chats');
  if (!chats) {
    localStorage.setItem('sneaker_chats', JSON.stringify(initialChats));
    return initialChats;
  }
  return JSON.parse(chats);
};

export const saveChats = (chats) => {
  localStorage.setItem('sneaker_chats', JSON.stringify(chats));
};

// --- MOCK API ACTIONS ---

// Lấy toàn bộ sản phẩm (cho trang Shop/Home)
export const mockProducts = getProducts(); 

export const getProductById = (id) => {
  const products = getProducts();
  return products.find((p) => p.id === parseInt(id));
};

export const getNewArrivals = () => {
  const products = getProducts();
  return products.filter((p) => p.isNew);
};

export const getBestSellers = () => {
  const products = getProducts();
  return products.filter((p) => p.isBestSeller);
};
