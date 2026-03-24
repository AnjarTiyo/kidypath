import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Polygon,
  Line,
  Circle,
} from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import type {
  DetailPayload,
} from '@/lib/types/weekly-report-detail'
import {
  MONTH_NAMES,
  STATUS_LABELS,
} from '@/lib/types/weekly-report-detail'

// SVGTextProps does not include `fontSize` in the type definitions but it is
// valid at runtime. Use this cast for SVG <Text> nodes that need fontSize.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SvgText = Text as React.ComponentType<any>

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary: '#3f52b2',
  primaryLight: '#eef0fa',
  success: '#46aa6b',
  successLight: '#eaf6ef',
  warning: '#e4a826',
  warningLight: '#fdf6e3',
  danger: '#db4141',
  dangerLight: '#fdf0f0',
  muted: '#737382',
  mutedBg: '#f3f3f8',
  border: '#e3e3e9',
  text: '#292933',
  white: '#ffffff',
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
  },

  // Header
  header: {
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    marginBottom: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: { flex: 1 },
  headerLabel: { fontSize: 8, color: C.muted, marginBottom: 2 },
  headerName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.primary },
  headerDate: { fontSize: 9, color: C.muted, marginTop: 2 },
  headerBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-end',
  },
  headerBadgeText: { fontSize: 8, color: C.primary, fontFamily: 'Helvetica-Bold' },

  // Section card
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: C.border,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: C.mutedBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cardTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.primary },
  cardBody: { paddingHorizontal: 12, paddingVertical: 10 },

  // Table
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 4,
  },
  tableCell: { flex: 1, fontSize: 8, paddingRight: 6 },
  tableHeaderCell: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.muted, paddingRight: 6 },

  // Badges
  badgeGreen: {
    backgroundColor: C.successLight,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  badgeGreenText: { fontSize: 7, color: C.success, fontFamily: 'Helvetica-Bold' },
  badgeRed: {
    backgroundColor: C.dangerLight,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  badgeRedText: { fontSize: 7, color: C.danger, fontFamily: 'Helvetica-Bold' },
  badgeYellow: {
    backgroundColor: C.warningLight,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  badgeYellowText: { fontSize: 7, color: C.warning, fontFamily: 'Helvetica-Bold' },

  // Scope scores
  scoregrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scoreItem: {
    width: '30%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: C.border,
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
  },
  scopeLabel: { fontSize: 8, color: C.muted, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', gap: 4 },
  scoreTag: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  scoreTagText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },

  // Summary
  summaryText: { fontSize: 9, lineHeight: 1.7, color: C.text },

  // Scope breakdown
  objectiveTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3, color: C.text },
  entryRow: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  entryDate: { fontSize: 7, color: C.muted, width: 50 },
  entryScore: { fontSize: 7, width: 28 },
  entryContext: { fontSize: 7, flex: 1, color: C.text },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.muted },
  signature: {
    marginBottom: 12,
    overflow: 'hidden',
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

// Emoji-free mood labels — Helvetica does not include emoji glyphs
const PDF_MOOD_LABELS: Record<string, string> = {
  bahagia: 'Bahagia',
  sedih: 'Sedih',
  marah: 'Marah',
  takut: 'Takut',
  jijik: 'Jijik',
}

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: 'Nilai Agama & Moral',
  physical_motor: 'Fisik Motorik',
  cognitive: 'Kognitif',
  language: 'Bahasa',
  social_emotional: 'Sosial Emosional',
  art: 'Seni',
}

const STATUS_BADGE_STYLES: Record<string, { container: Style; text: Style }> = {
  present: { container: s.badgeGreen, text: s.badgeGreenText },
  sick: { container: s.badgeRed, text: s.badgeRedText },
  permission: { container: s.badgeYellow, text: s.badgeYellowText },
}

const SCORE_PALETTE: Record<string, { bg: string; fg: string }> = {
  BB: { bg: '#fde8e8', fg: '#c53030' },
  MB: { bg: '#fef3c7', fg: '#b45309' },
  BSH: { bg: '#dbeafe', fg: '#1d4ed8' },
  BSB: { bg: '#dcfce7', fg: '#15803d' },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Sub-document sections ─────────────────────────────────────────────────────

function TopicsSection({ topics, monthName }: { topics: DetailPayload['topics']; monthName: string | null }) {
  if (!topics) return null

  const rowStyle = {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
  }
  const lastRowStyle = {
    paddingVertical: 6,
  }
  const labelStyle = { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.muted, marginBottom: 2 }
  const valueStyle = { fontSize: 8, color: C.text }

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Topik Pembelajaran</Text>
      </View>
      <View style={s.cardBody}>
        {topics.semester && (
          <View style={rowStyle}>
            <Text style={labelStyle}>Semester</Text>
            <Text style={valueStyle}>
              {topics.semester.title}
              {topics.semester.semesterNumber
                ? `  (Semester ${topics.semester.semesterNumber}, TA ${topics.semester.academicYear})`
                : ''}
            </Text>
          </View>
        )}
        {topics.monthly && (
          <View style={topics.weekly ? rowStyle : lastRowStyle}>
            <Text style={labelStyle}>Bulanan</Text>
            <Text style={valueStyle}>
              {topics.monthly.title}
              {monthName ? `  (${monthName})` : ''}
            </Text>
          </View>
        )}
        {topics.weekly && (
          <View style={lastRowStyle}>
            <Text style={labelStyle}>Mingguan</Text>
            <Text style={valueStyle}>
              {topics.weekly.title}
              {topics.weekly.weekNumber ? `  (Minggu ${topics.weekly.weekNumber})` : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

function AttendanceSection({ attendanceByDate }: { attendanceByDate: DetailPayload['attendanceByDate'] }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Rekap Kehadiran</Text>
      </View>
      <View style={s.cardBody}>
        {attendanceByDate.length === 0 ? (
          <Text style={{ fontSize: 8, color: C.muted }}>Tidak ada data kehadiran</Text>
        ) : (
          <>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { flex: 1.2 }]}>Tanggal</Text>
              <Text style={s.tableHeaderCell}>Status</Text>
              <Text style={s.tableHeaderCell}>Mood Masuk</Text>
              <Text style={s.tableHeaderCell}>Mood Pulang</Text>
            </View>
            {attendanceByDate.map((day) => {
              const status = day.checkIn?.status ?? ''
              const badge = STATUS_BADGE_STYLES[status]
              return (
                <View key={day.date} style={s.tableRow}>
                  <Text style={[s.tableCell, { flex: 1.2 }]}>{formatDate(day.date)}</Text>
                  <View style={[s.tableCell]}>
                    {status && badge ? (
                      <View style={badge.container}>
                        <Text style={badge.text}>{STATUS_LABELS[status] ?? status}</Text>
                      </View>
                    ) : (
                      <Text style={{ color: C.muted }}>—</Text>
                    )}
                  </View>
                  <Text style={s.tableCell}>
                    {day.checkIn?.mood ? (PDF_MOOD_LABELS[day.checkIn.mood] ?? day.checkIn.mood) : '—'}
                  </Text>
                  <Text style={s.tableCell}>
                    {day.checkOut?.mood ? (PDF_MOOD_LABELS[day.checkOut.mood] ?? day.checkOut.mood) : '—'}
                  </Text>
                </View>
              )
            })}
          </>
        )}
      </View>
    </View>
  )
}

// ── Radar chart helpers ──────────────────────────────────────────────────────

function radAngle(i: number, total: number) {
  return -Math.PI / 2 + (2 * Math.PI * i) / total
}

function radarPt(cx: number, cy: number, r: number, i: number, total: number) {
  const a = radAngle(i, total)
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function ptsStr(pts: { x: number; y: number }[]) {
  return pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

const RADAR_SHORT_LABELS: Record<string, string[]> = {
  religious_moral: ['Agama', '& Moral'],
  physical_motor: ['Fisik', 'Motorik'],
  cognitive: ['Kognitif'],
  language: ['Bahasa'],
  social_emotional: ['Sos.', 'Emosional'],
  art: ['Seni'],
}

function ScopeScoresSection({ scopeScores }: { scopeScores: DetailPayload['scopeScores'] }) {
  const orderedScopes = Object.keys(SCOPE_LABELS).filter((k) => !!scopeScores[k])
  if (orderedScopes.length === 0) return null

  const N = orderedScopes.length
  const SVG_W = 260
  const SVG_H = 230
  const cx = SVG_W / 2
  const cy = SVG_H / 2
  const R = 80
  const LABEL_PAD = 22
  const LEVELS = 4

  // Weighted average: BB=1, MB=2, BSH=3, BSB=4 — normalized 0-1
  const values = orderedScopes.map((scope) => {
    const sc = scopeScores[scope]
    if (!sc || sc.total === 0) return 0
    return Math.min((sc.BB * 1 + sc.MB * 2 + sc.BSH * 3 + sc.BSB * 4) / (4 * sc.total), 1)
  })

  const gridPolygons = Array.from({ length: LEVELS }, (_, lvl) => {
    const r = R * ((lvl + 1) / LEVELS)
    return ptsStr(orderedScopes.map((_, i) => radarPt(cx, cy, r, i, N)))
  })

  const axisEnds = orderedScopes.map((_, i) => radarPt(cx, cy, R, i, N))
  const dataPoints = orderedScopes.map((_, i) => radarPt(cx, cy, Math.max(R * values[i], 2), i, N))

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Skor per Lingkup Perkembangan</Text>
      </View>
      <View style={s.cardBody}>
        {/* Radar SVG — centred */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Svg width={SVG_W} height={SVG_H}>
            {/* Grid rings */}
            {gridPolygons.map((pts, lvl) => (
              <Polygon
                key={lvl}
                points={pts}
                fill={lvl % 2 === 0 ? '#f0f2ff' : '#ffffff'}
                stroke={C.border}
                strokeWidth={0.6}
              />
            ))}
            {/* Level labels (1–4) on top axis */}
            {Array.from({ length: LEVELS }, (_, lvl) => {
              const r = R * ((lvl + 1) / LEVELS)
              const pt = radarPt(cx, cy, r, 0, N)
              return (
                <SvgText key={`lv-${lvl}`} x={pt.x + 2} y={pt.y} fontSize={5} fill={C.muted} textAnchor="start">
                  {lvl + 1}
                </SvgText>
              )
            })}

            {/* Axis lines */}
            {axisEnds.map((pt, i) => (
              <Line
                key={i}
                x1={cx}
                y1={cy}
                x2={pt.x}
                y2={pt.y}
                stroke={C.border}
                strokeWidth={0.5}
              />
            ))}

            {/* Data polygon */}
            <Polygon
              points={ptsStr(dataPoints)}
              fill={C.primary}
              fillOpacity={0.3}
              stroke={C.primary}
              strokeWidth={1.5}
            />

            {/* Data dots */}
            {dataPoints.map((pt, i) => (
              <Circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill={C.primary} />
            ))}

            {/* Axis labels */}
            {orderedScopes.flatMap((scope, i) => {
              const a = radAngle(i, N)
              const lx = cx + (R + LABEL_PAD) * Math.cos(a)
              const ly = cy + (R + LABEL_PAD) * Math.sin(a)
              const anchor = Math.cos(a) > 0.25 ? 'start' : Math.cos(a) < -0.25 ? 'end' : 'middle'
              const lines = RADAR_SHORT_LABELS[scope] ?? [scope]
              const lineH = 8
              const startY = ly - (lines.length * lineH) / 2 + lineH / 2
              return lines.map((line, li) => (
                <SvgText
                  key={`lbl-${i}-${li}`}
                  x={lx}
                  y={startY + li * lineH}
                  fontSize={7}
                  fill={C.text}
                  textAnchor={anchor}
                >
                  {line}
                </SvgText>
              ))
            })}
          </Svg>
          <Text style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>
            Skala 1–4: BB = 1, MB = 2, BSH = 3, BSB = 4
          </Text>
        </View>

        {/* Score distribution table */}
        <View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 3, marginBottom: 4 }}>
            <Text style={{ flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted }}>Lingkup Perkembangan</Text>
            {(['BB', 'MB', 'BSH', 'BSB'] as const).map((lvl) => (
              <Text key={lvl} style={{ width: 30, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted, textAlign: 'center' }}>{lvl}</Text>
            ))}
            <Text style={{ width: 36, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted, textAlign: 'center' }}>Total</Text>
          </View>
          {orderedScopes.map((scope) => {
            const sc = scopeScores[scope]
            return (
              <View key={scope} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 3 }}>
                <Text style={{ flex: 1, fontSize: 7, color: C.text }}>{SCOPE_LABELS[scope] ?? scope}</Text>
                {(['BB', 'MB', 'BSH', 'BSB'] as const).map((lvl) => (
                  <View key={lvl} style={{ width: 30, alignItems: 'center' }}>
                    {sc[lvl] > 0 ? (
                      <View style={[s.scoreTag, { backgroundColor: SCORE_PALETTE[lvl].bg }]}>
                        <Text style={[s.scoreTagText, { color: SCORE_PALETTE[lvl].fg }]}>{sc[lvl]}</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 7, color: C.muted }}>—</Text>
                    )}
                  </View>
                ))}
                <Text style={{ width: 36, fontSize: 7, textAlign: 'center', color: C.muted }}>{sc.total}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

function AssessmentBreakdownSection({ scopeBreakdown }: { scopeBreakdown: DetailPayload['scopeBreakdown'] }) {
  if (scopeBreakdown.length === 0) return null

  const SCORE_LEGEND: { key: string; label: string }[] = [
    { key: 'BB', label: 'Belum Berkembang' },
    { key: 'MB', label: 'Mulai Berkembang' },
    { key: 'BSH', label: 'Berkembang Sesuai Harapan' },
    { key: 'BSB', label: 'Berkembang Sangat Baik' },
  ]

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Rincian Penilaian per Kompetensi</Text>
      </View>
      <View style={s.cardBody}>
        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
          {SCORE_LEGEND.map(({ key, label }) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={[s.scoreTag, { backgroundColor: SCORE_PALETTE[key].bg }]}>
                <Text style={[s.scoreTagText, { color: SCORE_PALETTE[key].fg }]}>{key}</Text>
              </View>
              <Text style={{ fontSize: 7, color: C.muted }}>=  {label}</Text>
            </View>
          ))}
        </View>
        {scopeBreakdown.map((group) => (
          <View key={group.scope} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.primary, marginBottom: 4 }}>
              {SCOPE_LABELS[group.scope] ?? group.scope}
            </Text>
            {group.objectives.map((obj) => (
              <View key={obj.objectiveId ?? obj.objectiveDescription} style={{ marginBottom: 6 }}>
                <Text style={s.objectiveTitle}>{obj.objectiveDescription ?? '—'}</Text>
                {obj.entries.map((entry, i) => (
                  <View key={i} style={s.entryRow}>
                    <Text style={s.entryDate}>{entry.date ? formatDate(entry.date) : '—'}</Text>
                    <View style={[s.scoreTag, { backgroundColor: entry.score ? SCORE_PALETTE[entry.score]?.bg : C.mutedBg }]}>
                      <Text style={[s.scoreTagText, { color: entry.score ? SCORE_PALETTE[entry.score]?.fg : C.muted }]}>
                        {entry.score ?? '—'}
                      </Text>
                    </View>
                    <Text style={s.entryContext}>{entry.activityContext ?? ''}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

function SummarySection({ summaryText, autoGenerated }: { summaryText: string | null; autoGenerated: boolean | null }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.cardTitle}>Ringkasan Pencapaian Mingguan</Text>
        </View>
      </View>
      <View style={s.cardBody}>
        {summaryText ? (
          <Text style={s.summaryText}>{summaryText}</Text>
        ) : (
          <Text style={{ fontSize: 8, color: C.muted, fontFamily: 'Helvetica-Oblique' }}>
            Belum ada ringkasan tersedia.
          </Text>
        )}
      </View>
    </View>
  )
}

function ImageGallerySection({ activityImages }: { activityImages: DetailPayload['activityImages'] }) {
  const filtered = activityImages.filter((img) => !!img.imageUrl)
  if (filtered.length === 0) return null

  const COLS = 3
  const IMG_SIZE = 155
  const rows: typeof filtered[] = []
  for (let i = 0; i < filtered.length; i += COLS) {
    rows.push(filtered.slice(i, i + COLS))
  }

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Galeri Aktivitas</Text>
      </View>
      <View style={s.cardBody}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            {row.map((img, ci) => (
              <View key={ci} style={{ width: IMG_SIZE, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' }}>
                <Image
                  src={img.imageUrl!}
                  style={{ width: IMG_SIZE, height: IMG_SIZE, objectFit: 'cover' }}
                />
                {img.date && (
                  <View style={{ backgroundColor: C.mutedBg, paddingHorizontal: 4, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 6, color: C.muted, textAlign: 'center' }}>
                      {formatDate(img.date)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

function SignatureSection({
  teachers,
  teacherQrCodes,
  reportDate,
}: {
  teachers: DetailPayload['teachers']
  teacherQrCodes: Record<string, string>
  reportDate: string | null
}) {
  const dateStr = reportDate
    ? new Date(reportDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const QR_SIZE = 72
  const signerList = teachers.length > 0 ? teachers : [{ id: '__placeholder__', name: null }]

  return (
    <View style={s.signature}>
      <View style={s.cardBody}>
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.muted, marginBottom: 14 }}>Mataram, {dateStr}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28 }}>
          {signerList.map((teacher) => {
            const qr = teacherQrCodes[teacher.id]
            return (
              <View key={teacher.id} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 7, color: C.muted, marginBottom: 6 }}>Wali Kelas</Text>
                {qr ? (
                  <Image src={qr} style={{ width: QR_SIZE, height: QR_SIZE }} />
                ) : (
                  // Placeholder box when QR is not yet available
                  <View
                    style={{
                      width: QR_SIZE,
                      height: QR_SIZE,
                      borderWidth: 1,
                      borderColor: C.border,
                      borderRadius: 2,
                    }}
                  />
                )}
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: C.text,
                    width: QR_SIZE + 20,
                    paddingTop: 4,
                    marginTop: 6,
                  }}
                >
                  <Text style={{ fontSize: 8, color: C.text, textAlign: 'center' }}>
                    Teacher {teacher.name ?? '—'}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

// ── Main PDF Document ─────────────────────────────────────────────────────────

interface WeeklyReportPdfProps {
  payload: DetailPayload
  /** Map of teacherId → base64 QR code data URL */
  teacherQrCodes?: Record<string, string>
}

export function WeeklyReportPdfDocument({ payload, teacherQrCodes = {} }: WeeklyReportPdfProps) {
  const { report, student, topics, attendanceByDate, scopeScores, scopeBreakdown, activityImages, teachers } = payload

  const monthName = topics?.monthly?.monthNumber
    ? MONTH_NAMES[(topics.monthly.monthNumber - 1) % 12]
    : null

  const printedAt = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })

  return (
    <Document title={`Laporan Mingguan - ${student?.fullName ?? '—'}`} author="Ansara Jurnal">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            <Text style={s.headerLabel}>Laporan Perkembangan Mingguan</Text>
            <Text style={s.headerName}>{student?.fullName ?? '—'}</Text>
            <Text style={s.headerDate}>
              {report.weekStart} – {report.weekEnd}
            </Text>
          </View>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>
              {report.isPublished ? 'TERBIT' : 'DRAF'}
            </Text>
          </View>
        </View>

        {/* Topics */}
        <TopicsSection topics={topics} monthName={monthName} />

        {/* Attendance */}
        <AttendanceSection attendanceByDate={attendanceByDate} />

        {/* Scope scores */}
        <ScopeScoresSection scopeScores={scopeScores} />

        {/* Assessment breakdown */}
        <AssessmentBreakdownSection scopeBreakdown={scopeBreakdown} />

        {/* Summary */}
        <SummarySection
          summaryText={report.summaryText}
          autoGenerated={report.autoGenerated}
        />

        {/* Activity image gallery */}
        <ImageGallerySection activityImages={activityImages} />

        {/* Signature */}
        <SignatureSection teachers={teachers} teacherQrCodes={teacherQrCodes} reportDate={report.weekEnd} />

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Sistem Jurnal Harian TK Putra 1 Mataram | KidyPath</Text>
          <Text style={s.footerText}>Dicetak pada {printedAt}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
