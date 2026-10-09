import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import SignaturePad from '../../../../../src/pages/fundapplication/components/shared/SignaturePad'

describe('SignaturePad', () => {
  it('the signature date picker uses the shared month and year dropdowns', async () => {
    render(<SignaturePad value="" onChange={() => {}} showDate date="2026-01-15" onDateChange={() => {}} />)

    await waitFor(() => {
      expect(document.querySelector('.fp-yd-trigger[data-kind="year"]')).not.toBeNull()
      expect(document.querySelector('.fp-yd-trigger[data-kind="month"]')).not.toBeNull()
    })
  })
})
