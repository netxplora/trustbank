import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ProductCardProps {
  image: string;
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  ctaText?: string;
}

export function ProductCard({
  image,
  icon: Icon,
  title,
  description,
  link,
  ctaText = "Learn More",
}: ProductCardProps) {
  return (
    <div className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:border-primary/20 hover-lift transition-all duration-300 flex flex-col h-full">
      {/* Visual Header */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Floating Icon Chip */}
        <div className="absolute bottom-4 left-4 h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shadow-lg text-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Hover Link */}
        <Link
          to={link}
          className="inline-flex items-center text-xs font-semibold text-primary group-hover:text-secondary transition-colors gap-1.5 pt-2 border-t border-muted"
        >
          {ctaText} <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}
