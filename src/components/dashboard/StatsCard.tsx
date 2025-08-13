import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  className?: string;
  style?: React.CSSProperties;
}

export const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className = "",
  style
}: StatsCardProps) => {
  return (
    <div 
      className={`glass p-6 rounded-2xl border border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-lg ${className}`}
      style={style}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary mb-1">{value}</p>
          {description && (
            <p className="text-text-muted text-sm">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span 
                className={`text-sm font-medium ${
                  trend.direction === "up" 
                    ? "text-success" 
                    : "text-destructive"
                }`}
              >
                {trend.direction === "up" ? "↗" : "↘"} {Math.abs(trend.value)}%
              </span>
              <span className="text-text-muted text-sm">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};