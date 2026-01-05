import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`glass-panel rounded-xl p-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassPanel;