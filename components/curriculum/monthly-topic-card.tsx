import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconCalendar, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { WeeklyTopicCard, AddWeeklyTopicCard } from "./weekly-topic-card";

type WeeklyTopic = {
    weeklyTopicId: number;
    title: string;
    description: string;
    week: number;
    dateRange: string;
};

type MonthlyTopicCardProps = {
    monthlyTopic: {
        monthlyTopicId: number;
        title: string;
        description: string;
        month: string;
        weeklyTopics: WeeklyTopic[];
    };
    isExpanded: boolean;
    onToggle: () => void;
};

export function MonthlyTopicCard({ monthlyTopic, isExpanded, onToggle }: MonthlyTopicCardProps) {
    return (
        <div className="flex gap-3 w-full">
            {/* Monthly Topic Card */}
            <div className="flex-shrink-0 w-[30%]">
                <Card
                    className="hover:shadow-md transition-shadow cursor-pointer h-full"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    <div className="p-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge className="bg-blue-500 text-white text-xs">
                                        Topik Bulanan
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <IconCalendar className="h-3 w-3" />
                                        {monthlyTopic.month}
                                    </span>
                                </div>
                                <h4 className="text-md font-semibold">{monthlyTopic.title}</h4>
                                <p className="text-xs text-muted-foreground">{monthlyTopic.description}</p>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    {monthlyTopic.weeklyTopics.length} topik mingguan
                                </div>
                            </div>
                            <div>
                                {isExpanded ? (
                                    <IconChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Weekly Topics Section */}
            {isExpanded && (
                <div className="flex-1 border-l-2 border-blue-500/20 pl-3">
                    <div className="space-y-2">
                        {monthlyTopic.weeklyTopics.map((weeklyTopic) => (
                            <WeeklyTopicCard
                                key={weeklyTopic.weeklyTopicId}
                                weeklyTopic={weeklyTopic}
                            />
                        ))}
                        <AddWeeklyTopicCard />
                    </div>
                </div>
            )}
        </div>
    );
}

export function AddMonthlyTopicCard() {
    return (
        <div className="flex-shrink-0 w-[30%]">
            <Card className="flex items-center justify-center hover:shadow-md transition-shadow bg-transparent border-dashed border-2 hover:border-blue-500 cursor-pointer min-h-[120px]">
                <span className="text-sm text-muted-foreground">+ Tambah Topik Bulanan</span>
            </Card>
        </div>
    );
}
