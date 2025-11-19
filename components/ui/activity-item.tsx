import { ChevronRight } from "lucide-react";

export function ActivityItem({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <div className="flex items-center justify-between bg-card border rounded-lg p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <ChevronRight size={18} className="text-muted-foreground" />
    </div>
  );
}
