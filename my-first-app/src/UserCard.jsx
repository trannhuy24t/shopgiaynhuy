// Thay vì nhận (props), ta bọc thẳng các thuộc tính vào dấu { }
function UserCard({ avatar, name, job, email }) {
  return (
    <div className="user-card">
      {/* Bây giờ không cần chữ "props." nữa, viết trực tiếp luôn */}
      <img src={avatar} alt={name} className="user-card-avatar" />
      <h2 className="user-card-name">Tên: {name}</h2>
      <p>Công việc: {job}</p>
      <p>Email: {email}</p> {/* Hiển thị thêm email */}
    </div>
  );
}

export default UserCard;
