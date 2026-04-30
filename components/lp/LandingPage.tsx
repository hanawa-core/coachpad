import { LpNavbar } from './LpNavbar'
import { LpStickyCta } from './LpStickyCta'
import { HeroSection } from './sections/HeroSection'
import { PainSection } from './sections/PainSection'
import { SolutionSection } from './sections/SolutionSection'
import { MethodSection } from './sections/MethodSection'
import { ServiceProgramSection } from './sections/ServiceProgramSection'
import { ServiceDataSection } from './sections/ServiceDataSection'
import { ServiceChatSection } from './sections/ServiceChatSection'
import { ServiceVideoSection } from './sections/ServiceVideoSection'
import { WhySection } from './sections/WhySection'
import { BeforeAfterSection } from './sections/BeforeAfterSection'
import { ProfileSection } from './sections/ProfileSection'
import { PricingSection } from './sections/PricingSection'
import { FaqSection } from './sections/FaqSection'
import { CtaSection } from './sections/CtaSection'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LpNavbar />
      <LpStickyCta />
      <main>
        <HeroSection />
        <PainSection />
        <SolutionSection />
        <MethodSection />
        <ServiceProgramSection />
        <ServiceDataSection />
        <ServiceChatSection />
        <ServiceVideoSection />
        <WhySection />
        <BeforeAfterSection />
        <ProfileSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
    </div>
  )
}
