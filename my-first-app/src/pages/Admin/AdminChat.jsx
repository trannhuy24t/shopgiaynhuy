import { useState, useEffect, useRef } from 'react';
import { getChats, saveChats } from '../../mockData';
import { Send, User, MessageSquare } from 'lucide-react';

const AdminChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Đồng bộ danh sách chat từ localStorage mỗi 1 giây
  useEffect(() => {
    const fetchChats = () => {
      const allChats = getChats();
      setChats(allChats);
      
      // Nếu chưa chọn cuộc chat nào và có danh sách chat, mặc định chọn cuộc chat đầu tiên
      if (!selectedChatId && allChats.length > 0) {
        setSelectedChatId(allChats[0].userId);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 1000);
    return () => clearInterval(interval);
  }, [selectedChatId]);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChatId, chats]);

  // Lấy chi tiết cuộc chat đang chọn
  const activeChat = chats.find((c) => c.userId === selectedChatId);

  // Admin gửi tin nhắn phản hồi
  const handleSendResponse = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    const newMsg = {
      id: Date.now(),
      sender: 'admin',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChats = chats.map((c) => {
      if (c.userId === selectedChatId) {
        return {
          ...c,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setChats(updatedChats);
    saveChats(updatedChats);
    setInputText('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Tiêu đề */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-900 mb-8">
        <div className="bg-orange-500/10 p-2.5 rounded-xl text-orange-500 border border-orange-500/20">
          <MessageSquare size={22} />
        </div>
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Trung tâm hỗ trợ trực tuyến
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Live Chat Portal</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-900 border border-slate-850 rounded-3xl h-[600px] overflow-hidden shadow-2xl">
        {/* CỘT TRÁI: DANH SÁCH KHÁCH HÀNG */}
        <div className="lg:col-span-1 border-r border-slate-850 flex flex-col h-full bg-slate-950/40">
          <div className="p-4 border-b border-slate-850">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Hội thoại đang mở</h4>
          </div>
          
          <div className="flex-grow overflow-y-auto divide-y divide-slate-850/30">
            {chats.length > 0 ? (
              chats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                return (
                  <button
                    key={chat.userId}
                    onClick={() => setSelectedChatId(chat.userId)}
                    className={`w-full p-4 text-left flex gap-3 transition-colors cursor-pointer ${
                      selectedChatId === chat.userId ? 'bg-orange-500/10 border-l-4 border-orange-500' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex justify-between items-baseline">
                        <h5 className="font-bold text-white text-xs truncate">{chat.userName}</h5>
                        {lastMsg && <span className="text-[9px] text-slate-500 shrink-0">{lastMsg.time}</span>}
                      </div>
                      {lastMsg && (
                        <p className={`text-[10px] truncate mt-1 ${lastMsg.sender === 'admin' ? 'text-slate-500' : 'text-orange-400 font-bold'}`}>
                          {lastMsg.sender === 'admin' ? 'Bạn: ' : ''}{lastMsg.text}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Không có hội thoại nào.</div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: KHU VỰC CHAT CHI TIẾT */}
        <div className="lg:col-span-3 flex flex-col h-full justify-between">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-slate-950/30 border-b border-slate-850 p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <User size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeChat.userName}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">ID: {activeChat.userId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Đang kết nối
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-950/10">
                {activeChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-3.5 text-xs leading-relaxed font-medium ${
                        msg.sender === 'admin'
                          ? 'bg-orange-500 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-850'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1.5 pl-1 pr-1 font-semibold">{msg.time}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendResponse} className="p-4 border-t border-slate-850 bg-slate-950/40 flex gap-3">
                <input
                  type="text"
                  placeholder={`Phản hồi ${activeChat.userName}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-grow bg-slate-950 border border-slate-850 focus:border-orange-500 text-xs text-white px-4 py-3 rounded-xl outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/15 flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
                >
                  Gửi đi <Send size={12} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 space-y-4">
              <MessageSquare size={48} className="text-slate-700 animate-pulse" />
              <p className="text-sm font-semibold">Chọn một khách hàng để bắt đầu trò chuyện hỗ trợ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
