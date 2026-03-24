'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DetailPayload, WeeklyReport } from '@/lib/types/weekly-report-detail'

interface UseWeeklyReportDetailReturn {
  payload: DetailPayload | null
  loading: boolean
  error: string | null
  summaryText: string
  setSummaryText: (v: string) => void
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  saving: boolean
  saved: boolean
  generating: boolean
  publishing: boolean
  showPublishConfirm: boolean
  setShowPublishConfirm: (v: boolean) => void
  handleSave: () => Promise<void>
  handleGenerateAI: () => Promise<void>
  handlePublishToggle: (onPublished?: () => Promise<void>) => Promise<void>
  patchReport: (fields: Partial<WeeklyReport>) => void
}

export function useWeeklyReportDetail(reportId: string): UseWeeklyReportDetailReturn {
  const [payload, setPayload] = useState<DetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/weekly/${reportId}/detail`)
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Gagal memuat laporan')
      }
      const json = await res.json()
      const data: DetailPayload = json.data
      setPayload(data)
      setSummaryText(data.report.summaryText ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleSave = async () => {
    if (!payload) return
    setSaving(true)
    try {
      const res = await fetch(`/api/reports/weekly/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryText }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPayload((p) => (p ? { ...p, report: json.data } : p))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setIsEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!payload) return
    setGenerating(true)
    try {
      const res = await fetch('/api/reports/weekly/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: payload.report.studentId,
          weekStart: payload.report.weekStart,
          weekEnd: payload.report.weekEnd,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setSummaryText(json.summary)
      setIsEditing(true)
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const handlePublishToggle = async (onPublished?: () => Promise<void>) => {
    if (!payload) return
    setPublishing(true)
    try {
      const newPublished = !payload.report.isPublished
      const res = await fetch(`/api/reports/weekly/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newPublished }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPayload((p) => (p ? { ...p, report: json.data } : p))

      if (newPublished && onPublished) {
        await onPublished()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPublishing(false)
      setShowPublishConfirm(false)
    }
  }

  const patchReport = (fields: Partial<WeeklyReport>) => {
    setPayload((p) => (p ? { ...p, report: { ...p.report, ...fields } } : p))
  }

  return {
    payload,
    loading,
    error,
    summaryText,
    setSummaryText,
    isEditing,
    setIsEditing,
    saving,
    saved,
    generating,
    publishing,
    showPublishConfirm,
    setShowPublishConfirm,
    handleSave,
    handleGenerateAI,
    handlePublishToggle,
    patchReport,
  }
}
