import { SkeletonCard } from '@/components/skeleton/Skeletoncard';
import { SkeletonBlock } from '@/components/skeleton/Skeletonblocks';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* KPI row */}   
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Chart area */}
      <SkeletonBlock className="h-72 w-full" />
    </div>
  );
}