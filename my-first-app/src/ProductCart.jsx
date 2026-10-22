function ProductCart({ image, name, price, isAvailable }) {
    return (
        <div className="product-card">
            {/* 1. Hiển thị hình ảnh sản phẩm */}
            <img src={image} alt={name} className="product-card-image" />

            {/* 2. Tên và giá sản phẩm */}
            <h3 className="product-card-title">{name}</h3>
            <p className="product-card-price">{price}</p>

            {/* 3. Thử thách nâng cao: Hiển thị trạng thái dựa vào điều kiện (Tùy chọn) */}
            <span className={`product-card-stock ${isAvailable ? 'product-card-stock--available' : 'product-card-stock--unavailable'}`}>
                {isAvailable ? '🟢 Còn hàng' : '🔴 Hết hàng'}
            </span>
        </div>
    );
}

export default ProductCart;
