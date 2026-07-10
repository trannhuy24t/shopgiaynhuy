import { useState } from 'react';
import { login } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      const res = await login({
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      alert('Đăng nhập thành công!');

     if (res.data.user.role === 'Admin') {
  navigate('/admin/dashboard', { replace: true });
} else {
  navigate('/', { replace: true });
}
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-slate-900 border border-slate-850 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 bg-orange-500/10 w-32 h-32 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 bg-amber-500/10 w-32 h-32 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Chào mừng trở lại</h2>
          <p className="text-slate-400 text-sm mt-1.5">Đăng nhập tài khoản SneakerZone của bạn</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-4 rounded-xl mb-6 text-center animate-shake">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="email"
                placeholder="ten@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-slate-200 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-slate-200 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Nút Đăng nhập */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-xl text-sm tracking-wide shadow-lg shadow-orange-500/20 transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Đăng nhập <LogIn size={16} />
              </>
            )}
          </button>
        </form>
        {/* <div className="mt-8 pt-6 border-t border-slate-850">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tài khoản thử nghiệm Demo:</p>
          <div className="space-y-2.5 text-xs text-slate-500 font-medium">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex justify-between items-center">
              <div>
                <p className="text-slate-300"><span className="text-orange-500 font-bold">Admin:</span> admin@sneaker.com</p>
                <p>Mật khẩu: admin123</p>
              </div>
              <ArrowRight size={14} className="text-slate-600" />
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex justify-between items-center">
              <div>
                <p className="text-slate-300"><span className="text-orange-500 font-bold">Khách:</span> user@sneaker.com</p>
                <p>Mật khẩu: user123</p>
              </div>
              <ArrowRight size={14} className="text-slate-600" />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
