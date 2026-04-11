interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border-l-4 border-[#1a2d5a] shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[#1a2d5a] mb-4 text-xl">
        {icon}
      </div>
      <h3 className="font-bold text-[#1a2d5a] text-sm mb-2 uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}