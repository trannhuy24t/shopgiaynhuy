function SongRow({ id, title, artist, duration, isFavorite }) {
    return (
        <div className="song-row">
            {/* Bên trái: Số thứ tự, Tên bài hát & Ca sĩ */}
            <div className="song-row-info">
                <span className="song-row-id">{id}</span>
                <div className="song-row-copy">
                    <h4 className="song-row-title">{title}</h4>
                    <p className="song-row-artist">{artist}</p>
                </div>
            </div>

            {/* Bên phải: Thời lượng và nút Trái tim */}
            <div className="song-row-meta">
                <span>{duration}</span>
                {/* Nếu isFavorite là true thì hiện tim đỏ, ngược lại hiện tim xám */}
                <span className={`song-row-favorite ${isFavorite ? 'song-row-favorite--active' : ''}`}>
                    {isFavorite ? '❤️' : '🤍'}
                </span>
            </div>
        </div>
    );
}

export default SongRow;
