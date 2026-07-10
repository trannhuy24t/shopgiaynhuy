import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import { MessageSquare, Send, X } from 'lucide-react';
import { getChats, saveChats } from '../../mockData';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Định nghĩa ID cuộc trò chuyện của khách hàng hiện tại
  const chatUserId = user ? `user_${user.id}` : 'guest_local';
  const chatUserName = user ? user.name : 'Khách hàng (Local)';

  // Tự động cuộn xuống cuối ô chat khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load tin nhắn từ localStorage và thiết lập interval đồng bộ mỗi 1 giây (để nhận tin nhắn từ Admin)
  useEffect(() => {
    const fetchChatMessages = () => {
      const allChats = getChats();
      const currentChat = allChats.find((c) => c.userId === chatUserId);
      if (currentChat) {
        setMessages(currentChat.messages);
      } else {
        // Khởi tạo tin nhắn chào mừng ban đầu
        const welcomeMessage = {
          id: 1,
          sender: 'admin',
          text: `Chào mừng bạn đến với SneakerZone! Bạn cần hỗ trợ gì về size giày hay sản phẩm không ạ?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const newChatObj = {
          userId: chatUserId,
          userName: chatUserName,
          messages: [welcomeMessage]
        };
        saveChats([...allChats, newChatObj]);
        setMessages([welcomeMessage]);
      }
    };

    fetchChatMessages();

    // Thiết lập interval đồng bộ 1000ms
    const interval = setInterval(fetchChatMessages, 1000);
    return () => clearInterval(interval);
  }, [chatUserId, chatUserName, isOpen]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');

    // Lưu vào localStorage
    const allChats = getChats();
    const chatIdx = allChats.findIndex((c) => c.userId === chatUserId);
    if (chatIdx > -1) {
      allChats[chatIdx].messages = updatedMessages;
      allChats[chatIdx].userName = chatUserName; // Cập nhật tên nếu đăng nhập đổi tên
      saveChats(allChats);
    } else {
      allChats.push({
        userId: chatUserId,
        userName: chatUserName,
        messages: updatedMessages
      });
      saveChats(allChats);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* KHUNG CHAT CHỮ NHẬT */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-800 w-80 sm:w-96 h-[450px] rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-slide-in">
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 absolute" />
              <div className="text-left pl-1">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Hỗ trợ SneakerZone</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Thường trả lời trong vài phút</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body tin nhắn */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-950/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed font-medium ${
                    msg.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-semibold pl-1.5 pr-1.5">{msg.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer gửi tin */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/80 flex gap-2">
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow bg-slate-950 border border-slate-850 focus:border-orange-500 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none transition-colors"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* NÚT BONG BÓNG TRÒN NỔI */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-orange-500 hover:bg-orange-600 active:scale-90 text-white p-4 rounded-full shadow-2xl shadow-orange-500/20 hover:shadow-orange-500/35 transition-all flex items-center justify-center cursor-pointer group"
        title="Trò chuyện với hỗ trợ"
      >
        {isOpen ? (
          <X size={24} className="animate-spin-once" />
        ) : (
          <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
