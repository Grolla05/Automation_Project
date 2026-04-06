import React from 'react';
import { twMerge } from 'tailwind-merge';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'blue';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Estilo visual do botão */
  variant?: ButtonVariant;
  /** Conteúdo do botão */
  children: React.ReactNode;
  /** Indica se o botão está em estado de carregamento */
  isLoading?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const baseStyles =
  'px-6 py-3 min-h-[44px] min-w-[44px] rounded-apple font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-opacity-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 flex items-center justify-center relative overflow-hidden group hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-apple-text text-apple-white hover:bg-black shadow-apple hover:shadow-lg',
  secondary:
    'bg-apple-white text-apple-text border border-apple-gray hover:bg-apple-gray/20 shadow-apple',
  ghost: 'bg-transparent text-apple-text hover:bg-apple-gray/30',
  blue: 'bg-apple-blue text-white hover:bg-[#005bb5] shadow-[0_4px_14px_0_rgba(0,113,227,0.39)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.45)]',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled,
  isLoading,
  type = 'button',
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;
  const hasShineEffect =
    !isDisabled && (variant === 'blue' || variant === 'primary');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={twMerge(baseStyles, variants[variant], className)}
      {...props}
    >
      <span className={twMerge(
        "relative z-10 flex items-center justify-center space-x-2 transition-opacity duration-200",
        isLoading ? "opacity-0" : "opacity-100"
      )}>
        {children}
      </span>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="animate-spin h-5 w-5 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {hasShineEffect && (
        <span className="absolute inset-0 w-[200%] h-full -ml-[100%] bg-white/20 blur-sm transform -skew-x-30 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      )}
    </button>
  );
};

export default Button;
