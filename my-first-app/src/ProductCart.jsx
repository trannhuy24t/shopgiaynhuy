function ProductCart({ image, name, price, isAvailable }) {
    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '15px', textAlign: 'center', backgroundColor: '#fff', color: '#333' }}>
            {/* 1. Hiển thị hình ảnh sản phẩm */}
            <img src={image} alt={name} style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} />

            {/* 2. Tên và giá sản phẩm */}
            <h3 style={{ margin: '10px 0 5px 0', fontSize: '1.1rem' }}>{name}</h3>
            <p style={{ color: '#ff4d4f', fontWeight: 'bold', margin: '0 0 10px 0' }}>{price}</p>

            {/* 3. Thử thách nâng cao: Hiển thị trạng thái dựa vào điều kiện (Tùy chọn) */}
            <span style={{
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '0.8rem',
                backgroundColor: isAvailable ? '#e6f7ff' : '#fff1f0',
                color: isAvailable ? '#1890ff' : '#ff4d4f'
            }}>
                {isAvailable ? '🟢 Còn hàng' : '🔴 Hết hàng'}
            </span>
        </div>
    );
}

export default ProductCart;