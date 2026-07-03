import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { EditableLocalLoginForm } from '@/editable/components/EditableLocalAuthForms'
import { pagesContent } from '@/editable/content/pages.content'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: '/login', title: 'Login', description: pagesContent.auth.login.metadataDescription })
}

const trustPoints = [
  'Return to your saved workspace without losing momentum.',
  'Keep publishing details ready for faster future posts.',
  'Move through the same cleaner interface used across the site.',
]

export default function LoginPage() {
  return (
    <EditableSiteShell>
      <main className="min-h-screen bg-[var(--editable-page-bg)] text-[var(--editable-page-text)]">
        <section className="mx-auto max-w-[var(--editable-container)] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="rounded-[1.6rem] border border-[var(--editable-border)] bg-white p-6 shadow-[0_18px_38px_rgba(18,13,55,0.05)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf4ed] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--slot4-accent)]">
                <Sparkles className="h-3.5 w-3.5" /> Access notes
              </div>
              <div className="mt-5 grid gap-3">
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-xl bg-[#fff8ef] px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--slot4-accent)]" />
                    <p className="text-sm leading-7 text-[var(--slot4-muted-text)]">{point}</p>
                  </div>
                ))}
              </div>
            </aside>

            <div className="rounded-[1.8rem] border border-[var(--editable-border)] bg-white p-6 shadow-[0_22px_44px_rgba(18,13,55,0.08)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1455cc]">{pagesContent.auth.login.formTitle}</p>
              <h2 className="mt-3 text-[2.4rem] font-bold tracking-[-0.05em] text-[var(--editable-page-text)]">
                {pagesContent.auth.login.formTitle}
              </h2>
              <EditableLocalLoginForm />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f8fafc] px-4 py-4">
                <p className="text-sm text-[var(--slot4-muted-text)]">
                  New here?{' '}
                  <Link href="/signup" className="font-bold text-[var(--slot4-accent)] underline-offset-4 hover:underline">
                    {pagesContent.auth.login.createCta}
                  </Link>
                </p>
                <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[#1455cc]">
                  Create account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </EditableSiteShell>
  )
}
