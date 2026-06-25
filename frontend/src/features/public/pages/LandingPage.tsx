import LandingNavbar from "../components/LandingNavbar";
import HeroSection from "../components/HeroSection";
import PillarsSection from "../components/PillarsSection";
import SolutionsSection from "../components/SolutionsSection";
import StatsSection from "../components/StatsSection";
import TestimonialsSection from "../components/TestimonialsSection";
import CTASection from "../components/CTASection";
import LandingFooter from "../components/LandingFooter";
import batikTexture from "../../../assets/batik-texture.png";

export default function LandingPage() {
  return (
    <div className="font-inter antialiased">
      <LandingNavbar />
      <main className="relative min-h-screen overflow-hidden"
        style={{
          background: `
            linear-gradient(to bottom, #2347C6, #1a3599),
            url(${batikTexture})
          `,
          backgroundBlendMode: "soft-light",
          backgroundSize: "cover, 280px",
        }}
      >
        {/* Batik texture overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `url(${batikTexture})`,
            backgroundSize: "200px",
            backgroundRepeat: "repeat",
            opacity: 0.06,
            mixBlendMode: "overlay",
          }}
        />
        <div className="relative z-10">
          <HeroSection />
          <PillarsSection />
          <SolutionsSection />
          <StatsSection />
          <TestimonialsSection />
          <CTASection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
