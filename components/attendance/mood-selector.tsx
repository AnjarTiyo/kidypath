"use client"

import { cn } from "@/lib/utils"

export type MoodType = "bahagia" | "sedih" | "marah" | "takut" | "jijik"

interface MoodOption {
  value: MoodType
  emoji: string
  label: string
  description: string
  color: string
}

const moodOptions: MoodOption[] = [
  {
    value: "bahagia",
    emoji: "😊",
    label: "Bahagia",
    description: "Gembira & Senang",
    color: "hover:bg-yellow-100 hover:border-yellow-400 data-[selected=true]:bg-yellow-100 data-[selected=true]:border-yellow-400",
  },
  {
    value: "sedih",
    emoji: "😢",
    label: "Sedih",
    description: "Kecewa",
    color: "hover:bg-blue-100 hover:border-blue-400 data-[selected=true]:bg-blue-100 data-[selected=true]:border-blue-400",
  },
  {
    value: "marah",
    emoji: "😠",
    label: "Marah",
    description: "Kesal",
    color: "hover:bg-red-100 hover:border-red-400 data-[selected=true]:bg-red-100 data-[selected=true]:border-red-400",
  },
  {
    value: "takut",
    emoji: "😰",
    label: "Takut",
    description: "Cemas",
    color: "hover:bg-purple-100 hover:border-purple-400 data-[selected=true]:bg-purple-100 data-[selected=true]:border-purple-400",
  },
  {
    value: "jijik",
    emoji: "🤢",
    label: "Jijik",
    description: "Tidak Nyaman",
    color: "hover:bg-green-100 hover:border-green-400 data-[selected=true]:bg-green-100 data-[selected=true]:border-green-400",
  },
]

interface MoodSelectorProps {
  selectedMood: MoodType | null
  onMoodSelect: (mood: MoodType) => void
  disabled?: boolean
}

export function MoodSelector({ selectedMood, onMoodSelect, disabled = false }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {moodOptions.map((mood) => (
        <button
          key={mood.value}
          type="button"
          data-selected={selectedMood === mood.value}
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            mood.color,
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer active:scale-95"
          )}
          onClick={() => !disabled && onMoodSelect(mood.value)}
          disabled={disabled}
        >
          <div className="text-4xl mb-1">{mood.emoji}</div>
          <div className="font-semibold text-xs text-center">{mood.label}</div>
          <div className="text-[10px] text-muted-foreground text-center line-clamp-1">
            {mood.description}
          </div>
        </button>
      ))}
    </div>
  )
}

export { moodOptions }
