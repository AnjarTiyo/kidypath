import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCalendar, IconPencil, IconTrash } from "@tabler/icons-react";

type WeeklyTopicCardProps = {
    weeklyTopic: {
        weeklyTopicId: string;
        title: string;
        description: string | null;
        week: number;
        dateRange: string;
    };
    onEdit: () => void;
    onDelete: () => void;
};

export function WeeklyTopicCard({ weeklyTopic, onEdit, onDelete }: WeeklyTopicCardProps) {
    return (
        <div className="flex-shrink-0 w-full">
            <Card className="hover:shadow-sm transition-shadow h-full">
                <div className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <Badge className="bg-green-500 text-white text-xs">
                                    Topik Mingguan
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <IconCalendar className="h-3 w-3" />
                                    {weeklyTopic.dateRange}
                                </span>
                            </div>
                            <h5 className="text-sm font-semibold">{weeklyTopic.title}</h5>
                            <p className="text-xs text-muted-foreground">{weeklyTopic.description}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            >
                                <IconPencil className="h-3 w-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            >
                                <IconTrash className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export function AddWeeklyTopicCard({ onClick }: { onClick: () => void }) {
    return (
        <div className="flex-shrink-0 w-[30%]">
            <Card
                className="flex items-center justify-center hover:shadow-sm transition-shadow bg-transparent border-dashed border hover:border-green-500 cursor-pointer h-16"
                onClick={onClick}
            >
                <span className="text-xs text-muted-foreground">+ Tambah Topik Mingguan</span>
            </Card>
        </div>
    );
}
