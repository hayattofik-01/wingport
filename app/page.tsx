import Banner from '@/components/Banner'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import ForDevelopers from '@/components/ForDevelopers'
import NoMiddleman from '@/components/NoMiddleman'
import Comparisons from '@/components/Comparisons'
import Roadmap from '@/components/Roadmap'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Banner />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ForDevelopers />
        <NoMiddleman />
        <Comparisons />
        <Roadmap />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
