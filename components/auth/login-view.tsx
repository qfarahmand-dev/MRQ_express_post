'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { Logo } from '@/components/common/logo'
import { useLanguage } from '@/contexts/language-context'

export function LoginView() {
  const { t } = useLanguage()

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image src="/images/hero-cargo.png" alt="" fill sizes="50vw" className="object-cover opacity-25" />
        <Logo variant="light" className="relative self-start" />
        <div className="relative flex max-w-md flex-col gap-3">
          <span className="h-1 w-12 rounded-full bg-highlight" aria-hidden="true" />
          <p className="text-3xl font-bold leading-tight text-white text-balance">{t.login.sideTitle}</p>
          <p className="text-white/75 text-pretty">{t.login.sideDescription}</p>
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Logo className="lg:invisible" />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t.login.backToWebsite}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-primary">{t.login.title}</h1>
              <p className="text-sm text-muted-foreground text-pretty">{t.login.description}</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  )
}
