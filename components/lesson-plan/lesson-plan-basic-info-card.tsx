"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
    IconCalendar,
    IconSparkles,
    IconLoader2,
    IconDeviceFloppy,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { CurrentTopicsPayload } from "@/lib/types/current-topics"

interface Classroom {
    id: string
    name: string
    academicYear: string
}

interface BasicInfoFormData {
    classroomId: string
    date: Date | undefined
    topic: string
    subtopic: string
    code: string
}

interface LessonPlanBasicInfoCardProps {
    formData: BasicInfoFormData
    classrooms: Classroom[]
    loadingClassrooms: boolean
    generatedByAi: boolean
    isGenerating: boolean
    saving: boolean
    userRole?: "teacher" | "admin"
    errors: Record<string, string>
    onFormChange: (data: Partial<BasicInfoFormData>) => void
    onGenerateWithAI: (prompt?: string) => void
    onSave: () => void
    onCancel: () => void
    currentTopics: CurrentTopicsPayload | null
    topicsLoading: boolean
    topicsError?: string | null
}

export function LessonPlanBasicInfoCard({
    formData,
    classrooms,
    loadingClassrooms,
    generatedByAi,
    isGenerating,
    saving,
    userRole = "teacher",
    errors,
    onFormChange,
    onGenerateWithAI,
    onSave,
    onCancel,
    currentTopics,
    topicsLoading,
    topicsError,
}: LessonPlanBasicInfoCardProps) {
    const [aiPromptOpen, setAiPromptOpen] = useState(false)
    const [aiPrompt, setAiPrompt] = useState("")

    const handleGenerateClick = () => {
        if (!formData.topic.trim()) {
            return
        }
        onGenerateWithAI(aiPrompt.trim())
        setAiPromptOpen(false)
        setAiPrompt("")
    }

    const topicDateLabel = formData.date
        ? format(formData.date, "dd MMM yyyy", { locale: id })
        : "Belum memilih tanggal"

    const hasTopicDate = Boolean(formData.date)

    const semesterMeta = currentTopics?.semester
        ? [
            currentTopics.semester.semesterNumber ? `Semester ${currentTopics.semester.semesterNumber}` : undefined,
            currentTopics.semester.academicYear,
          ]
            .filter(Boolean)
            .join(" • ")
        : undefined

    const monthlyMeta = currentTopics?.monthly
        ? [
            currentTopics.monthly.month,
            currentTopics.monthly.monthNumber ? `Bulan ke-${currentTopics.monthly.monthNumber}` : undefined,
          ]
            .filter(Boolean)
            .join(" • ")
        : undefined

    const weeklyMeta = currentTopics?.weekly?.weekNumber
        ? `Minggu ${currentTopics.weekly.weekNumber}`
        : undefined

    const semesterTopic = currentTopics?.semester
        ? { title: currentTopics.semester.title, description: currentTopics.semester.description }
        : null

    const monthlyTopic = currentTopics?.monthly
        ? { title: currentTopics.monthly.title, description: currentTopics.monthly.description }
        : null

    const weeklyTopic = currentTopics?.weekly
        ? { title: currentTopics.weekly.title, description: currentTopics.weekly.description }
        : null

    const renderTopicBlock = (
        label: string,
        topic: { title: string; description: string | null } | null,
        meta?: string
    ) => (
        <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            {topic ? (
                <>
                    {meta && <p className="text-[10px] text-muted-foreground">{meta}</p>}
                    <p className="text-sm font-semibold leading-snug">{topic.title}</p>
                    {topic.description && (
                        <p className="text-[10px] text-muted-foreground">
                            {topic.description}
                        </p>
                    )}
                </>
            ) : (
                <p className="text-[10px] text-muted-foreground">
                    Belum tersedia topik {label.toLowerCase()}
                </p>
            )}
        </div>
    )

    return (
        <Card className="h-fit">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Informasi Dasar</CardTitle>
                        <CardDescription className="text-xs">Data umum rencana pembelajaran</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Popover open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    disabled={isGenerating || !formData.topic.trim()}
                                    variant="default"
                                    size="sm"
                                >
                                    {isGenerating ? (
                                        <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                        <IconSparkles className="mr-1 h-3 w-3" />
                                    )}
                                    AI
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm flex items-center">
                                            <IconSparkles className="mr-1 h-4 w-4" />
                                            Instruksi untuk AI
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Berikan instruksi tambahan untuk membuat rencana pembelajaran yang lebih sesuai (opsional)
                                        </p>
                                    </div>
                                    <Textarea
                                        placeholder="Contoh: Fokus pada aktivitas outdoor, gunakan metode bermain sambil belajar, sesuaikan untuk anak usia 4-5 tahun..."
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        rows={4}
                                        className="resize-none text-xs"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setAiPromptOpen(false)
                                                setAiPrompt("")
                                            }}
                                            className="flex-1"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleGenerateClick}
                                            disabled={isGenerating}
                                            size="sm"
                                            className="flex-1"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <IconSparkles className="mr-1 h-3 w-3" />
                                                    Generate
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            type="button"
                            onClick={onSave}
                            disabled={saving || (userRole === "teacher" && classrooms.length === 0)}
                            size="sm"
                        >
                            {saving && <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />}
                            <IconDeviceFloppy className="mr-1 h-3 w-3" />
                            {saving ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Classroom */}
                    <div className="space-y-1.5">
                        <Label htmlFor="classroom" className="text-xs">
                            Rombongan Belajar <span className="text-destructive">*</span>
                        </Label>
                        {userRole === "teacher" ? (
                            <>
                                <Input
                                    id="classroom"
                                    value={classrooms.find(c => c.id === formData.classroomId)?.name || ""}
                                    disabled
                                    className="h-9 text-xs bg-muted"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Rombongan belajar ditentukan otomatis
                                </p>
                            </>
                        ) : (
                            <Select
                                value={formData.classroomId}
                                onValueChange={(value) => onFormChange({ classroomId: value })}
                                disabled={loadingClassrooms || classrooms.length === 0}
                            >
                                <SelectTrigger id="classroom" className="h-9">
                                    <SelectValue placeholder="Pilih rombongan belajar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingClassrooms ? (
                                        <div className="p-2 text-center text-xs text-muted-foreground">
                                            Memuat...
                                        </div>
                                    ) : classrooms.length === 0 ? (
                                        <div className="p-2 text-center text-xs text-muted-foreground">
                                            Tidak ada rombongan belajar
                                        </div>
                                    ) : (
                                        classrooms.map((classroom) => (
                                            <SelectItem key={classroom.id} value={classroom.id}>
                                                {classroom.name} - {classroom.academicYear}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.classroomId && (
                            <p className="text-xs text-destructive">{errors.classroomId}</p>
                        )}
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">
                            Tanggal <span className="text-destructive">*</span>
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full h-9 justify-start text-left font-normal text-xs",
                                        !formData.date && "text-muted-foreground"
                                    )}
                                >
                                    <IconCalendar className="mr-2 h-3 w-3" />
                                    {formData.date ? (
                                        format(formData.date, "PPP", { locale: id })
                                    ) : (
                                        <span>Pilih tanggal</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.date}
                                    onSelect={(date) => onFormChange({ date })}
                                    defaultMonth={formData.date}
                                    locale={id}
                                    modifiers={{
                                        selected: formData.date ? [formData.date] : [],
                                    }}
                                    modifiersClassNames={{
                                        selected: "bg-secondary text-white font-semibold hover:bg-secondary/80 hover:text-primary-foreground rounded-md",
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.date && (
                            <p className="text-xs text-destructive">{errors.date}</p>
                        )}
                    </div>

                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Topik kurikulum
                        </p>
                        <p className="text-[10px] text-muted-foreground">{topicDateLabel}</p>
                    </div>
                    {!hasTopicDate && (
                        <p className="text-[10px] text-muted-foreground">
                            Pilih tanggal agar topik semester, bulanan, dan mingguan dapat ditampilkan.
                        </p>
                    )}
                    {hasTopicDate && topicsLoading && (
                        <p className="text-[10px] text-muted-foreground">
                            Memuat topik untuk tanggal terpilih...
                        </p>
                    )}
                    {hasTopicDate && topicsError && (
                        <p className="text-[10px] text-destructive">{topicsError}</p>
                    )}
                    {hasTopicDate && !topicsLoading && !topicsError && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {renderTopicBlock("Topik Semester", semesterTopic, semesterMeta)}
                            {renderTopicBlock("Topik Bulanan", monthlyTopic, monthlyMeta)}
                            {renderTopicBlock("Topik Mingguan", weeklyTopic, weeklyMeta)}
                        </div>
                    )}
                </div>
                {/* Topic */}
                <div className="space-y-1.5">
                    <Label htmlFor="topic" className="text-xs">
                        Tema Pembelajaran <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="topic"
                        placeholder="Contoh: Mengenal Hewan dan Tumbuhan"
                        value={formData.topic}
                        onChange={(e) => onFormChange({ topic: e.target.value })}
                        rows={2}
                        className="resize-none text-xs"
                    />
                    {errors.topic && (
                        <p className="text-xs text-destructive">{errors.topic}</p>
                    )}
                </div>

                {/* Subtopic */}
                <div className="space-y-1.5">
                    <Label htmlFor="subtopic" className="text-xs">Sub Tema (Opsional)</Label>
                    <Textarea
                        id="subtopic"
                        placeholder="Contoh: Hewan Peliharaan"
                        value={formData.subtopic}
                        onChange={(e) => onFormChange({ subtopic: e.target.value })}
                        rows={2}
                        className="resize-none text-xs"
                    />
                </div>

                {/* Code */}
                <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-xs">Kode (Opsional)</Label>
                    <Input
                        id="code"
                        type="text"
                        placeholder="Contoh: LP-001"
                        value={formData.code}
                        onChange={(e) => onFormChange({ code: e.target.value })}
                        className="h-9 text-xs"
                    />
                </div>

                {generatedByAi && (
                    <div className="pt-2">
                        <Badge variant="secondary" className="text-xs">
                            <IconSparkles className="mr-1 h-3 w-3" />
                            AI Generated
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
