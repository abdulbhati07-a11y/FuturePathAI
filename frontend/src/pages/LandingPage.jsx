import PublicNav from '../components/landing/PublicNav';
import Hero from '../components/landing/Hero';
import FeatureGrid from '../components/landing/FeatureGrid';
import DemoPanel from '../components/landing/DemoPanel';
import PricingTiers from '../components/landing/PricingTiers';
import TrustStrip from '../components/landing/TrustStrip';
import InquiryForm from '../components/landing/InquiryForm';
import FinalCta from '../components/landing/FinalCta';
import SiteFooter from '../components/SiteFooter';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <PublicNav />
      <Hero />
      <FeatureGrid />
      <DemoPanel />
      <PricingTiers />
      <TrustStrip />
      <InquiryForm />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
