import ModalProvider from '@/components/ModalProvider'
import Banner from '@/components/Banner'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import ForDevelopers from '@/components/ForDevelopers'
import InstallStrip from '@/components/InstallStrip'
import NoMiddleman from '@/components/NoMiddleman'
import PainSection from '@/components/PainSection'
import Templates from '@/components/Templates'
import Comparisons from '@/components/Comparisons'
import Roadmap from '@/components/Roadmap'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <ModalProvider>
        <Banner />
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <ForDevelopers />
          <InstallStrip />
          <NoMiddleman />
          <PainSection />
          <Templates />
          <Comparisons />
          <Roadmap />
          <FinalCTA />
        </main>
      </ModalProvider>
      <Footer />
    </>
  )
}
