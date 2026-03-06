import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BuyerHeader from '@/components/buyer/BuyerHeader'
import { BuyerClientLayout } from '@/components/buyer/BuyerClientLayout'
import { SkipLink } from '@/components/ui/page-layout'

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user has buyer role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'farmer') {
    redirect('/farmer')
  } else if (profile?.role === 'admin') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background pb-safe">
      <SkipLink targetId="main-content" />
      <BuyerHeader />
      <main 
        id="main-content"
        role="main"
        aria-label="Buyer dashboard content"
        className="max-w-6xl mx-auto px-4 py-6"
      >
        <BuyerClientLayout>
          {children}
        </BuyerClientLayout>
      </main>
    </div>
  )
}
