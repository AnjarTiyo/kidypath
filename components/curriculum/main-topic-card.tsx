import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconChevronDown, IconChevronRight, IconPencil, IconTrash } from "@tabler/icons-react";
import { MonthlyTopicCard, AddMonthlyTopicCard } from "./monthly-topic-card";

type WeeklyTopic = {
    weeklyTopicId: string;
    title: string;
    description: string | null;
    week: number;
    dateRange: string;
};

type MonthlyTopic = {
    monthlyTopicId: string;
    title: string;
    description: string | null;
    month: string;
    weeklyTopics: WeeklyTopic[];
};

type MainTopicCardProps = {
    topic: {
        id: string;
        title: string;
        description: string | null;
        monthlyTopics: MonthlyTopic[];
    };
    isExpanded: boolean;
    expandedMonthlyTopics: Set<string>;
    onToggleMain: () => void;
    onToggleMonthly: (id: string) => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddMonthly: () => void;
    onEditMonthly: (monthly: MonthlyTopic) => void;
    onDeleteMonthly: (id: string) => void;
    onAddWeekly: (monthlyId: string) => void;
    onEditWeekly: (weekly: WeeklyTopic) => void;
    onDeleteWeekly: (id: string) => void;
};

export function MainTopicCard({
    topic,
    isExpanded,
    expandedMonthlyTopics,
    onToggleMain,
    onToggleMonthly,
    onEdit,
    onDelete,
    onAddMonthly,
    onEditMonthly,
    onDeleteMonthly,
    onAddWeekly,
    onEditWeekly,
    onDeleteWeekly,
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
                                    Topik Utama - Semester
                                </Badge>
                                <h3 className="text-lg font-semibold">{topic.title}</h3>
                                <p className="text-sm text-muted-foreground">{topic.description}</p>
                                <div className="mt-3 text-xs text-muted-foreground">
                                    {topic.monthlyTopics.length} topik bulanan
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    >
                                        <IconPencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    >
                                        <IconTrash className="h-4 w-4" />
                                    </Button>
                                </div>
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
                                onEdit={() => onEditMonthly(monthlyTopic)}
                                onDelete={() => onDeleteMonthly(monthlyTopic.monthlyTopicId)}
                                onAddWeekly={() => onAddWeekly(monthlyTopic.monthlyTopicId)}
                                onEditWeekly={onEditWeekly}
                                onDeleteWeekly={onDeleteWeekly}
                            />
                        ))}
                        <AddMonthlyTopicCard onClick={onAddMonthly} />
                    </div>
                </div>
            )}
        </div>
    );
}

export function AddMainTopicCard({ onClick }: { onClick: () => void }) {
    return (
        <div className="flex-shrink-0 w-[30%]">
            <Card
                className="flex items-center justify-center hover:shadow-lg transition-shadow bg-transparent border-dashed border-2 hover:border-primary cursor-pointer min-h-[200px]"
                onClick={onClick}
            >
                <span className="text-base text-muted-foreground">+ Tambah Topik Utama (Semester)</span>
            </Card>
        </div>
    );
}
