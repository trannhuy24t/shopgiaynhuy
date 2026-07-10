// Thay vì nhận (props), ta bọc thẳng các thuộc tính vào dấu { }
function UserCard({ avatar, name, job, email }) {
  return (
    <div style={{ border: '2px solid #646cff', borderRadius: '8px', margin: '15px 0', padding: '15px' }}>
      {/* Bây giờ không cần chữ "props." nữa, viết trực tiếp luôn */}
      <img src={avatar} alt={name} style={{ borderRadius: '50%', marginBottom: '10px' }} />
      <h2 style={{ color: '#646cff' }}>Tên: {name}</h2>
      <p>Công việc: {job}</p>
      <p>Email: {email}</p> {/* Hiển thị thêm email */}
    </div>
  );
}

export default UserCard;