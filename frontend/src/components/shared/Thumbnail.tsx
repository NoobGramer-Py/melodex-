import { Music } from 'lucide-react';

interface ThumbnailProps {
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-full aspect-square',
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 40,
};

export function Thumbnail({ src, alt, size = 'md', className = '' }: ThumbnailProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizes[size]} object-cover rounded-md flex-shrink-0 ${className}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} bg-surface rounded-md flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <Music size={iconSizes[size]} className="text-textMuted" />
    </div>
  );
}
