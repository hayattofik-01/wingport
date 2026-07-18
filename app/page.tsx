'use client'

import { useState } from 'react'
import Banner from '@/components/Banner'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import ForDevelopers from '@/components/ForDevelopers'
import NoMiddleman from '@/components/NoMiddleman'
import Templates from '@/components/Templates'
import Comparisons from '@/components/Comparisons'
import Roadmap from '@/components/Roadmap'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'
import Modal from '@/components/Modal'

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Banner />
      <Navbar onOpenModal={() => setModalOpen(true)} />
      <main>
        <Hero onOpenModal={() => setModalOpen(true)} />
        <HowItWorks />
        <ForDevelopers />
        <NoMiddleman />
        <Templates />
        <Comparisons />
        <Roadmap />
        <FinalCTA onOpenModal={() => setModalOpen(true)} />
      </main>
      <Footer />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
