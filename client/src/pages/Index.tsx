import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Categories } from '@/components/Categories';
import { ProductsSection } from '@/components/ProductsSection';
import { DiscountedProducts } from '@/components/DiscountedProducts';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { Reviews } from '@/components/Reviews';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const Index = () => {
  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main">
        <Hero />
        <Categories />
        <ProductsSection />
        <DiscountedProducts />
        <WhyChooseUs />
        <Reviews />
        <FAQ />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
