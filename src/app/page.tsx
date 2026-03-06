// TEST 6: ALL SECTIONS (Full Homepage)
import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  ActivePoolsSection,
  FarmersSection,
  TrustSection,
} from '@/components/home'

export const revalidate = 300 // ISR: 5 min

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ActivePoolsSection />
      <FarmersSection />
      <TrustSection />
    </div>
  )
}
