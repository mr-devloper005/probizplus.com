import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Filter, MapPin, Search, Sparkles, Star } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { fetchSiteFeed } from '@/lib/site-connector'
import { getPostTaskKey } from '@/lib/task-data'
import { getMockPostsForTask } from '@/lib/mock-posts'
import { SITE_CONFIG, type TaskKey } from '@/lib/site-config'
import type { SitePost } from '@/lib/site-connector'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { pagesContent } from '@/editable/content/pages.content'
import { Ads } from '@/lib/ads'

export const revalidate = 3

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: '/search',
    title: pagesContent.search.metadata.title,
    description: pagesContent.search.metadata.description,
  })
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ')
const compactText = (value: unknown) => (typeof value === 'string' ? stripHtml(value).replace(/\s+/g, ' ').trim().toLowerCase() : '')
const compactRaw = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const getContent = (post: SitePost) => (post.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {})
const getImage = (post: SitePost) => {
  const content = getContent(post)
  const media = Array.isArray(post.media) ? post.media.find((item) => typeof item?.url === 'string')?.url : ''
  const images = Array.isArray(content.images) ? (content.images.find((item) => typeof item === 'string') as string | undefined) : ''
  return media || compactRaw(content.featuredImage) || compactRaw(content.image) || compactRaw(content.thumbnail) || images || '/placeholder.svg?height=900&width=1200'
}
const summaryOf = (post: SitePost) => post.summary || compactRaw(getContent(post).description) || compactRaw(getContent(post).excerpt) || ''

const matches = (post: SitePost, query: string, category: string, task: string) => {
  const content = getContent(post)
  const typeText = compactText(content.type)
  if (typeText === 'comment') return false
  const derivedTask = getPostTaskKey(post) || typeText
  if (task && derivedTask !== task) return false
  const categoryText = compactText(content.category)
  const tagsText = compactText(Array.isArray(post.tags) ? post.tags.join(' ') : '')
  if (category && !(categoryText || tagsText).includes(category)) return false
  if (!query) return true
  return [post.title, post.summary, content.description, content.body, content.excerpt, content.category, Array.isArray(post.tags) ? post.tags.join(' ') : '']
    .some((value) => compactText(value).includes(query))
}

function hashStr(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

function ratingOf(post: SitePost) {
  return Math.round((3.8 + (hashStr(post.slug || post.id || post.title || 'x') % 12) / 10) * 10) / 10
}

function resultMeta(post: SitePost, index: number) {
  const seed = hashStr(`${post.slug || post.id || post.title || 'post'}:${index}`)
  return {
    views: 35 + (seed % 420),
    age: 1 + (seed % 7),
    location:
      compactRaw(getContent(post).location) ||
      compactRaw(getContent(post).address) ||
      compactRaw(getContent(post).city) ||
      'Popular area',
  }
}

function SearchResultCard({ post, index }: { post: SitePost; index: number }) {
  const task = getPostTaskKey(post) as TaskKey | null
  const taskRoute = SITE_CONFIG.tasks.find((item) => item.key === task)?.route
  const href = `${taskRoute || `/${task || 'article'}`}/${post.slug}`
  const image = getImage(post)
  const summary = summaryOf(post)
  const taskLabel = SITE_CONFIG.tasks.find((item) => item.key === task)?.label || 'Post'
  const strong = index % 5 === 0
  const meta = resultMeta(post, index)
  const rating = ratingOf(post)

  return (
    <Link
      href={href}
      className={`group block overflow-hidden rounded-[1.4rem] border border-[var(--editable-border)] bg-white shadow-[0_18px_38px_rgba(18,13,55,0.06)] transition hover:-translate-y-1.5 ${strong ? 'md:col-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden bg-[var(--slot4-media-bg)] ${strong ? 'aspect-[16/7]' : 'aspect-[4/3]'}`}>
        <img src={image} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,55,0.06)_0%,rgba(18,13,55,0.76)_100%)]" />
        <span className="absolute right-4 top-4 rounded-md bg-[#781ad0] px-3 py-1 text-xs font-bold text-white">
          {strong ? 'Featured' : taskLabel}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1455cc]">
          <span>{taskLabel}</span>
          <span>/</span>
          <span>{meta.location}</span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-[1.8rem] font-bold leading-[1.08] tracking-[-0.05em] text-[var(--editable-page-text)] group-hover:text-[var(--slot4-accent)]">
          {post.title}
        </h2>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-[3px]">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} className={`h-4 w-4 ${star < Math.round(rating) ? 'fill-[#f7ad45] text-[#f7ad45]' : 'fill-[#e2eadf] text-[#e2eadf]'}`} />
            ))}
          </span>
          <span className="font-semibold text-[var(--editable-page-text)]">{rating.toFixed(1)}</span>
          <span className="text-[var(--slot4-muted-text)]">{meta.views} views</span>
        </div>
        {summary ? <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--slot4-muted-text)]">{summary}</p> : null}
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--slot4-accent)]">
          Open result <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string; category?: string; task?: string; master?: string }> }) {
  const resolved = (await searchParams) || {}
  const query = (resolved.q || '').trim()
  const normalized = query.toLowerCase()
  const category = (resolved.category || '').trim().toLowerCase()
  const task = (resolved.task || '').trim().toLowerCase()
  const useMaster = resolved.master !== '0'
  const feed = await fetchSiteFeed(useMaster ? 1000 : 300, useMaster ? { fresh: true, category: category || undefined, task: task || undefined } : undefined)
  const posts = feed?.posts?.length ? feed.posts : useMaster ? [] : SITE_CONFIG.tasks.filter((item) => item.enabled).flatMap((item) => getMockPostsForTask(item.key))
  const results = posts.filter((post) => matches(post, normalized, category, task)).slice(0, normalized ? 80 : 36)
  const enabledTasks = SITE_CONFIG.tasks.filter((item) => item.enabled)

  return (
    <EditableSiteShell>
      <main className="min-h-screen bg-[var(--editable-page-bg)] text-[var(--editable-page-text)]">
        <section className="border-b border-[var(--editable-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fff8ef_100%)]">
          <div className="mx-auto max-w-[var(--editable-container)] px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1455cc]">
              <span>{pagesContent.search.hero.badge}</span>
              <span className="h-1 w-1 rounded-full bg-[#1455cc]" />
              <span className="text-[var(--slot4-muted-text)]">Search</span>
            </div>
            <div className="mt-5 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <h1 className="editable-display max-w-4xl text-balance text-[2.9rem] font-bold leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-[4.1rem]">
                  Find the right post, listing, or profile with the same clean discovery flow as home.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--slot4-muted-text)]">
                  Search across active sections, narrow by category or type, and move through richer result cards without losing the home page feel.
                </p>
              </div>
              <form action="/search" className="rounded-[1.6rem] border border-[var(--editable-border)] bg-white p-4 shadow-[0_18px_38px_rgba(18,13,55,0.06)] sm:p-5">
                <input type="hidden" name="master" value="1" />
                <label className="flex h-[52px] items-center gap-3 rounded-xl bg-[#f8fafc] px-4 shadow-[inset_0_0_0_1px_rgba(18,13,55,0.05)]">
                  <Search className="h-5 w-5 text-[#1455cc]" />
                  <input name="q" defaultValue={query} placeholder={pagesContent.search.hero.placeholder} className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-[#7b849f]" />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex h-12 items-center gap-3 rounded-xl bg-[#f8fafc] px-4 shadow-[inset_0_0_0_1px_rgba(18,13,55,0.05)]">
                    <Filter className="h-4 w-4 text-[#1455cc]" />
                    <input name="category" defaultValue={category} placeholder="Category" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#7b849f]" />
                  </label>
                  <select name="task" defaultValue={task} className="h-12 rounded-xl bg-[#f8fafc] px-4 text-sm font-semibold outline-none shadow-[inset_0_0_0_1px_rgba(18,13,55,0.05)]">
                    <option value="">All content types</option>
                    {enabledTasks.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                </div>
                <button className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#1455cc] px-6 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:brightness-110" type="submit">
                  Search now
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[var(--editable-container)] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr]">
            <div className="rounded-[1.6rem] border border-[var(--editable-border)] bg-white p-6 shadow-[0_18px_38px_rgba(18,13,55,0.05)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf4ed] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--slot4-accent)]">
                <Sparkles className="h-3.5 w-3.5" /> Search snapshot
              </div>
              <h2 className="mt-5 text-[2.2rem] font-bold leading-[1.08] tracking-[-0.05em] text-[var(--editable-page-text)]">
                {query ? `Results for "${query}"` : pagesContent.search.resultsTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--slot4-muted-text)]">
                {results.length} matching result{results.length === 1 ? '' : 's'} across listings, profiles, articles, and more.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-between rounded-xl bg-[#fff8ef] px-4 py-3 text-sm">
                  <span className="font-semibold text-[var(--slot4-muted-text)]">Category filter</span>
                  <span className="font-bold text-[var(--editable-page-text)]">{category || 'All categories'}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#fff8ef] px-4 py-3 text-sm">
                  <span className="font-semibold text-[var(--slot4-muted-text)]">Content type</span>
                  <span className="font-bold text-[var(--editable-page-text)]">{task || 'All content types'}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#fff8ef] px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-2 font-semibold text-[var(--slot4-muted-text)]"><MapPin className="h-4 w-4 text-[var(--slot4-accent)]" /> Discovery mode</span>
                  <span className="font-bold text-[var(--editable-page-text)]">{useMaster ? 'Live feed' : 'Archive feed'}</span>
                </div>
              </div>
              <Link href="/article" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--editable-border)] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--editable-page-text)] transition hover:border-[var(--slot4-accent)] hover:text-[var(--slot4-accent)]">
                Browse latest <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {results.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {results.map((post, index) => <SearchResultCard key={post.id || post.slug} post={post} index={index} />)}
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-[var(--editable-border)] bg-white p-10 text-center shadow-[0_18px_38px_rgba(18,13,55,0.05)]">
                <p className="text-[2rem] font-bold tracking-[-0.05em]">No matching posts found.</p>
                <p className="mt-3 text-sm leading-7 text-[var(--slot4-muted-text)]">Try a different keyword, task type, or category to open up more results.</p>
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-6">
          <Ads slot="footer" showLabel eager className="mx-auto w-full" />
        </div>
      </main>
    </EditableSiteShell>
  )
}
