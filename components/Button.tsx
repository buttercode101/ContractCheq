
import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  loading,
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-blue-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(37,99,235,0.2)] hover:bg-blue-700 hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_20px_rgba(37,99,235,0.3)] focus:ring-blue-500 border border-blue-500/20",
    secondary: "bg-slate-900 text-white shadow-lg hover:bg-slate-800 focus:ring-slate-500 border border-slate-700",
    outline: "bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-300",
    danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:ring-slate-200"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] uppercase tracking-widest rounded-xl",
    md: "px-6 py-3 text-xs uppercase tracking-widest rounded-2xl",
    lg: "px-10 py-5 text-sm uppercase tracking-widest rounded-[2rem]",
    icon: "p-3 rounded-2xl"
  };

  return (
    <motion.button 
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon && (
        <span className={cn(children ? "mr-2.5" : "")}>{icon}</span>
      )}
      {children}
    </motion.button>
  );
};

export default Button;
