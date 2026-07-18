'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import Modal from './Modal'

const ModalContext = createContext<{ open: () => void }>({ open: () => {} })

export function useModal() {
  return useContext(ModalContext)
}

export default function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <ModalContext.Provider value={{ open }}>
      {children}
      <Modal isOpen={isOpen} onClose={close} />
    </ModalContext.Provider>
  )
}
