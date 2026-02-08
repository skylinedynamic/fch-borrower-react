import React, { useState, useRef } from 'react'
import overviewImg from '../../../../../assets/images/blog/overview.jpg'

export default function VideoPlayerSection() {
  const playlist = [
    { type: 'youtube', url: 'https://www.youtube.com/watch?v=vLaCU32XMNs&list=PLsVzj2or68e0tRuBeBSspgS_6yz6kQaZh&index=1', title: 'FCH Borrower Training #1 — Business Credit Building Fundamentals', duration: '06.50' },
    { type: 'youtube', url: 'https://www.youtube.com/watch?v=s-eDkLt-yKs&list=PLsVzj2or68e0tRuBeBSspgS_6yz6kQaZh&index=2', title: 'FCH Borrower Training # 2 - Business Credit ACTUALLY Works (Step-By-Step for Beginners)', duration: '03:01' },
    { type: 'youtube', url: 'https://www.youtube.com/watch?v=tQ91i6zBU0Q&list=PLsVzj2or68e0tRuBeBSspgS_6yz6kQaZh&index=3', title: 'FCH Borrower Training #3 — Tier 0 Explained: Fundability Mistakes', duration: '03:30' },
    { type: 'youtube', url: 'https://www.youtube.com/watch?v=3TnJXSHcadQ&list=PLsVzj2or68e0tRuBeBSspgS_6yz6kQaZh&index=4', title: 'FCH Borrower Training #4 - Tier 1 Explained: Your First 3 Vendor Accounts (Step-By-Step)', duration: '02:41' },
    { type: 'youtube', url: 'https://www.youtube.com/watch?v=jFCELdtsTHs&list=PLsVzj2or68e0tRuBeBSspgS_6yz6kQaZh&index=5', title: 'FCH Borrower Training #5 — How to Use Tier 1 Accounts Correctly', duration: '03:42' }

  ]
  const [current, setCurrent] = useState(0)
  const [auto, setAuto] = useState(false)
  const vidRef = useRef<HTMLVideoElement | null>(null)

  // Helper function to extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/)
    return match ? match[1] : ''
  }

  return (
    <div className="card">
      <div className="card-header"><h6 className="mb-0 fs-15">Credit Building Introduction</h6><small className="text-muted">Essential knowledge for your business credit journey</small></div>
      <div className="card-body">
         <div className="video-layout" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div className="video-player" style={{ flex: '1 1 60%', minWidth: '300px' }}>
            <div className="video-header" style={{ marginBottom: '10px' }}><div className="video-title" style={{ fontWeight: '600', fontSize: '16px' }}>{playlist[current].title}</div><span className="pi-badge" style={{ fontSize: '12px', color: '#6c757d' }}>{playlist.length} videos</span></div>
            <div className="video-surface" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', backgroundColor: '#000', borderRadius: '8px' }}>
              {playlist[current].type === 'youtube' ? (
                <iframe 
                  src={`https://www.youtube.com/embed/${getYouTubeId(playlist[current].url)}?rel=0&modestbranding=1${auto ? '&autoplay=1' : ''}`} 
                  title={playlist[current].title} 
                  frameBorder={0} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                ></iframe>
              ) : (
                <video ref={vidRef} controls src={(playlist[current] as any).src} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></video>
              )}
            </div>
            <div className="video-controls" style={{ marginTop: '15px' }}><button type="button" className="btn btn-primary btn-sm btn-play" onClick={() => { if (playlist[current].type === 'file') { vidRef.current?.play() } else { setAuto(true) } }}><i className="ri-play-line align-middle me-1"></i>Play</button></div>
          </div>
          <div className="playlist" style={{ flex: '1 1 35%', minWidth: '280px', border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="playlist-header" style={{ padding: '12px 16px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef', fontWeight: '600', fontSize: '14px' }}>Playlist</div>
            <div className="playlist-items" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {playlist.map((p, i) => (
                <div 
                  key={i} 
                  className={`playlist-item ${i===current?'active':''}`} 
                  onClick={() => { setCurrent(i); setAuto(true) }}
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: i===current ? '#e7f1ff' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { if (i !== current) e.currentTarget.style.backgroundColor = '#f8f9fa' }}
                  onMouseLeave={(e) => { if (i !== current) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div className="pi-thumb" style={{ flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef', borderRadius: '6px' }}>
                    <i className={p.type==='youtube'? 'ri-youtube-line':'ri-film-line'} style={{ fontSize: '20px', color: p.type==='youtube' ? '#ff0000' : '#6c757d' }}></i>
                  </div>
                  <div className="pi-body" style={{ flex: 1, minWidth: 0 }}>
                    <div className="pi-title" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</div>
                    <div className="pi-meta" style={{ fontSize: '11px', color: '#6c757d' }}>{p.type==='youtube'? 'YouTube':'Uploaded'} • {p.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
