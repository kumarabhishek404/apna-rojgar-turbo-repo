import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DownloadApp from "@/components/DownloadApp";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ScreenshotsSlider from "@/components/ScreenshotsSlider";
import AboutMissionVision from "@/components/AboutMissionVision";
import Investors from "@/components/InvestorSection";
import Reveal from "@/components/animations/Reveal";

export default function PublicHome() {
  return (
    <>
      <Navbar />
      <Reveal y={12}>
        <Hero />
      </Reveal>
      <Reveal delay={0.03}>
        <AboutMissionVision />
      </Reveal>
      <Reveal delay={0.05}>
        <Features />
      </Reveal>
      <Reveal delay={0.06}>
        <ScreenshotsSlider />
      </Reveal>
      <Reveal delay={0.07}>
        <DownloadApp />
      </Reveal>
      <Reveal delay={0.08}>
        <HowItWorks />
      </Reveal>
      <Reveal delay={0.1}>
        <Investors />
      </Reveal>
      <Reveal delay={0.12}>
        <Contact />
      </Reveal>
      <Footer />
    </>
  );
}
