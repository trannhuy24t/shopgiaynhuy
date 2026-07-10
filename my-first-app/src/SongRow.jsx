function SongRow({ id, title, artist, duration, isFavorite }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid #333',
            backgroundColor: '#181818',
            color: '#fff',
            borderRadius: '4px',
            marginBottom: '8px'
        }}>
            {/* Bên trái: Số thứ tự, Tên bài hát & Ca sĩ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ color: '#b3b3b3', width: '20px' }}>{id}</span>
                <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{title}</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: '#b3b3b3' }}>{artist}</p>
                </div>
            </div>

            {/* Bên phải: Thời lượng và nút Trái tim */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#b3b3b3' }}>
                <span>{duration}</span>
                {/* Nếu isFavorite là true thì hiện tim đỏ, ngược lại hiện tim xám */}
                <span style={{ color: isFavorite ? '#1db954' : '#b3b3b3', cursor: 'pointer' }}>
                    {isFavorite ? '❤️' : '🤍'}
                </span>
            </div>
        </div>
    );
}

export default SongRow;