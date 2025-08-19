import AboutSection from '@/app/about/about';
import Carousel from '@/components/shared/carousel';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <AboutSection />
      <Carousel className="mt-12" />
    </div>
  );
}
