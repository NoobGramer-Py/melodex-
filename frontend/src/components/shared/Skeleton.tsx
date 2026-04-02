interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-surface animate-skeleton-pulse rounded ${className}`}
    />
  );
}

export function SongCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg">
      <Skeleton className="w-12 h-12 rounded-md flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function GridCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="w-full aspect-square rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
