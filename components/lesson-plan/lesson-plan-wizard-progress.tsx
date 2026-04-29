"use client"

import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"
import { FEATURE_FLAGS } from "@/lib/feature-flag"

export type WizardStep = 1 | 2 | 3

export function WizardProgress({ currentStep }: { currentStep: WizardStep }) {
  const steps = [
    { label: "Rincian Agenda" },
    { label: "Rangkaian Kegiatan" },
    ...(FEATURE_FLAGS.SHOW_LESSON_PLAN_PREVIEW ? [{ label: "Pratinjau" }] : []),
  ]

  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((step, idx) => {
        const stepNum = idx + 1
        const isDone = stepNum < currentStep
        const isActive = stepNum === currentStep
        return (
          <div key={idx} className="contents">
            <div
              className={cn(
                "flex items-center gap-2 text-xs shrink-0",
                isActive ? "text-primary font-semibold" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "border-2 border-muted text-muted-foreground"
                )}
              >
                {isDone ? <IconCheck size={12} /> : stepNum}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px min-w-4",
                  stepNum < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
