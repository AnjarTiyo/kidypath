"use client"

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { IconHome } from "@tabler/icons-react";
import {
    MainTopicCard,
    AddMainTopicCard,
} from "@/components/curriculum";

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

type MainTopic = {
    id: number;
    title: string;
    description: string;
    monthlyTopics: MonthlyTopic[];
};

export default function TopicsManagementPage() {
    const [expandedMainTopics, setExpandedMainTopics] = useState<Set<number>>(new Set());
    const [expandedMonthlyTopics, setExpandedMonthlyTopics] = useState<Set<number>>(new Set());

    const toggleMainTopic = (id: number) => {
        const newExpanded = new Set(expandedMainTopics);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
            // Also collapse all monthly topics under this main topic
            const topic = topics.find(t => t.id === id);
            if (topic) {
                topic.monthlyTopics.forEach(mt => {
                    expandedMonthlyTopics.delete(mt.monthlyTopicId);
                });
                setExpandedMonthlyTopics(new Set(expandedMonthlyTopics));
            }
        } else {
            newExpanded.add(id);
        }
        setExpandedMainTopics(newExpanded);
    };

    const toggleMonthlyTopic = (id: number) => {
        const newExpanded = new Set(expandedMonthlyTopics);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedMonthlyTopics(newExpanded);
    };

    const topics: MainTopic[] = [
        {
            id: 1,
            title: 'Aku Cinta Bumi',
            description:
                'Topik tentang pentingnya menjaga lingkungan hidup dan cara-cara melestarikan alam sekitar kita.',
            monthlyTopics: [
                {
                    monthlyTopicId: 1,
                    title: 'Mengurangi Sampah Plastik',
                    description:
                        'Pembahasan tentang dampak sampah plastik terhadap lingkungan dan cara-cara menguranginya.',
                    month: 'Januari 2025',
                    weeklyTopics: [
                        {
                            weeklyTopicId: 1,
                            title: 'Dampak Sampah Plastik di Laut',
                            description:
                                'Mempelajari bagaimana sampah plastik mencemari lautan dan mengancam kehidupan laut.',
                            week: 1,
                            dateRange: '1-5 Januari 2025',
                        },
                        {
                            weeklyTopicId: 2,
                            title: 'Alternatif Pengganti Plastik',
                            description:
                                'Mengenal bahan-bahan ramah lingkungan yang dapat digunakan sebagai pengganti plastik.',
                            week: 2,
                            dateRange: '8-12 Januari 2025',
                        },
                    ],
                },
                {
                    monthlyTopicId: 2,
                    title: 'Menjaga Kebersihan Lingkungan',
                    description:
                        'Mengajak anak untuk menjaga kebersihan lingkungan sekolah dan rumah.',
                    month: 'Februari 2025',
                    weeklyTopics: [
                        {
                            weeklyTopicId: 3,
                            title: 'Membuang Sampah pada Tempatnya',
                            description:
                                'Membiasakan anak membuang sampah sesuai jenis dan tempatnya.',
                            week: 1,
                            dateRange: '3-7 Februari 2025',
                        },
                        {
                            weeklyTopicId: 4,
                            title: 'Kerja Bakti di Sekolah',
                            description:
                                'Melakukan kegiatan bersih-bersih bersama di lingkungan sekolah.',
                            week: 2,
                            dateRange: '10-14 Februari 2025',
                        },
                    ],
                },
            ],
        },
        {
            id: 2,
            title: 'Ciptaan Tuhan',
            description:
                'Topik untuk mengenalkan anak pada berbagai ciptaan Tuhan dan menumbuhkan rasa syukur serta kepedulian.',
            monthlyTopics: [
                {
                    monthlyTopicId: 3,
                    title: 'Tubuhku Ciptaan Tuhan',
                    description:
                        'Mengenal bagian-bagian tubuh dan fungsinya sebagai ciptaan Tuhan yang harus dijaga.',
                    month: 'Maret 2025',
                    weeklyTopics: [
                        {
                            weeklyTopicId: 5,
                            title: 'Mengenal Anggota Tubuh',
                            description:
                                'Mengenal mata, hidung, telinga, tangan, dan kaki beserta fungsinya.',
                            week: 1,
                            dateRange: '3-7 Maret 2025',
                        },
                        {
                            weeklyTopicId: 6,
                            title: 'Merawat Tubuhku',
                            description:
                                'Belajar cara menjaga kebersihan dan kesehatan tubuh sehari-hari.',
                            week: 2,
                            dateRange: '10-14 Maret 2025',
                        },
                    ],
                },
                {
                    monthlyTopicId: 4,
                    title: 'Alam Sekitar Ciptaan Tuhan',
                    description:
                        'Mengenal alam sekitar sebagai ciptaan Tuhan yang perlu dijaga dan disyukuri.',
                    month: 'April 2025',
                    weeklyTopics: [
                        {
                            weeklyTopicId: 7,
                            title: 'Hewan Ciptaan Tuhan',
                            description:
                                'Mengenal berbagai jenis hewan dan cara menyayanginya.',
                            week: 1,
                            dateRange: '1-4 April 2025',
                        },
                        {
                            weeklyTopicId: 8,
                            title: 'Tumbuhan Ciptaan Tuhan',
                            description:
                                'Mengenal berbagai jenis tumbuhan dan manfaatnya bagi kehidupan.',
                            week: 2,
                            dateRange: '7-11 April 2025',
                        },
                    ],
                },
            ],
        },
    ];

    return (
        <>
            <PageHeader
                title="Topik"
                description="Kelola topik utama, bulanan, dan mingguan"
                breadcrumbs={[
                    { label: "Beranda", href: "/teacher", icon: IconHome },
                    { label: "Manajemen Kurikulum", href: "/teacher/curriculum" },
                    { label: "Manajemen Topik", href: "/teacher/curriculum/topics" },
                ]}
            />

            <div className="space-y-4 w-full">
                {/* Main Topics - Vertical List */}
                <div className="space-y-4 w-full">
                    {topics.map((topic) => (
                        <MainTopicCard
                            key={topic.id}
                            topic={topic}
                            isExpanded={expandedMainTopics.has(topic.id)}
                            expandedMonthlyTopics={expandedMonthlyTopics}
                            onToggleMain={() => toggleMainTopic(topic.id)}
                            onToggleMonthly={toggleMonthlyTopic}
                        />
                    ))}
                    <AddMainTopicCard />
                </div>
            </div>
        </>
    );
}