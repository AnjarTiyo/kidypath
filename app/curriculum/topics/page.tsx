"use client"

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { IconChartTreemap, IconHome } from "@tabler/icons-react";
import {
    MainTopicCard,
    AddMainTopicCard,
    SemesterTopicDialog,
    MonthlyTopicDialog,
    WeeklyTopicDialog,
    DeleteTopicDialog,
    type SemesterTopicPayload,
    type MonthlyTopicPayload,
    type WeeklyTopicPayload,
} from "@/components/curriculum";
import { useSemesterTopics, type MonthlyTopicData, type WeeklyTopicData } from "@/lib/hooks/use-semester-topics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TopicsManagementPage() {
    const { topics, loading, error, refetch } = useSemesterTopics();
    const [expandedMainTopics, setExpandedMainTopics] = useState<Set<string>>(new Set());
    const [expandedMonthlyTopics, setExpandedMonthlyTopics] = useState<Set<string>>(new Set());

    // Semester dialog
    const [semesterDialog, setSemesterDialog] = useState<{ open: boolean; topic?: SemesterTopicPayload }>({ open: false });
    // Monthly dialog
    const [monthlyDialog, setMonthlyDialog] = useState<{ open: boolean; semesterId: string; topic?: MonthlyTopicPayload }>({ open: false, semesterId: "" });
    // Weekly dialog
    const [weeklyDialog, setWeeklyDialog] = useState<{ open: boolean; monthlyId: string; topic?: WeeklyTopicPayload }>({ open: false, monthlyId: "" });
    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; label: string; onConfirm: () => Promise<void> }>({
        open: false, label: "", onConfirm: async () => {},
    });

    const toggleMainTopic = (id: string) => {
        const newExpanded = new Set(expandedMainTopics);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
            const topic = topics.find(t => t.id === id);
            if (topic) {
                const newMonthly = new Set(expandedMonthlyTopics);
                topic.monthlyTopics.forEach(mt => newMonthly.delete(mt.monthlyTopicId));
                setExpandedMonthlyTopics(newMonthly);
            }
        } else {
            newExpanded.add(id);
        }
        setExpandedMainTopics(newExpanded);
    };

    const toggleMonthlyTopic = (id: string) => {
        const newExpanded = new Set(expandedMonthlyTopics);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedMonthlyTopics(newExpanded);
    };

    const openDeleteDialog = (label: string, url: string) => {
        setDeleteDialog({
            open: true,
            label,
            onConfirm: async () => {
                const res = await fetch(url, { method: "DELETE" });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error ?? "Gagal menghapus");
                }
                await refetch();
            },
        });
    };

    return (
        <>
            <PageHeader
                title="Topik"
                description="Kelola topik utama, bulanan, dan mingguan"
                breadcrumbs={[
                    { label: "Beranda", href: "/curriculum", icon: IconHome },
                    { label: "Manajemen Topik", href: "/curriculum/topics", icon: IconChartTreemap },
                ]}
            />

            <div className="space-y-4 w-full">
                {error && <p className="text-sm text-destructive">{error}</p>}

                {loading ? (
                    <div className="space-y-4 w-full">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <Skeleton className="h-5 w-1/3 mb-2" />
                                    <Skeleton className="h-4 w-2/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 w-full">
                        {topics.map((topic) => (
                            <MainTopicCard
                                key={topic.id}
                                topic={topic}
                                isExpanded={expandedMainTopics.has(topic.id)}
                                expandedMonthlyTopics={expandedMonthlyTopics}
                                onToggleMain={() => toggleMainTopic(topic.id)}
                                onToggleMonthly={toggleMonthlyTopic}
                                onEdit={() => setSemesterDialog({ open: true, topic })}
                                onDelete={() => openDeleteDialog(topic.title, `/api/semester-topics/${topic.id}`)}
                                onAddMonthly={() => setMonthlyDialog({ open: true, semesterId: topic.id })}
                                onEditMonthly={(monthly: MonthlyTopicData) =>
                                    setMonthlyDialog({
                                        open: true,
                                        semesterId: topic.id,
                                        topic: {
                                            id: monthly.monthlyTopicId,
                                            title: monthly.title,
                                            description: monthly.description,
                                            monthNumber: monthly.monthNumber,
                                        },
                                    })
                                }
                                onDeleteMonthly={(id: string) => {
                                    const mt = topic.monthlyTopics.find(m => m.monthlyTopicId === id);
                                    openDeleteDialog(mt?.title ?? "topik bulanan", `/api/monthly-topics/${id}`);
                                }}
                                onAddWeekly={(monthlyId: string) => setWeeklyDialog({ open: true, monthlyId })}
                                onEditWeekly={(weekly: WeeklyTopicData) =>
                                    setWeeklyDialog({
                                        open: true,
                                        monthlyId: weekly.monthlyTopicId ?? "",
                                        topic: {
                                            id: weekly.weeklyTopicId,
                                            title: weekly.title,
                                            description: weekly.description,
                                            weekNumber: weekly.week,
                                        },
                                    })
                                }
                                onDeleteWeekly={(id: string) => {
                                    const wt = topic.monthlyTopics
                                        .flatMap(m => m.weeklyTopics)
                                        .find(w => w.weeklyTopicId === id);
                                    openDeleteDialog(wt?.title ?? "topik mingguan", `/api/weekly-topics/${id}`);
                                }}
                            />
                        ))}
                        <AddMainTopicCard onClick={() => setSemesterDialog({ open: true })} />
                    </div>
                )}
            </div>

            {/* Semester Topic Dialog */}
            <SemesterTopicDialog
                open={semesterDialog.open}
                onOpenChange={(open) => setSemesterDialog((s) => ({ ...s, open }))}
                topic={semesterDialog.topic}
                onSuccess={refetch}
            />

            {/* Monthly Topic Dialog */}
            <MonthlyTopicDialog
                open={monthlyDialog.open}
                onOpenChange={(open) => setMonthlyDialog((s) => ({ ...s, open }))}
                semesterTopicId={monthlyDialog.semesterId}
                topic={monthlyDialog.topic}
                onSuccess={refetch}
            />

            {/* Weekly Topic Dialog */}
            <WeeklyTopicDialog
                open={weeklyDialog.open}
                onOpenChange={(open) => setWeeklyDialog((s) => ({ ...s, open }))}
                monthlyTopicId={weeklyDialog.monthlyId}
                topic={weeklyDialog.topic}
                onSuccess={refetch}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteTopicDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}
                label={deleteDialog.label}
                onConfirm={deleteDialog.onConfirm}
            />
        </>
    );
}