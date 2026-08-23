import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success';
  onClose: () => void;
}

const Toast = ({ message, type = 'error', onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] max-w-sm px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl animate-scale-up ${
        type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
      }`}
    >
      {message}
    </div>
  );
};

export default Toast;
