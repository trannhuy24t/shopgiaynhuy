import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-400/40 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border border-slate-300 hover:border-indigo-400/40 shadow-sm'
      } ${className}`}
      title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
    >
      {isDark ? (
        <Sun size={18} className="transition-transform duration-500 hover:rotate-90 text-amber-400" />
      ) : (
        <Moon size={18} className="transition-transform duration-500 -rotate-12 text-indigo-600" />
      )}
    </button>
  );
};

export default ThemeToggle;

