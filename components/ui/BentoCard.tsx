import React from 'react';

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

const BentoCard: React.FC<BentoCardProps> = ({ children, className = '', title, action, ...props }) => {
  return (
    <div 
      className={`bento-card card-shine flex flex-col h-full ${className}`} 
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-bold text-lg tracking-tight text-white">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 relative">
        {children}
      </div>
    </div>
  );
};

export default BentoCard;