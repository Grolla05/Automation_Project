import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className }) => {
  return (
    <div className={twMerge(
      "bg-apple-white rounded-apple-lg shadow-apple p-8 max-w-2xl w-full border border-apple-gray/10 dark:border-white/5 transition-colors duration-500",
      className
    )}>
      {children}
    </div>
  );
};

export default Card;
