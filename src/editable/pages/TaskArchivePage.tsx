import Link from 'next/link'
import {
  ArrowUpRight, BriefcaseBusiness, ChevronDown, FileText, Globe, MapPin, Phone, Search, Star, UserRound,
} from 'lucide-react'
import { buildTaskMetadata } from '@/lib/seo'
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/categories'
import { fetchPaginatedTaskPosts, buildPostUrl } from '@/lib/task-data'
import { getTaskConfig, type TaskKey } from '@/lib/site-config'
import type { SiteFeedPagination, SitePost } from '@/lib/site-connector'
import { taskPageMetadata } from '@/config/site.content'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { getTaskTheme, taskThemeStyle } from '@/editable/theme/task-themes'
import { Ads } from '@/lib/ads'

export const revalidate = 3

export const taskMetadata = (task: TaskKey, path: string) =>
  buildTaskMetadata(task, {
    path,
    title: taskPageMetadata[task]?.title,
    description: taskPageMetadata[task]?.description,
  })

const getContent = (post: SitePost) => (post.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {})
const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const isUrl = (value: string) => value.startsWith('/') || /^https?:\/\//i.test(value)

const getImages = (post: SitePost) => {
  const content = getContent(post)
  const media = Array.isArray(post.media) ? post.media.map((item) => item?.url).filter((url): url is string => typeof url === 'string' && isUrl(url)) : []
  const images = Array.isArray(content.images) ? content.images.filter((url): url is string => typeof url === 'string' && isUrl(url)) : []
  const singles = ['image', 'featuredImage', 'thumbnail', 'logo', 'avatar'].map((key) => asText(content[key])).filter((url) => url && isUrl(url))
  return [...media, ...images, ...singles].filter(Boolean).slice(0, 8)
}

const getImage = (post: SitePost) => getImages(post)[0] || '/placeholder.svg?height=900&width=1200'
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const getSummary = (post: SitePost) => stripHtml(post.summary || asText(getContent(post).description) || asText(getContent(post).excerpt) || asText(getContent(post).body))
const getField = (post: SitePost, keys: string[]) => {
  const content = getContent(post)
  for (const key of keys) {
    const value = asText(content[key])
    if (value) return value
  }
  return ''
}
const getCategory = (post: SitePost, fallback: string) => asText(getContent(post).category) || post.tags?.[0] || fallback
const cleanDomain = (value: string) => value.replace(/^https?:\/\//, '').replace(/\/$/, '')

function pageHref(basePath: string, category: string, page: number) {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

function hashStr(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

function ratingOf(post: SitePost) {
  const real = Number(getContent(post).rating)
  if (real >= 1 && real <= 5) return Math.round(real * 10) / 10
  return Math.round((3.8 + (hashStr(post.slug || post.id || post.title || 'x') % 12) / 10) * 10) / 10
}

function reviewsOf(post: SitePost) {
  const real = Number(getContent(post).reviewCount ?? getContent(post).reviews)
  if (real > 0) return Math.floor(real)
  return 20 + (hashStr(`${post.slug || post.title || 'x'}:r`) % 420)
}

function metricSeed(post: SitePost, offset = 0) {
  const seed = hashStr(`${post.slug || post.id || post.title || 'post'}:${offset}`)
  return {
    age: 1 + (seed % 7),
    views: 22 + (seed % 360),
  }
}

function RatingLine({ post }: { post: SitePost }) {
  const rating = ratingOf(post)
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="inline-flex items-center gap-[3px]">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-[#f7ad45] text-[#f7ad45]' : 'fill-[#e2eadf] text-[#e2eadf]'}`}
          />
        ))}
      </span>
      <span className="text-sm font-semibold text-[var(--tk-text)]">{rating.toFixed(1)}</span>
      <span className="text-sm text-[var(--tk-muted)]">({reviewsOf(post)})</span>
    </div>
  )
}

function ArchiveAd({ task }: { task: TaskKey }) {
  const slotByTask: Partial<Record<TaskKey, 'header' | 'sidebar' | 'in-feed' | 'article-bottom' | 'footer'>> = {
    article: 'header',
    listing: 'in-feed',
    profile: 'sidebar',
  }
  const slot = slotByTask[task]
  if (!slot) return null
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Ads slot={slot} showLabel eager className="mx-auto w-full" />
    </div>
  )
}

export async function EditableTaskArchiveRoute({
  task,
  searchParams,
  basePath,
}: {
  task: TaskKey
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath?: string
}) {
  const resolved = (await searchParams) || {}
  const page = Math.max(1, Math.floor(Number(resolved.page) || 1))
  const category = resolved.category ? normalizeCategory(resolved.category) : 'all'
  const taskConfig = getTaskConfig(task)
  const { posts, pagination } = await fetchPaginatedTaskPosts(task, { page, limit: 24, category })
  return <TaskArchiveView task={task} posts={posts} pagination={pagination} category={category} basePath={basePath || taskConfig?.route || `/${task}`} />
}

export function TaskArchiveView({ task, posts, pagination, category, basePath }: { task: TaskKey; posts: SitePost[]; pagination: SiteFeedPagination; category: string; basePath: string }) {
  const taskConfig = getTaskConfig(task)
  const theme = getTaskTheme(task)
  const label = taskConfig?.label || task
  const page = pagination.page || 1
  const categoryLabel = category === 'all' ? 'All categories' : CATEGORY_OPTIONS.find((item) => item.slug === category)?.name || category
  const discoverLinks = posts.slice(0, 3)

  return (
    <EditableSiteShell>
      <main style={taskThemeStyle(task)} className="min-h-screen bg-[var(--tk-bg)] text-[var(--tk-text)]">
        <section className="border-b border-[var(--tk-line)] bg-[linear-gradient(180deg,#ffffff_0%,#fff8ef_100%)]">
          <div className="mx-auto max-w-[var(--editable-container)] px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1455cc]">
              <span>{theme.kicker}</span>
              <span className="h-1 w-1 rounded-full bg-[#1455cc]" />
              <span className="text-[var(--tk-muted)]">{label}</span>
            </div>
            <h1 className="editable-display mt-5 max-w-4xl text-balance text-[2.8rem] font-bold leading-[1.06] tracking-[-0.05em] sm:text-5xl lg:text-[4rem]">
              Browse our top {label.toLowerCase()} with a cleaner classifieds layout.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--tk-muted)]">
              Search local options, explore category-led ad cards, and move through listings faster without losing the editorial feel.
            </p>

            <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_140px]">
              <form action={basePath} className="flex h-12 items-center gap-3 rounded-xl bg-white px-4 shadow-[inset_0_0_0_1px_rgba(18,13,55,0.05)]">
                <Search className="h-4 w-4 text-[#1455cc]" />
                <input name="q" type="search" placeholder={`Search ${label.toLowerCase()}...`} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7b849f]" />
              </form>
              <div className="relative">
                <select
                  name="category"
                  defaultValue={category}
                  className="h-12 w-full appearance-none rounded-xl border border-[var(--tk-line)] bg-white pl-4 pr-10 text-sm font-medium text-[var(--tk-text)] outline-none"
                  aria-label="Filter category"
                >
                  <option value="all">All categories</option>
                  {CATEGORY_OPTIONS.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tk-muted)]" />
              </div>
              <button className="rounded-xl bg-[#1455cc] px-5 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:brightness-110">
                Search
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[var(--tk-muted)]">
              <span className="rounded-full bg-white px-4 py-2 shadow-[inset_0_0_0_1px_rgba(18,13,55,0.05)]">
                <strong className="text-[var(--tk-text)]">{posts.length}</strong> posts
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-[inset_0_0_0_1px_rgba(18,13,55,0.05)]">{categoryLabel}</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[var(--editable-container)] px-4 py-10 sm:px-6 lg:px-8">
          {discoverLinks.length ? (
            <div className="mx-auto max-w-5xl overflow-hidden rounded-[1rem] border border-[var(--tk-line)] bg-white shadow-[0_14px_30px_rgba(18,13,55,0.05)]">
              <div className="border-b border-[var(--tk-line)] bg-[#dce7f7] px-5 py-4 text-2xl font-bold tracking-[-0.03em]">Discover more</div>
              {discoverLinks.map((post, index) => (
                <Link
                  key={post.id || post.slug}
                  href={post.slug ? `${basePath}/${post.slug}` : buildPostUrl(task, post.slug)}
                  className={`flex items-center justify-between gap-4 px-5 py-5 text-xl transition hover:bg-[#f8fbff] ${index > 0 ? 'border-t border-[var(--tk-line)]' : ''}`}
                >
                  <span>{getCategory(post, label)}</span>
                  <ArrowUpRight className="h-5 w-5 text-[var(--tk-muted)]" />
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-10 grid overflow-hidden rounded-[1rem] border border-[var(--tk-line)] bg-white text-center shadow-[0_14px_30px_rgba(18,13,55,0.05)] sm:grid-cols-3">
            <div className="border-b-2 border-[#1455cc] px-4 py-5 text-sm font-semibold uppercase tracking-[0.12em] text-[#1455cc] sm:border-b-0 sm:border-r">Top ratings</div>
            <div className="border-t border-[var(--tk-line)] px-4 py-5 text-sm font-semibold uppercase tracking-[0.12em] sm:border-r sm:border-t-0">Top advertiser</div>
            <div className="border-t border-[var(--tk-line)] px-4 py-5 text-sm font-semibold uppercase tracking-[0.12em] sm:border-t-0">Top engaged</div>
          </div>

          {posts.length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {posts.map((post, index) => (
                <ArchivePostCard key={post.id || post.slug} post={post} task={task} basePath={basePath} index={index} />
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-xl rounded-[1.25rem] border border-dashed border-[var(--tk-line)] bg-white px-8 py-16 text-center shadow-[0_10px_26px_rgba(18,13,55,0.04)]">
              <Search className="mx-auto h-7 w-7 text-[var(--tk-muted)]" />
              <h2 className="editable-display mt-5 text-2xl font-bold tracking-[-0.03em]">Nothing here yet</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--tk-muted)]">Try another category, or check back after new posts are added.</p>
            </div>
          )}

          {posts.length ? (
            <nav className="mt-12 flex items-center justify-center gap-3 text-sm">
              {pagination.hasPrevPage ? <Link href={pageHref(basePath, category, page - 1)} className="rounded-xl border border-[var(--tk-line)] bg-white px-5 py-3 font-semibold transition hover:border-[var(--tk-accent)]">Previous</Link> : null}
              <span className="rounded-xl border border-[var(--tk-line)] bg-white px-5 py-3 font-semibold text-[var(--tk-muted)]">Page {page} of {pagination.totalPages || 1}</span>
              {pagination.hasNextPage ? <Link href={pageHref(basePath, category, page + 1)} className="rounded-xl border border-[var(--tk-line)] bg-white px-5 py-3 font-semibold transition hover:border-[var(--tk-accent)]">Next</Link> : null}
            </nav>
          ) : null}
        </section>
        <ArchiveAd task={task} />
      </main>
    </EditableSiteShell>
  )
}

function ArchivePostCard({ post, task, basePath, index }: { post: SitePost; task: TaskKey; basePath: string; index: number }) {
  const href = post.slug ? `${basePath}/${post.slug}` : buildPostUrl(task, post.slug)
  if (task === 'listing') return <ListingArchiveCard post={post} href={href} />
  if (task === 'classified') return <ClassifiedArchiveCard post={post} href={href} />
  if (task === 'image') return <ImageArchiveCard post={post} href={href} index={index} />
  if (task === 'sbm') return <BookmarkArchiveCard post={post} href={href} index={index} />
  if (task === 'pdf') return <PdfArchiveCard post={post} href={href} />
  if (task === 'profile') return <ProfileArchiveCard post={post} href={href} />
  return <ArticleArchiveCard post={post} href={href} index={index} />
}

function ArticleArchiveCard({ post, href, index }: { post: SitePost; href: string; index: number }) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-[1.15rem] border border-[var(--tk-line)] bg-white shadow-[0_16px_34px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--tk-raised)]">
        <img src={getImage(post)} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
        <span className="absolute right-4 top-4 rounded-md bg-[#781ad0] px-3 py-1 text-xs font-bold text-white">Featured</span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--tk-muted)]">
          <span>{getCategory(post, 'Article')}</span>
          <span>/</span>
          <span>No. {String(index + 1).padStart(2, '0')}</span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-[1.6rem] font-bold leading-[1.15] tracking-[-0.04em] text-[var(--tk-text)] group-hover:text-[var(--tk-accent)]">{post.title}</h2>
        <RatingLine post={post} />
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--tk-muted)]">{getSummary(post)}</p>
      </div>
    </Link>
  )
}

function ListingArchiveCard({ post, href }: { post: SitePost; href: string }) {
  const logo = getImages(post)[0]
  const location = getField(post, ['location', 'address', 'city'])
  const phone = getField(post, ['phone', 'telephone', 'mobile'])
  const website = getField(post, ['website', 'url'])
  const seed = metricSeed(post)
  return (
    <Link href={href} className="group flex flex-col rounded-[1.15rem] border border-[var(--tk-line)] bg-white p-5 shadow-[0_16px_34px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-[var(--tk-raised)]">
          {logo ? <img src={logo} alt={post.title} className="h-full w-full object-cover" /> : <BriefcaseBusiness className="h-8 w-8 text-[var(--tk-muted)]" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1455cc]">{getCategory(post, 'Listing')}</p>
          <h2 className="mt-2 line-clamp-2 text-2xl font-bold leading-tight tracking-[-0.03em] group-hover:text-[var(--tk-accent)]">{post.title}</h2>
        </div>
      </div>
      <RatingLine post={post} />
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--tk-muted)]">{getSummary(post)}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--tk-muted)]">
        {location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[var(--tk-accent)]" /> {location}</span> : null}
        {phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-[var(--tk-accent)]" /> {phone}</span> : null}
        {website ? <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-[var(--tk-accent)]" /> {cleanDomain(website)}</span> : null}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--tk-line)] pt-4 text-sm">
        <span className="text-[var(--tk-muted)]">{seed.views} views</span>
        <span className="font-bold text-[var(--tk-accent)]">View listing</span>
      </div>
    </Link>
  )
}

function ClassifiedArchiveCard({ post, href }: { post: SitePost; href: string }) {
  const location = getField(post, ['location', 'address', 'city']) || 'Featured area'
  const condition = getField(post, ['condition', 'availability', 'type']) || 'Booking'
  const price = getField(post, ['price', 'amount', 'budget']) || 'Open offer'
  const seed = metricSeed(post, 2)
  return (
    <Link href={href} className="group block overflow-hidden rounded-[1.15rem] border border-[var(--tk-line)] bg-white shadow-[0_16px_34px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--tk-raised)]">
        <img src={getImage(post)} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
        <span className="absolute right-4 top-4 rounded-md bg-[#781ad0] px-3 py-1 text-xs font-bold text-white">{condition}</span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--tk-muted)]">
          <span>{getCategory(post, 'Classified')}</span>
          <span>/</span>
          <span>{location}</span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-[1.7rem] font-bold leading-[1.1] tracking-[-0.05em] group-hover:text-[var(--tk-accent)]">{post.title}</h2>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--tk-muted)]">{getSummary(post)}</p>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--tk-line)] pt-4 text-sm">
          <span className="font-bold text-[var(--tk-accent)]">{price}</span>
          <span className="text-[var(--tk-muted)]">{seed.age} days ago</span>
        </div>
      </div>
    </Link>
  )
}

function ImageArchiveCard({ post, href, index }: { post: SitePost; href: string; index: number }) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-[1.15rem] border border-[var(--tk-line)] bg-white shadow-[0_16px_34px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className={`overflow-hidden bg-[var(--tk-raised)] ${index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
        <img src={getImage(post)} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1455cc]">{getCategory(post, 'Gallery')}</p>
        <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight tracking-[-0.03em] group-hover:text-[var(--tk-accent)]">{post.title}</h2>
      </div>
    </Link>
  )
}

function BookmarkArchiveCard({ post, href, index }: { post: SitePost; href: string; index: number }) {
  const website = getField(post, ['website', 'url', 'link'])
  return (
    <Link href={href} className="group flex rounded-[1.15rem] border border-[var(--tk-line)] bg-white p-5 shadow-[0_16px_34px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf4ed] text-[var(--tk-accent)]">
        <Globe className="h-5 w-5" />
      </div>
      <div className="ml-4 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1455cc]">Saved / {String(index + 1).padStart(2, '0')}</p>
        <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight tracking-[-0.03em] group-hover:text-[var(--tk-accent)]">{post.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--tk-muted)]">{getSummary(post)}</p>
        {website ? <p className="mt-3 truncate text-xs font-semibold text-[var(--tk-accent)]">{cleanDomain(website)}</p> : null}
      </div>
    </Link>
  )
}

function PdfArchiveCard({ post, href }: { post: SitePost; href: string }) {
  return (
    <Link href={href} className="group flex flex-col rounded-[1.15rem] border border-[var(--tk-line)] bg-white p-5 shadow-[0_16px_34px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#edf4ed] text-[var(--tk-accent)]">
        <FileText className="h-6 w-6" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#1455cc]">{getCategory(post, 'Document')}</p>
      <h2 className="mt-2 line-clamp-2 text-2xl font-bold leading-tight tracking-[-0.03em] group-hover:text-[var(--tk-accent)]">{post.title}</h2>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--tk-muted)]">{getSummary(post)}</p>
      <span className="mt-4 font-bold text-[var(--tk-accent)]">Open document</span>
    </Link>
  )
}

function ProfileArchiveCard({ post, href }: { post: SitePost; href: string }) {
  const image = getImages(post)[0]
  const role = getField(post, ['role', 'designation', 'company', 'location'])
  return (
    <Link href={href} className="group flex flex-col items-center rounded-[1.15rem] border border-[var(--tk-line)] bg-white p-6 text-center shadow-[0_16px_34px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[var(--tk-raised)]">
        {image ? <img src={image} alt={post.title} className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10 text-[var(--tk-muted)]" />}
      </div>
      <h2 className="mt-4 line-clamp-2 text-2xl font-bold leading-tight tracking-[-0.03em] group-hover:text-[var(--tk-accent)]">{post.title}</h2>
      {role ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1455cc]">{role}</p> : null}
      <RatingLine post={post} />
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--tk-muted)]">{getSummary(post)}</p>
    </Link>
  )
}
