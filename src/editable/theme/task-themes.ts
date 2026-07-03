import type { CSSProperties } from 'react'
import type { TaskKey } from '@/lib/site-config'

export type TaskTheme = {
  /** short flavour word shown as an eyebrow kicker */
  kicker: string
  /** one-line mood note for the page intro */
  note: string
  dark: boolean
  fontDisplay: string
  fontBody: string
  bg: string
  surface: string
  raised: string
  text: string
  muted: string
  line: string
  accent: string
  accentSoft: string
  onAccent: string
  glow: string
  radius: string
}

const DISPLAY_FONT = "'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif"
const BODY_FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

const base = {
  dark: false,
  fontDisplay: DISPLAY_FONT,
  fontBody: BODY_FONT,
  bg: '#f7f3ea',
  surface: '#ffffff',
  raised: '#fff7eb',
  text: '#1f2b24',
  muted: '#657c6a',
  line: '#dfe8df',
  accent: '#bb3e00',
  accentSoft: '#f9e4d0',
  onAccent: '#ffffff',
  glow: 'rgba(247,173,69,0.18)',
  radius: '1.25rem',
} satisfies Omit<TaskTheme, 'kicker' | 'note'>

export const taskThemes: Record<TaskKey, TaskTheme> = {
  article: { ...base, kicker: 'Guides', note: 'A reading-first collection with editorial pacing and crisp story blocks.' },
  listing: { ...base, kicker: 'Directory', note: 'Search local businesses, compare essentials, and contact them quickly.' },
  classified: { ...base, kicker: 'Classifieds', note: 'Fresh ads, practical details, and faster ways to act on an offer.' },
  image: { ...base, kicker: 'Gallery', note: 'Image-led discovery with a cleaner showcase rhythm.' },
  sbm: { ...base, kicker: 'Resources', note: 'Curated links and bookmarked sources in a tidy magazine shell.' },
  pdf: { ...base, kicker: 'Library', note: 'Documents and downloadable references with a grounded editorial frame.' },
  profile: { ...base, kicker: 'Profiles', note: 'People and brands presented with trust cues and quick contact paths.' },
}

export function getTaskTheme(task: TaskKey): TaskTheme {
  return taskThemes[task] || taskThemes.article
}

/** All `--tk-*` tokens + font overrides for a task surface, ready for `style`. */
export function taskThemeStyle(task: TaskKey): CSSProperties {
  const t = getTaskTheme(task)
  return {
    '--tk-bg': t.bg,
    '--tk-surface': t.surface,
    '--tk-raised': t.raised,
    '--tk-text': t.text,
    '--tk-muted': t.muted,
    '--tk-line': t.line,
    '--tk-accent': t.accent,
    '--tk-accent-soft': t.accentSoft,
    '--tk-on-accent': t.onAccent,
    '--tk-glow': t.glow,
    '--tk-radius': t.radius,
    // Re-point the shared article-body accent vars so post HTML (headings,
    // links) inherits this task's accent instead of the global site accent.
    '--slot4-accent': t.accent,
    '--slot4-accent-fill': t.accent,
    '--editable-font-display': t.fontDisplay,
    '--editable-font-body': t.fontBody,
    fontFamily: t.fontBody,
  } as CSSProperties
}
