import React, { useState } from 'react'
import { IconVideo } from '@tabler/icons-react'
import Modal from './Model'

import promoVideo from '@/assets/videos/promotion-video.mp4'

const WatchVideoButton = () => {
  
  const [showVideoModal, setShowVideoModal] = useState(false)

  return (
    <>
      <div
        className='d-flex align-items-center rounded-pill px-2 py-1 btn-video'
        style={{ width: 'fit-content', height: '52px', cursor: 'pointer' }}
        onClick={() => setShowVideoModal(true)}
      >
        <div className="d-flex align-items-center justify-content-center bg-white rounded-circle me-2" style={{ width: '37px', height: '37px' }}>
          <IconVideo size={20} className="text-dark" />
        </div>
        <p className="mb-0 me-3">Watch Video</p>
      </div>

      <Modal
        show={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title='See How Marketplace Works'
        size="lg"
      >
        <p className="text-body-secondary mb-3">A quick look at how easy it is to buy and sell on our platform.</p>
        <video
          className="w-100 rounded-3"
          src={promoVideo}
          controls
          autoPlay
          style={{ maxHeight: '70vh' }}
        />
      </Modal>
    </>
  )
}

export default WatchVideoButton