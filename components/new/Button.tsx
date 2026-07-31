import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  loading?: boolean;
}

const variants: Record<string, string> = {
  primary: "bg-lime text-cream shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(148,185,59,0.2)] hover:bg-lime-dark hover:shadow-[0_8px_20px_rgba(148,185,59,0.3)] focus:ring-lime border border-lime/20",
  secondary: "bg-elevated text-ink border border-white/[0.08] hover:bg-surface focus:ring-white/20",
  outline: "bg-transparent border border-white/[0.12] text-mute hover:text-ink hover:border-white/30 focus:ring-white/20",
  ghost: "bg-transparent text-mute hover:bg-white/[0.05] hover:text-ink focus:ring-white/20",
  danger: "bg-transparent border border-risk-high/30 text-risk-high hover:bg-risk-high-bg focus:ring-risk-high/50",
};

const sizes: Record<string, string> = {
  sm: "px-4 py-2 text-[10px] uppercase tracking-widest rounded-xl gap-1.5",
  md: "px-6 py-3 text-xs uppercase tracking-widest rounded-2xl gap-2",
  lg: "px-10 py-5 text-sm uppercase tracking-widest rounded-[2rem] gap-3",
  icon: "p-3 rounded-2xl",
};

const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', icon, loading, className = '', ...props
}) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.97 }}
    className={`inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream disabled:opacity-50 disabled:cursor-not-allowed select-none ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? (
      <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : icon ? (
      <span className={children ? '' : ''}>{icon}</span>
    ) : null}
    {children}
  </motion.button>
);

export default Button;