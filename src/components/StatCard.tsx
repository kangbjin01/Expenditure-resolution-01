interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="border border-border rounded-lg p-5 hover:border-foreground/30 transition-colors">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {title}
      </p>
      <p className="text-2xl font-semibold mt-2 tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}



