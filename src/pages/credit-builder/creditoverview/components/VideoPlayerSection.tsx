import React, { useState, useRef } from 'react'
import overviewImg from '../../../../../assets/images/blog/overview.jpg'

export default function VideoPlayerSection() {
  const playlist = [
    { type: 'youtube', id: 'dQw4w9WgXcQ', title: 'Business Credit Building Fundamentals', duration: '10:12' },
    { type: 'file', src: overviewImg, title: 'Vendor Accounts for Fast Credit', duration: '08:03' },
    { type: 'youtube', id: 'n9K9wZsYQzk', title: 'Understanding Business Credit Scores', duration: '12:45' }
  ]
  const [current, setCurrent] = useState(0)
  const [auto, setAuto] = useState(false)
  const vidRef = useRef<HTMLVideoElement | null>(null)

  return (
    <div className="card">
      <div className="card-header"><h6 className="mb-0 fs-15">Credit Building Introduction</h6><small className="text-muted">Essential knowledge for your business credit journey</small></div>
      <div className="card-body">
         <div className="video-layout">
          <div className="video-player">
            <div className="video-header"><div className="video-title">{playlist[current].title}</div><span className="pi-badge">{playlist.length} videos</span></div>
            <div className="video-surface">
              {playlist[current].type === 'youtube' ? (
                <iframe src={`https://www.youtube.com/embed/${(playlist[current] as any).id}?rel=0&modestbranding=1${auto ? '&autoplay=1' : ''}`} title={playlist[current].title} frameBorder={0} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              ) : (
                <video ref={vidRef} controls src={(playlist[current] as any).src}></video>
              )}
            </div>
            <div className="video-controls"><button type="button" className="btn btn-primary btn-sm btn-play" onClick={() => { if (playlist[current].type === 'file') { vidRef.current?.play() } else { setAuto(true) } }}><i className="ri-play-line align-middle me-1"></i>Play</button></div>
          </div>
          <div className="playlist">
            <div className="playlist-header">Playlist</div>
            <div className="playlist-items">
              {playlist.map((p, i) => (
                <div key={i} className={`playlist-item ${i===current?'active':''}`} onClick={() => { setCurrent(i); setAuto(false) }}>
                  <div className="pi-thumb"><i className={p.type==='youtube'? 'ri-youtube-line':'ri-film-line'}></i></div>
                  <div className="pi-body">
                    <div className="pi-title">{p.title}</div>
                    <div className="pi-meta">{p.type==='youtube'? 'YouTube':'Uploaded'} • {p.duration}</div>
                  </div>
                  <span className="pi-badge">{p.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
