"use client"

import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AssessmentRow } from "./assessment-types"

interface AssessmentScoreTableProps {
  rows: AssessmentRow[]
  onUpdate: (index: number, field: keyof AssessmentRow, value: string) => void
  loading: boolean
}

const SCORES = ["BB", "MB", "BSH", "BSB"] as const

export function AssessmentScoreTable({ rows, onUpdate, loading }: AssessmentScoreTableProps) {
  return (
    <div className="mb-2 sm:mb-3 -mx-2 sm:-mx-3">
      <div className="border-y sm:border sm:rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px] sm:min-w-[800px]">
            <div className="max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-380px)] overflow-y-auto">
              <table className="w-full text-[10px] sm:text-[11px] table-fixed">
                <colgroup>
                  <col className="w-[100px] sm:w-[120px]" />
                  <col className="w-[150px] sm:w-[180px]" />
                  <col className="w-[180px] sm:w-[200px]" />
                  <col className="w-[30px] sm:w-[35px]" />
                  <col className="w-[30px] sm:w-[35px]" />
                  <col className="w-[30px] sm:w-[35px]" />
                  <col className="w-[30px] sm:w-[35px]" />
                  <col className="w-[140px] sm:w-[160px]" />
                </colgroup>
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium border-r align-middle">
                      Lingkup
                    </th>
                    <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium border-r align-middle">
                      Tujuan
                    </th>
                    <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium border-r align-middle">
                      Konteks
                    </th>
                    <th colSpan={4} className="text-center px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium border-r border-b">
                      Capaian
                    </th>
                    <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium align-middle">
                      Catatan
                    </th>
                  </tr>
                  <tr className="bg-muted">
                    {SCORES.map((score) => (
                      <th key={score} className="text-center px-0.5 sm:px-1 py-0.5 sm:py-1 font-medium border-r">
                        <span className="text-[9px] sm:text-[10px]">{score}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <TooltipProvider>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top border-r">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-medium leading-tight truncate cursor-help">
                                {row.scopeName}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">{row.scopeName}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top border-r">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="leading-tight line-clamp-2 cursor-help">
                                {row.objectiveDescription}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <p className="text-xs">{row.objectiveDescription}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top border-r">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="leading-tight line-clamp-3 cursor-help whitespace-pre-wrap">
                                {row.activityContext}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md">
                              <p className="text-xs whitespace-pre-wrap">{row.activityContext}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {SCORES.map((score) => (
                          <td key={score} className="px-0.5 sm:px-1 py-1 sm:py-1.5 align-middle text-center border-r">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={row.score === score}
                                onChange={() => onUpdate(index, "score", score)}
                                disabled={loading}
                                className="h-4 w-4 cursor-pointer"
                              />
                            </div>
                          </td>
                        ))}
                        <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top">
                          <Textarea
                            value={row.note}
                            onChange={(e) => onUpdate(index, "note", e.target.value)}
                            placeholder="..."
                            className="text-[10px] sm:text-[11px] min-h-[36px] sm:min-h-[40px] py-1 px-1.5 sm:px-2"
                            disabled={loading}
                            rows={2}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TooltipProvider>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
