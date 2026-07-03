'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, Menu, PlusCircle, Search, UserPlus, X } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { globalContent } from '@/editable/content/global.content'
import { useEditableLocalAuthSession } from '@/editable/components/EditableLocalAuthForms'

const hiddenDirectTaskKeys = new Set(['listing', 'classified'])

export function EditableNavbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { session, logout } = useEditableLocalAuthSession()
  const navItems = useMemo(
    () =>
      SITE_CONFIG.tasks
        .filter((task) => task.enabled && !hiddenDirectTaskKeys.has(task.key))
        .map((task) => ({ label: task.label, href: task.route })),
    []
  )

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--editable-nav-bg)]/95 text-[var(--editable-nav-text)] shadow-[0_14px_34px_rgba(6,8,25,0.22)] backdrop-blur-md">
      <nav className="mx-auto flex min-h-[84px] w-full max-w-[var(--editable-container)] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#41c555] bg-white/95 transition group-hover:scale-105">
            <img src="/favicon.png?v=20260413" alt={SITE_CONFIG.name} className="h-8 w-8 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="editable-display block truncate text-[2rem] font-bold leading-none tracking-[-0.06em] text-[#41c555] sm:text-[2.3rem]">
              {SITE_CONFIG.name}
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 lg:block">
              {globalContent.nav?.tagline || SITE_CONFIG.tagline}
            </span>
          </span>
        </Link>

        <form action="/search" className="ml-auto hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-xl bg-[var(--editable-search-bg)] px-4 text-[var(--slot4-page-text)] shadow-[inset_0_0_0_1px_rgba(18,13,55,0.04)]">
            <Search className="h-4 w-4 shrink-0 text-[#1455cc]" />
            <input
              name="q"
              type="search"
              placeholder="Search, whatever you need..."
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#6c7693]"
            />
          </label>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {session ? (
            <>
              <Link
                href="/create"
                className="hidden items-center gap-2 rounded-xl border border-white/80 bg-[var(--editable-cta-bg)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--editable-cta-text)] transition hover:-translate-y-0.5 hover:brightness-110 sm:inline-flex"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Post your ad
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hidden items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:text-white sm:inline-flex"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:text-white sm:inline-flex"
              >
                <LogIn className="h-3.5 w-3.5" /> Login
              </Link>
              <Link
                href="/create"
                className="hidden items-center gap-2 rounded-xl border border-white/80 bg-[var(--editable-cta-bg)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--editable-cta-text)] transition hover:-translate-y-0.5 hover:brightness-110 sm:inline-flex"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Post your ad
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-white/10 bg-[var(--editable-nav-bg)] px-4 py-5 lg:hidden">
          <form action="/search" className="mb-5">
            <label className="flex h-12 items-center gap-3 rounded-xl bg-white px-4 text-[var(--slot4-page-text)]">
              <Search className="h-4 w-4 text-[#1455cc]" />
              <input name="q" type="search" placeholder="Search, whatever you need..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#6c7693]" />
            </label>
          </form>
          <div className="grid gap-1">
            {[{ label: 'Home', href: '/' }, ...navItems, { label: 'Contact', href: '/contact' }, ...(session ? [{ label: 'Create', href: '/create' }] : [{ label: 'Login', href: '/login' }, { label: 'Sign up', href: '/signup' }])].map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] ${
                    active
                      ? 'bg-white text-[var(--slot4-accent)]'
                      : 'text-white/76 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
          <Link href="/create" onClick={() => setOpen(false)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/80 bg-[var(--editable-cta-bg)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            <UserPlus className="h-3.5 w-3.5" /> Post your ad
          </Link>
        </div>
      ) : null}
    </header>
  )
}
