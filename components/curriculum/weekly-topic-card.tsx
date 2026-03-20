import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconCalendar } from "@tabler/icons-react";

type WeeklyTopicCardProps = {
    weeklyTopic: {
        weeklyTopicId: number;
        title: string;
        description: string;
        week: number;
        dateRange: string;
    };
};

export function WeeklyTopicCard({ weeklyTopic }: WeeklyTopicCardProps) {
    return (
        <div className="flex-shrink-0 w-full">
            <Card className="hover:shadow-sm transition-shadow h-full">
                <div className="p-2.5">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge className="bg-green-500 text-white text-xs">
                            Minggu {weeklyTopic.week}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconCalendar className="h-3 w-3" />
                            {weeklyTopic.dateRange}
                        </span>
                    </div>
                    <h5 className="text-sm font-semibold">{weeklyTopic.title}</h5>
                    <p className="text-xs text-muted-foreground">{weeklyTopic.description}</p>
                </div>
            </Card>
        </div>
    );
}

export function AddWeeklyTopicCard() {
    return (
        <div className="flex-shrink-0 w-[30%]">
            <Card className="flex items-center justify-center hover:shadow-sm transition-shadow bg-transparent border-dashed border hover:border-green-500 cursor-pointer h-16">
                <span className="text-xs text-muted-foreground">+ Tambah Topik Mingguan</span>
            </Card>
        </div>
    );
}
