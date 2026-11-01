import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../../../test-utils'
import VideoPlayerSection from '../../../../../src/pages/credit-builder/creditoverview/components/VideoPlayerSection'

/**
 * Credit Builder › Overview › training videos: a playlist with each video's
 * YouTube thumbnail, and a player that shows the video's thumbnail until the
 * borrower presses play - the YouTube player only loads then.
 */
const FIRST = 'FCH Borrower Training #1 — Business Credit Building Fundamentals'
const THIRD = 'FCH Borrower Training #3 — Tier 0 Explained: Fundability Mistakes'

const playlist = () => within(screen.getByRole('list', { name: 'Playlist' }))

describe('Credit Builder Overview - training videos', () => {
  it("shows each video's thumbnail and length in the playlist", () => {
    renderWithProviders(<VideoPlayerSection />)

    const items = playlist().getAllByRole('listitem')
    expect(items).toHaveLength(5)
    const thumb = within(items[0]).getByRole('img', { name: FIRST })
    expect(thumb).toHaveAttribute('src', 'https://img.youtube.com/vi/vLaCU32XMNs/mqdefault.jpg')
    expect(items[0]).toHaveTextContent('06:50')
  })

  it('shows the video thumbnail, not an empty player, until play is pressed', () => {
    renderWithProviders(<VideoPlayerSection />)

    expect(screen.queryByTitle(FIRST)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Play ${FIRST}` })).toBeInTheDocument()
  })

  it('loads the YouTube player, playing, when play is pressed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VideoPlayerSection />)

    await user.click(screen.getByRole('button', { name: `Play ${FIRST}` }))

    const player = screen.getByTitle(FIRST)
    expect(player.getAttribute('src')).toContain('youtube.com/embed/vLaCU32XMNs')
    expect(player.getAttribute('src')).toContain('autoplay=1')
  })

  it('plays the video picked from the playlist and marks it as playing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VideoPlayerSection />)

    await user.click(playlist().getByRole('button', { name: new RegExp(THIRD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))

    expect(screen.getByTitle(THIRD).getAttribute('src')).toContain('youtube.com/embed/tQ91i6zBU0Q')
    const active = playlist().getAllByRole('listitem')[2]
    expect(within(active).getByRole('button')).toHaveAttribute('aria-current', 'true')
    expect(active).toHaveTextContent('Now playing')
  })
})
