import React from 'react'
import { Outlet } from 'react-router-dom'
import ChatbotWidget from '@/features/aiAssistant/components/ChatbotWidget'

const PublicLayout = () => {
  return (
    <>
      <Outlet />
      <ChatbotWidget />
    </>
  )
}

export default PublicLayout