import { SkeletonBlock } from '../skeleton/Skeletonblocks';

export function SkeletonCard() {
  return (
    <div className="rounded-xl border p-5 space-y-3">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-8 w-36" />
      <SkeletonBlock className="h-3 w-16" />
    </div>
  );
}