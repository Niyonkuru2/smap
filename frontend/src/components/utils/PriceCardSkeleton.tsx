import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export default function PriceCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  );
}
