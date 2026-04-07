import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import DownloadApp from "../components/DownloadApp";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import ScreenshotsSlider from "@/components/ScreenshotsSlider";
import AboutMissionVision from "../components/AboutMissionVision";
import Investors from "@/components/InvestorSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <AboutMissionVision />
      <Features />
      <ScreenshotsSlider />
      <DownloadApp />
      <HowItWorks />
      <Investors />
      <Contact />
      <Footer />
    </>
  );
}
