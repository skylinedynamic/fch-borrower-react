import React, { useState } from 'react'

const PLAYLIST = [
  { id: 'vLaCU32XMNs', title: 'FCH Borrower Training #1 — Business Credit Building Fundamentals', duration: '06:50' },
  { id: 's-eDkLt-yKs', title: 'FCH Borrower Training # 2 - Business Credit ACTUALLY Works (Step-By-Step for Beginners)', duration: '03:01' },
  { id: 'tQ91i6zBU0Q', title: 'FCH Borrower Training #3 — Tier 0 Explained: Fundability Mistakes', duration: '03:30' },
  { id: '3TnJXSHcadQ', title: 'FCH Borrower Training #4 - Tier 1 Explained: Your First 3 Vendor Accounts (Step-By-Step)', duration: '02:41' },
  { id: 'jFCELdtsTHs', title: 'FCH Borrower Training #5 — How to Use Tier 1 Accounts Correctly', duration: '03:42' },
]

/** YouTube's own thumbnails (the Resource Hub uses the same). */
const thumbnail = (id: string, size: 'mqdefault' | 'hqdefault' = 'mqdefault') => `https://img.youtube.com/vi/${id}/${size}.jpg`

/**
 * The training videos: the player - the video's thumbnail with a play button
 * until the borrower starts it, so the YouTube player only loads then - and
 * the playlist, each video with its thumbnail and length.
 */
export default function VideoPlayerSection() {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const video = PLAYLIST[current]

  const play = (index: number) => {
    setCurrent(index)
    setPlaying(true)
  }

  return (
    <div className="co-card co-videos">
      <div className="co-card-head">
        <div>
          <h2 className="co-card-title">Credit Building Introduction</h2>
          <p className="co-card-sub">Essential knowledge for your business credit journey</p>
        </div>
        <span className="co-chip">
          <i className="ri-play-list-2-line" aria-hidden="true"></i> {PLAYLIST.length} videos
        </span>
      </div>

      <div className="co-video-layout">
        <div className="co-player">
          <div className="co-player-surface">
            {playing ? (
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1&autoplay=1`}
                title={video.title}
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <button type="button" className="co-poster" aria-label={`Play ${video.title}`} onClick={() => play(current)}>
                <img src={thumbnail(video.id, 'hqdefault')} alt="" />
                <span className="co-poster-shade" aria-hidden="true"></span>
                <span className="co-poster-play" aria-hidden="true">
                  <i className="ri-play-fill"></i>
                </span>
                <span className="co-poster-duration" aria-hidden="true">
                  <i className="ri-time-line"></i> {video.duration}
                </span>
              </button>
            )}
          </div>
          <div className="co-player-bar">
            <span className="co-player-now">
              Video {current + 1} of {PLAYLIST.length} · {video.duration}
            </span>
            <h3 className="co-player-title">{video.title}</h3>
          </div>
        </div>

        <div className="co-playlist-wrap">
          <div className="co-playlist-head">
            <span>Up next</span>
            <span>
              {current + 1}/{PLAYLIST.length}
            </span>
          </div>
          <ol className="co-playlist" aria-label="Playlist">
            {PLAYLIST.map((item, i) => {
              const isCurrent = i === current

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`co-playlist-item ${isCurrent ? 'is-active' : ''}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={() => play(i)}
                  >
                    <span className="co-thumb">
                      <img src={thumbnail(item.id)} alt={item.title} loading="lazy" />
                      <span className="co-thumb-play" aria-hidden="true">
                        <i className="ri-play-fill"></i>
                      </span>
                      <span className="co-thumb-duration">{item.duration}</span>
                    </span>
                    <span className="co-playlist-body">
                      <span className="co-playlist-title">{item.title}</span>
                      {isCurrent ? (
                        <span className="co-playlist-now">
                          {playing ? (
                            <span className="co-eq" aria-hidden="true">
                              <span></span>
                              <span></span>
                              <span></span>
                            </span>
                          ) : (
                            <i className="ri-play-circle-line" aria-hidden="true"></i>
                          )}
                          {playing ? 'Now playing' : 'Ready to play'}
                        </span>
                      ) : (
                        <span className="co-playlist-meta">Video {i + 1}</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
