import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { Dropdown } from 'primereact/dropdown'
import { AppProviders } from '../src/AppProviders'

const OPTIONS = [
  { label: 'Phone', value: 'phone' },
  { label: 'Video', value: 'video' },
]

const Harness = () => {
  const [value, setValue] = useState<string | null>(null)
  return <Dropdown value={value} options={OPTIONS} onChange={e => setValue(e.value)} placeholder="Select Type" appendTo="self" />
}

describe('AppProviders', () => {
  // PrimeReact's Dropdown reads `context.hideOverlaysOnDocumentScrolling` on
  // scroll with no null check; without a <PrimeReactProvider> that throws
  // (E2E-019: the appointment modal's Type/Partner/Time dropdowns).
  it('scrolling the page while a dropdown is open does not throw', async () => {
    const errors: unknown[] = []
    const onError = (e: ErrorEvent) => { errors.push(e.error); e.preventDefault() }
    window.addEventListener('error', onError)
    try {
      render(<AppProviders><Harness /></AppProviders>)
      fireEvent.click(document.querySelector('.p-dropdown')!)
      // Let the opening animation run to its end, as it does in a browser;
      // the scroll listener is only bound then.
      for (let i = 0; i < 3; i++) await act(() => new Promise(r => setTimeout(r, 100)))
      expect(document.querySelector('.p-dropdown-panel')).not.toBeNull()

      act(() => {
        document.body.dispatchEvent(new Event('scroll'))
        window.dispatchEvent(new Event('resize'))
      })
    } finally {
      window.removeEventListener('error', onError)
    }

    expect(errors).toEqual([])
  })
})
