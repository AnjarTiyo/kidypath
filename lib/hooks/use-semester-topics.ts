"use client"

import { useEffect, useState } from 'react';

export type WeeklyTopicData = {
  weeklyTopicId: string;
  title: string;
  description: string | null;
  week: number;
  dateRange: string;
  monthlyTopicId?: string;
};

export type MonthlyTopicData = {
  monthlyTopicId: string;
  title: string;
  description: string | null;
  month: string;
  monthNumber?: number | null;
  weeklyTopics: WeeklyTopicData[];
};

export type SemesterTopicData = {
  id: string;
  title: string;
  description: string | null;
  academicYear: string | null;
  semesterNumber: number | null;
  monthlyTopics: MonthlyTopicData[];
};

export function useSemesterTopics() {
  const [topics, setTopics] = useState<SemesterTopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/semester-topics');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to fetch topics');
      }
      const { data } = await res.json();
      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  return { topics, loading, error, refetch: fetchTopics };
}
