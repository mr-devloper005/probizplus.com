import Link from 'next/link'
import {
  ArrowRight, Building2, Camera, ChevronRight, FileText, Globe, Image as ImageIcon,
  MapPin, Megaphone, Search, Sparkles, Star, UserRound,
} from 'lucide-react'
import type { SitePost } from '@/lib/site-connector'
import type { HomeTimeSection } from '@/lib/task-data'
import type { TaskKey } from '@/lib/site-config'
import { SITE_CONFIG } from '@/lib/site-config'
import { getEditableCategory, getEditableExcerpt, getEditablePostImage, postHref } from '@/editable/cards/PostCards'

type HomeSectionProps = {
  primaryTask: TaskKey
  primaryRoute: string
  posts: SitePost[]
  timeSections: HomeTimeSection[]
}

const container = 'mx-auto w-full max-w-[var(--editable-container)] px-4 sm:px-6 lg:px-8'
const hiddenDirectTaskKeys = new Set(['listing', 'classified'])

const taskIcon: Record<TaskKey, typeof FileText> = {
  article: FileText,
  listing: Building2,
  classified: Megaphone,
  image: ImageIcon,
  sbm: Globe,
  pdf: FileText,
  profile: UserRound,
}

function dedupePosts(posts: SitePost[]) {
  const seen = new Set<string>()
  const output: SitePost[] = []
  for (const post of posts) {
    const key = post.slug || post.id || post.title
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(post)
  }
  return output
}

function hashStr(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

function metricSeed(post: SitePost, offset = 0) {
  const seed = hashStr(`${post.slug || post.id || post.title || 'post'}:${offset}`)
  return {
    ads: 120 + (seed % 9000),
    views: 18 + (seed % 400),
    age: 1 + (seed % 7),
  }
}

function postLocation(post: SitePost) {
  const content = post?.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {}
  return (
    (typeof content.location === 'string' && content.location) ||
    (typeof content.address === 'string' && content.address) ||
    (typeof content.city === 'string' && content.city) ||
    'Featured area'
  )
}

function postPrice(post: SitePost) {
  const content = post?.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {}
  return (
    (typeof content.price === 'string' && content.price) ||
    (typeof content.amount === 'string' && content.amount) ||
    (typeof content.budget === 'string' && content.budget) ||
    'Open offer'
  )
}

function latestPool(posts: SitePost[], timeSections: HomeTimeSection[]) {
  return dedupePosts([...posts, ...timeSections.flatMap((section) => section.posts)])
}

function heroTiles(posts: SitePost[]) {
  const images = posts.map((post) => getEditablePostImage(post)).filter(Boolean)
  if (images.length >= 8) return images.slice(0, 10)
  return [
    ...images,
    ...Array.from({ length: Math.max(0, 10 - images.length) }).map((_, index) => `/placeholder.svg?height=600&width=${900 + index}`),
  ]
}

function sectionPosts(posts: SitePost[], start: number, count: number) {
  return posts.slice(start, start + count)
}

function CategoryMiniCard({ task, post, route }: { task: { key: TaskKey; label: string; route: string }; post?: SitePost; route: string }) {
  const Icon = taskIcon[task.key] || FileText
  const seed = post ? metricSeed(post) : { ads: 120, views: 80, age: 2 }
  return (
    <Link
      href={route}
      className="group flex min-h-[136px] flex-col items-center justify-center rounded-[1.25rem] border border-[#d9e5f5] bg-[#ecf8fb] px-4 py-5 text-center shadow-[0_18px_38px_rgba(18,13,55,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#1455cc]"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f7ad45] text-white shadow-[0_12px_22px_rgba(247,173,69,0.35)]">
        <Icon className="h-6 w-6" />
      </span>
      <span className="mt-3 text-[1.05rem] font-semibold text-[#223129]">{task.label}</span>
      <span className="mt-1 text-sm text-[#1455cc]">({seed.ads}) ads</span>
    </Link>
  )
}

function FeaturedShowcaseCard({ post, href }: { post: SitePost; href: string }) {
  const image = getEditablePostImage(post)
  const price = postPrice(post)
  const meta = metricSeed(post, 2)
  return (
    <Link href={href} className="group block overflow-hidden rounded-[1.5rem] border border-[#dce6ef] bg-white shadow-[0_22px_50px_rgba(18,13,55,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--slot4-media-bg)]">
        <img src={image} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,55,0.04)_0%,rgba(18,13,55,0.78)_100%)]" />
        <span className="absolute left-4 top-4 rounded-r-full rounded-tl-md bg-[#15d4d0] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#120d37]">
          Featured
        </span>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <span className="inline-flex rounded-md bg-[#18b52f] px-3 py-1 text-xs font-semibold">Ad</span>
          <h3 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em]">{post.title}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
            <span>{price}</span>
            <span>{meta.age} days ago</span>
            <span>{postLocation(post)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function CompactThumb({ post, href, active = false }: { post: SitePost; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`overflow-hidden rounded-xl border bg-white transition hover:-translate-y-1 ${active ? 'border-[#1455cc] shadow-[0_12px_26px_rgba(20,85,204,0.18)]' : 'border-[#dde6e0]'}`}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img src={getEditablePostImage(post)} alt={post.title} className="h-full w-full object-cover" />
      </div>
    </Link>
  )
}

function HorizontalAdCard({ post, href }: { post: SitePost; href: string }) {
  const image = getEditablePostImage(post)
  const meta = metricSeed(post, 3)
  return (
    <Link href={href} className="group grid gap-4 rounded-[1.25rem] border border-[#dde6e0] bg-white p-4 shadow-[0_16px_32px_rgba(18,13,55,0.06)] transition hover:-translate-y-1 md:grid-cols-[120px_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-xl bg-[var(--slot4-media-bg)]">
        <img src={image} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--slot4-muted-text)]">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[var(--slot4-accent)]" /> {postLocation(post)}</span>
          <span>/</span>
          <span>{getEditableCategory(post)}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-tight tracking-[-0.03em] text-[var(--slot4-page-text)] group-hover:text-[var(--slot4-accent)]">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--slot4-muted-text)]">{getEditableExcerpt(post, 120)}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-[var(--slot4-accent)]">{postPrice(post)}</span>
          <span className="text-[var(--slot4-muted-text)]">{meta.views} views</span>
        </div>
      </div>
    </Link>
  )
}

function EditorialListCard({ post, href, index }: { post: SitePost; href: string; index: number }) {
  return (
    <Link href={href} className="group block border-b border-[#e6ece7] py-5 last:border-b-0">
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf4ed] text-sm font-bold text-[var(--slot4-accent)]">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1455cc]">{getEditableCategory(post)}</p>
          <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-tight tracking-[-0.03em] text-[var(--slot4-page-text)] group-hover:text-[var(--slot4-accent)]">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--slot4-muted-text)]">{getEditableExcerpt(post, 115)}</p>
        </div>
      </div>
    </Link>
  )
}

function ImageFirstCard({ post, href }: { post: SitePost; href: string }) {
  const meta = metricSeed(post, 4)
  return (
    <Link href={href} className="group block overflow-hidden rounded-[1.15rem] border border-[#dde6e0] bg-white shadow-[0_16px_32px_rgba(18,13,55,0.06)] transition hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--slot4-media-bg)]">
        <img src={getEditablePostImage(post)} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
        <span className="absolute right-4 top-4 rounded-md bg-[#781ad0] px-3 py-1 text-xs font-bold text-white">Booking</span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--slot4-muted-text)]">
          <span>{getEditableCategory(post)}</span>
          <span>/</span>
          <span>{postLocation(post)}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-[1.7rem] font-bold leading-[1.1] tracking-[-0.05em] text-[var(--slot4-page-text)] group-hover:text-[var(--slot4-accent)]">
          {post.title}
        </h3>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-bold text-[var(--slot4-accent)]">{postPrice(post)}</span>
          <span className="text-[var(--slot4-muted-text)]">{meta.age} days ago</span>
        </div>
      </div>
    </Link>
  )
}

function CityCard({ post, href }: { post: SitePost; href: string }) {
  const meta = metricSeed(post, 5)
  return (
    <Link href={href} className="group relative block overflow-hidden rounded-[1.25rem]">
      <div className="aspect-[16/10] overflow-hidden bg-[var(--slot4-media-bg)]">
        <img src={getEditablePostImage(post)} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,55,0.08)_12%,rgba(18,13,55,0.84)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-[1.65rem] font-bold tracking-[-0.04em]">{postLocation(post)}</h3>
        <p className="mt-1 text-sm text-white/82">({meta.ads}) ads</p>
      </div>
    </Link>
  )
}

function RatingTabs() {
  return (
    <div className="mt-8 grid overflow-hidden rounded-[1rem] border border-[#d9e6da] bg-white shadow-[0_10px_26px_rgba(18,13,55,0.04)] sm:grid-cols-3">
      <button className="border-b-2 border-[#1455cc] px-4 py-5 text-sm font-semibold uppercase tracking-[0.12em] text-[#1455cc] sm:border-b-0 sm:border-r sm:border-[#e5ece6]">Top ratings</button>
      <button className="border-t border-[#e5ece6] px-4 py-5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--slot4-page-text)] sm:border-t-0 sm:border-r">Top advertiser</button>
      <button className="border-t border-[#e5ece6] px-4 py-5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--slot4-page-text)] sm:border-t-0">Top engaged</button>
    </div>
  )
}

export function EditableHomeHero({ primaryTask, primaryRoute, posts, timeSections }: HomeSectionProps) {
  const pool = latestPool(posts, timeSections)
  const tiles = heroTiles(pool)
  const visibleTasks = SITE_CONFIG.tasks.filter((task) => task.enabled && !hiddenDirectTaskKeys.has(task.key))
  const browseTask = visibleTasks[0] || SITE_CONFIG.tasks.find((task) => task.enabled) || null
  const browseRoute = browseTask?.route || primaryRoute
  const browseLabel = browseTask?.label || primaryTask
  const categoryCards = visibleTasks.slice(0, 8)

  return (
    <section className="bg-white">
      <div className="relative overflow-hidden border-y border-[#dce8ef] bg-[#143b8f]">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {tiles.map((image, index) => (
            <div key={`${image}-${index}`} className="relative h-[170px] overflow-hidden md:h-[190px] lg:h-[205px]">
              <img src={image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[rgba(18,32,94,0.45)]" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,55,0.1)_0%,rgba(18,13,55,0.42)_100%)]" />
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-center text-white ${container}`}>
          <h1 className="max-w-4xl text-balance text-4xl font-bold leading-[1.1] tracking-[-0.05em] sm:text-5xl lg:text-[3.7rem]">
            Find, list, and promote what matters in one place.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/90 sm:text-xl">
            Search trusted local services, helpful resources, and standout community updates with a cleaner magazine-like browsing experience.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href={browseRoute} className="rounded-xl bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#1455cc] transition hover:-translate-y-0.5">
              Browse {browseLabel}
            </Link>
            <Link href="/create" className="rounded-xl border border-white/70 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/12">
              Post your ad
            </Link>
          </div>
        </div>
      </div>
      <div className={`relative z-10 -mt-10 grid gap-4 pb-8 sm:grid-cols-3 lg:grid-cols-8 ${container}`}>
        {categoryCards.map((task, index) => (
          <CategoryMiniCard key={task.key} task={task} post={pool[index]} route={task.route} />
        ))}
      </div>
    </section>
  )
}

export function EditableStoryRail({ primaryTask, primaryRoute, posts, timeSections }: HomeSectionProps) {
  const pool = latestPool(posts, timeSections)
  const featured = pool[0]
  const mini = sectionPosts(pool, 1, 5)
  const browseTask = SITE_CONFIG.tasks.find((task) => task.enabled && !hiddenDirectTaskKeys.has(task.key))
  const safeBrowseRoute = browseTask?.route || primaryRoute
  if (!featured) return null

  return (
    <section className="bg-white">
      <div className={`grid gap-10 py-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start ${container}`}>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1455cc]">Featured ads</p>
          <h2 className="mt-4 text-[2.6rem] font-bold leading-[1.08] tracking-[-0.05em] text-[var(--slot4-page-text)]">
            Find your next standout post with a cleaner search-first view.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--slot4-muted-text)]">
            Keep featured posts visible for longer, guide visitors into helpful categories faster, and turn discovery into direct action through clear cards and local details.
          </p>
          <Link href={safeBrowseRoute} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#1455cc] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:brightness-110">
            View all featured
          </Link>
        </div>
        <div>
          <FeaturedShowcaseCard post={featured} href={postHref(primaryTask, featured, primaryRoute)} />
          <div className="mt-5 grid grid-cols-5 gap-3">
            {mini.map((post, index) => (
              <CompactThumb key={post.id || post.slug} post={post} href={postHref(primaryTask, post, primaryRoute)} active={index === 2} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function EditableMagazineSplit({ primaryTask, primaryRoute, posts, timeSections }: HomeSectionProps) {
  const pool = latestPool(posts, timeSections)
  const discover = sectionPosts(pool, 2, 3)
  const grid = sectionPosts(pool, 5, 8)
  const browseTask = SITE_CONFIG.tasks.find((task) => task.enabled && !hiddenDirectTaskKeys.has(task.key))
  const safeBrowseRoute = browseTask?.route || primaryRoute
  if (!pool.length) return null

  return (
    <section className="bg-white">
      <div className={`py-8 sm:py-10 ${container}`}>
        <div className="text-center">
          <h2 className="text-[2.9rem] font-bold tracking-[-0.05em] text-[var(--slot4-page-text)]">Popular Trending Ads</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[var(--slot4-muted-text)]">
            Find related posts according to categories, city, and practical local intent.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-[1rem] border border-[#d9e6da] bg-white">
          <div className="border-b border-[#d9e6da] bg-[#dce7f7] px-5 py-4 text-2xl font-bold tracking-[-0.03em] text-[var(--slot4-page-text)]">
            Discover more
          </div>
          {discover.map((post, index) => (
            <Link
              key={post.id || post.slug}
              href={postHref(primaryTask, post, primaryRoute)}
              className={`flex items-center justify-between gap-4 px-5 py-5 text-xl text-[var(--slot4-page-text)] transition hover:bg-[#f7fbff] ${index > 0 ? 'border-t border-[#e9efea]' : ''}`}
            >
              <span>{getEditableCategory(post) || post.title}</span>
              <ChevronRight className="h-6 w-6 text-[var(--slot4-muted-text)]" />
            </Link>
          ))}
        </div>

        <RatingTabs />

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {grid.map((post, index) => {
            const href = postHref(primaryTask, post, primaryRoute)
            if (index % 4 === 0) return <ImageFirstCard key={post.id || post.slug} post={post} href={href} />
            if (index % 4 === 1) return <HorizontalAdCard key={post.id || post.slug} post={post} href={href} />
            if (index % 4 === 2) return <ImageFirstCard key={post.id || post.slug} post={post} href={href} />
            return <ImageFirstCard key={post.id || post.slug} post={post} href={href} />
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href={safeBrowseRoute} className="inline-flex items-center gap-2 rounded-xl bg-[#1455cc] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:brightness-110">
            View all ads
          </Link>
        </div>
      </div>
    </section>
  )
}

export function EditableTimeCollections({ primaryTask, primaryRoute, posts, timeSections }: HomeSectionProps) {
  const pool = latestPool(posts, timeSections)
  const editorial = sectionPosts(pool, 0, 4)
  const horizontal = sectionPosts(pool, 4, 3)
  const cities = sectionPosts(pool, 7, 6)

  return (
    <>
      <section className="bg-white">
        <div className={`grid gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr] ${container}`}>
          <div className="rounded-[1.5rem] border border-[#dde6e0] bg-[#fff8ef] p-6 shadow-[0_14px_28px_rgba(18,13,55,0.05)]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f7ad45]/18 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--slot4-accent)]">
              <Sparkles className="h-3.5 w-3.5" /> Fresh picks
            </div>
            <h2 className="mt-5 text-[2.4rem] font-bold leading-[1.08] tracking-[-0.05em] text-[var(--slot4-page-text)]">
              Browse our newest highlights with a more editorial rhythm.
            </h2>
            <div className="mt-5">
              {editorial.map((post, index) => (
                <EditorialListCard key={post.id || post.slug} post={post} href={postHref(primaryTask, post, primaryRoute)} index={index} />
              ))}
            </div>
          </div>
          <div className="space-y-5">
            {horizontal.map((post) => (
              <HorizontalAdCard key={post.id || post.slug} post={post} href={postHref(primaryTask, post, primaryRoute)} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className={`py-8 sm:py-10 ${container}`}>
          <div className="text-center">
            <h2 className="text-[2.8rem] font-bold tracking-[-0.05em] text-[var(--slot4-page-text)]">Top Cities by Ads</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[var(--slot4-muted-text)]">
              Explore neighborhoods and metro hubs where local interest and community activity stay active.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cities.map((post) => (
              <CityCard key={post.id || post.slug} post={post} href={postHref(primaryTask, post, primaryRoute)} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export function EditableHomeCta() {
  return (
    <section className="bg-[linear-gradient(135deg,#120d37_0%,#1f1a63_100%)]">
      <div className={`flex flex-col items-center gap-5 py-16 text-center text-white ${container}`}>
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
          Business-ready publishing
        </span>
        <h2 className="max-w-3xl text-[2.8rem] font-bold leading-[1.08] tracking-[-0.05em]">
          Put your business in front of people already searching nearby.
        </h2>
        <p className="max-w-2xl text-lg leading-8 text-white/78">
          Publish a polished post, promote an offer, or build a stronger local footprint with a page designed for fast browsing and clear contact actions.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/create" className="rounded-xl bg-[#1455cc] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:brightness-110">
            Post your ad
          </Link>
          <Link href="/contact" className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/10">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  )
}
