import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { MonthlyTopicCard, AddMonthlyTopicCard } from "./monthly-topic-card";

type WeeklyTopic = {
    weeklyTopicId: number;
    title: string;
    description: string;
    week: number;
    dateRange: string;
};

type MonthlyTopic = {
    monthlyTopicId: number;
    title: string;
    description: string;
    month: string;
    weeklyTopics: WeeklyTopic[];
};

type MainTopicCardProps = {
    topic: {
        id: number;
        title: string;
        description: string;
        monthlyTopics: MonthlyTopic[];
    };
    isExpanded: boolean;
    expandedMonthlyTopics: Set<number>;
    onToggleMain: () => void;
    onToggleMonthly: (id: number) => void;
};

export function MainTopicCard({
    topic,
    isExpanded,
    expandedMonthlyTopics,
    onToggleMain,
    onToggleMonthly,
}: MainTopicCardProps) {
    return (
        <div className="flex gap-4 w-full">
            {/* Main Topic Card */}
            <div className="flex-shrink-0 w-[30%]">
                <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                    onClick={onToggleMain}
                >
                    <div className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <Badge className="mb-2 bg-primary text-primary-foreground text-xs">
                                    Topik Utama
                                </Badge>
                                <h3 className="text-lg font-semibold">{topic.title}</h3>
                                <p className="text-sm text-muted-foreground">{topic.description}</p>
                                <div className="mt-3 text-xs text-muted-foreground">
                                    {topic.monthlyTopics.length} topik bulanan
                                </div>
                            </div>
                            <div>
                                {isExpanded ? (
                                    <IconChevronDown className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <IconChevronRight className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Monthly Topics Section */}
            {isExpanded && (
                <div className="flex-1 border-l-2 border-primary/20 pl-4">
                    <div className="space-y-3">
                        {topic.monthlyTopics.map((monthlyTopic) => (
                            <MonthlyTopicCard
                                key={monthlyTopic.monthlyTopicId}
                                monthlyTopic={monthlyTopic}
                                isExpanded={expandedMonthlyTopics.has(monthlyTopic.monthlyTopicId)}
                                onToggle={() => onToggleMonthly(monthlyTopic.monthlyTopicId)}
                            />
                        ))}
                        <AddMonthlyTopicCard />
                    </div>
                </div>
            )}
        </div>
    );
}

export function AddMainTopicCard() {
    return (
        <div className="flex-shrink-0 w-[30%]">
            <Card className="flex items-center justify-center hover:shadow-lg transition-shadow bg-transparent border-dashed border-2 hover:border-primary cursor-pointer min-h-[200px]">
                <span className="text-base text-muted-foreground">+ Tambah Topik Utama</span>
            </Card>
        </div>
    );
}
