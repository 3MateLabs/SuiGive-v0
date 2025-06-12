"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ModernCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  glassmorphism?: boolean;
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, hover = true, glow = false, gradient = false, glassmorphism = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-white p-6",
          "border border-gray-100",
          "transition-all duration-300",
          hover && "hover:shadow-xl hover:shadow-gray-200/50",
          glow && "hover:shadow-xl hover:shadow-blue-500/20",
          gradient && "bg-gradient-to-br from-white to-gray-50",
          glassmorphism && "bg-white/80 backdrop-blur-xl border-white/20",
          className
        )}
        {...props}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/30 pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);
ModernCard.displayName = "ModernCard";

const ModernCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("mb-6", className)} {...props}>
      {children}
    </div>
  )
);
ModernCardHeader.displayName = "ModernCardHeader";

const ModernCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-xl font-semibold text-gray-900",
        "tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);
ModernCardTitle.displayName = "ModernCardTitle";

const ModernCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "mt-2 text-sm text-gray-500",
        "leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
);
ModernCardDescription.displayName = "ModernCardDescription";

const ModernCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
);
ModernCardContent.displayName = "ModernCardContent";

const ModernCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-6 pt-6 border-t border-gray-100",
        "flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ModernCardFooter.displayName = "ModernCardFooter";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "purple" | "orange" | "pink";
}

const StatCard = ({ title, value, subtitle, icon, trend, color = "blue" }: StatCardProps) => {
  const colorClasses = {
    blue: "from-[#e6f2fa] to-[#f0f8ff] text-[#0a2233]",
    green: "from-green-50 to-emerald-50 text-green-600",
    purple: "from-purple-50 to-pink-50 text-purple-600",
    orange: "from-orange-50 to-amber-50 text-orange-600",
    pink: "from-pink-50 to-rose-50 text-pink-600",
  };

  return (
    <ModernCard gradient className={`bg-gradient-to-br ${colorClasses[color].split(' ').slice(0, 2).join(' ')}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </motion.span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl bg-white/50 ${colorClasses[color].split(' ')[2]}`}>
            {icon}
          </div>
        )}
      </div>
    </ModernCard>
  );
};

// Interactive Card Component
interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const InteractiveCard = ({ children, onClick, className }: InteractiveCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer",
        className
      )}
    >
      <ModernCard hover glow>
        {children}
      </ModernCard>
    </motion.div>
  );
};

export {
  ModernCard,
  ModernCardHeader,
  ModernCardTitle,
  ModernCardDescription,
  ModernCardContent,
  ModernCardFooter,
  StatCard,
  InteractiveCard,
};