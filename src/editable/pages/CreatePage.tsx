'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileText, ImageIcon, Lock, PlusCircle, Search, Send, Sparkles } from 'lucide-react'
import { SITE_CONFIG, type TaskKey } from '@/lib/site-config'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { useEditableLocalAuthSession } from '@/editable/components/EditableLocalAuthForms'
import { pagesContent } from '@/editable/content/pages.content'

type DraftPost = {
  id: string
  task: TaskKey
  title: string
  category: string
  summary: string
  url: string
  image: string
  body: string
  createdAt: string
}

const STORE_KEY = 'slot4:created-posts'
const hiddenTaskKeys = new Set<TaskKey>(['listing', 'classified'])

const taskIcon: Record<string, typeof FileText> = {
  article: FileText,
  listing: Sparkles,
  classified: PlusCircle,
  image: ImageIcon,
  profile: Sparkles,
  pdf: FileText,
  sbm: ArrowRight,
}

const fieldClass = 'w-full rounded-xl border border-[var(--editable-border)] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[var(--editable-page-text)] outline-none transition placeholder:text-[#7b849f] focus:border-[var(--slot4-accent)] focus:bg-white'

const saveDraft = (draft: DraftPost) => {
  try {
    const existing = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]')
    const list = Array.isArray(existing) ? existing : []
    window.localStorage.setItem(STORE_KEY, JSON.stringify([draft, ...list].slice(0, 50)))
  } catch {
    window.localStorage.setItem(STORE_KEY, JSON.stringify([draft]))
  }
}

const publishingPoints = [
  'Pick a format first, then move straight into the details.',
  'Keep the same cleaner rhythm used by the homepage and search views.',
  'Save a polished local draft and return later without friction.',
]

export default function CreatePage() {
  const { session } = useEditableLocalAuthSession()
  const enabledTasks = useMemo(() => SITE_CONFIG.tasks.filter((task) => task.enabled && !hiddenTaskKeys.has(task.key)), [])
  const [task, setTask] = useState<TaskKey>((enabledTasks[0]?.key || 'article') as TaskKey)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [summary, setSummary] = useState('')
  const [url, setUrl] = useState('')
  const [image, setImage] = useState('')
  const [body, setBody] = useState('')
  const [created, setCreated] = useState<DraftPost | null>(null)

  const activeTask = enabledTasks.find((item) => item.key === task) || enabledTasks[0]

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const draft: DraftPost = {
      id: `draft-${Date.now()}`,
      task,
      title: title.trim(),
      category: category.trim() || 'uncategorized',
      summary: summary.trim(),
      url: url.trim(),
      image: image.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
    }
    saveDraft(draft)
    setCreated(draft)
    setTitle('')
    setCategory('')
    setSummary('')
    setUrl('')
    setImage('')
    setBody('')
  }

  if (!session) {
    return (
      <EditableSiteShell>
        <main className="min-h-screen bg-[var(--editable-page-bg)] text-[var(--editable-page-text)]">
          <section className="border-b border-[var(--editable-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fff8ef_100%)]">
            <div className="mx-auto max-w-[var(--editable-container)] px-4 py-12 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1455cc]">
                <span>{pagesContent.create.locked.badge}</span>
                <span className="h-1 w-1 rounded-full bg-[#1455cc]" />
                <span className="text-[var(--slot4-muted-text)]">Protected workspace</span>
              </div>
              <div className="mt-5 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
                <div>
                  <h1 className="editable-display max-w-4xl text-balance text-[2.9rem] font-bold leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-[4.1rem]">
                    Sign in before opening the publishing workspace.
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--slot4-muted-text)]">
                    {pagesContent.create.locked.description}
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-[var(--editable-border)] bg-white p-5 shadow-[0_18px_38px_rgba(18,13,55,0.06)]">
                  <div className="grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[1.25rem] bg-[linear-gradient(135deg,#120d37_0%,#1f1a63_100%)] p-4 text-white">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                        <Lock className="h-3.5 w-3.5" /> Secure
                      </div>
                      <div className="mt-10 h-16 rounded-xl bg-white/10" />
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-[1rem] bg-[#f8fafc] p-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1455cc]">
                          <Sparkles className="h-3.5 w-3.5" /> Access
                        </div>
                        <div className="mt-6 h-10 rounded-xl bg-white" />
                      </div>
                      <div className="rounded-[1rem] bg-[#f8fafc] p-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1455cc]">
                          <Search className="h-3.5 w-3.5" /> Ready
                        </div>
                        <div className="mt-6 h-10 rounded-xl bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[var(--editable-container)] px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-[1.8rem] border border-[var(--editable-border)] bg-white p-6 shadow-[0_22px_44px_rgba(18,13,55,0.08)] sm:p-8">
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[#1455cc] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:brightness-110">
                  Login <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl border border-[var(--editable-border)] bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--editable-page-text)] transition hover:border-[var(--slot4-accent)] hover:text-[var(--slot4-accent)]">
                  Sign up
                </Link>
              </div>
            </div>
          </section>
        </main>
      </EditableSiteShell>
    )
  }

  return (
    <EditableSiteShell>
      <main className="min-h-screen bg-[var(--editable-page-bg)] text-[var(--editable-page-text)]">
        <section className="mx-auto max-w-[var(--editable-container)] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-[1.6rem] border border-[var(--editable-border)] bg-white p-6 shadow-[0_18px_38px_rgba(18,13,55,0.05)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f7ad45]/18 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--slot4-accent)]">
                <Sparkles className="h-3.5 w-3.5" /> Choose format
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {enabledTasks.map((item) => {
                  const Icon = taskIcon[item.key] || FileText
                  const active = item.key === task
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTask(item.key)}
                      className={`rounded-[1.2rem] border p-4 text-left transition ${active ? 'border-[#1455cc] bg-[linear-gradient(135deg,#120d37_0%,#1f1a63_100%)] text-white shadow-[0_18px_38px_rgba(18,13,55,0.16)]' : 'border-[var(--editable-border)] bg-[#fff8ef] hover:-translate-y-0.5 hover:border-[var(--slot4-accent)]'}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="mt-3 block text-sm font-bold uppercase tracking-[0.08em]">{item.label}</span>
                      <span className={`mt-1 block text-xs leading-6 ${active ? 'text-white/76' : 'text-[var(--slot4-muted-text)]'}`}>{item.description}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 grid gap-3">
                {publishingPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-xl bg-[#f8fafc] px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--slot4-accent)]" />
                    <p className="text-sm leading-7 text-[var(--slot4-muted-text)]">{point}</p>
                  </div>
                ))}
              </div>
            </aside>

            <form onSubmit={submit} className="rounded-[1.8rem] border border-[var(--editable-border)] bg-white p-6 shadow-[0_22px_44px_rgba(18,13,55,0.08)] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1455cc]">Create {activeTask?.label || 'post'}</p>
                  <h2 className="mt-2 text-[2.4rem] font-bold tracking-[-0.05em] text-[var(--editable-page-text)]">
                    {pagesContent.create.formTitle}
                  </h2>
                </div>
                <span className="rounded-full bg-[#edf4ed] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--slot4-accent)]">
                  {session.name}
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                <input className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" />
                  <input className={fieldClass} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Website or source URL" />
                </div>
                <input className={fieldClass} value={image} onChange={(event) => setImage(event.target.value)} placeholder="Featured image URL" />
                <textarea className={`${fieldClass} min-h-24`} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Short summary" required />
                <textarea className={`${fieldClass} min-h-52`} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Main content, details, notes, or description" required />
              </div>

              {created ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <p className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-5 w-5" /> {pagesContent.create.successTitle}</p>
                  <p className="mt-1 text-sm font-semibold opacity-80">{created.title}</p>
                </div>
              ) : null}

              <button type="submit" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1455cc] px-6 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:brightness-110">
                <Send className="h-4 w-4" /> {pagesContent.create.submitLabel}
              </button>
            </form>
          </div>
        </section>
      </main>
    </EditableSiteShell>
  )
}
