import LandingNavbar from "../components/LandingNavbar";
import HeroSection from "../components/HeroSection";
import PillarsSection from "../components/PillarsSection";
import SolutionsSection from "../components/SolutionsSection";
import StatsSection from "../components/StatsSection";
import TestimonialsSection from "../components/TestimonialsSection";
import CTASection from "../components/CTASection";
import LandingFooter from "../components/LandingFooter";

export default function LandingPage() {
  return (
    <div className="font-inter antialiased">
      <LandingNavbar />
      <main>
        <HeroSection />
        <PillarsSection />
        <SolutionsSection />
        <StatsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
