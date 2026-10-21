import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import { usePreQualificationForm } from '../../../../src/pages/prequalification/hooks/usePreQualificationForm'

afterEach(() => server.resetHandlers())

const renderPreQualForm = () => {
  const queryClient = createTestQueryClient()
  return renderHook(() => usePreQualificationForm(), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  })
}

describe('usePreQualificationForm', () => {
  it('starts with no existing pre-qualification, then submits personal info and advances to step 1', async () => {
    server.use(http.get('*/borrower/pre-qualification', () => HttpResponse.json({ status: true, data: null })))
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/pre-qualification/personal-info', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: { id: 'preq-1' } })
      })
    )

    const { result } = renderPreQualForm()
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setPersonal({
        firstName: 'Jane',
        lastName: 'Borrower',
        email: 'jane@example.com',
        countryCode: 'USA (+1)',
        phoneNumber: '(512) 555-0100',
        businessWebsite: '',
        stateOfIncorporation: 'Texas',
      })
    })

    await act(async () => {
      await result.current.handlePersonalInfoSubmit()
    })

    expect(receivedBody).toMatchObject({ first_name: 'Jane', last_name: 'Borrower', state_of_incorporation: 'Texas' })
    expect(result.current.step).toBe(1)
    expect(result.current.personalErrors).toEqual({})
  })

  it('maps snake_case API validation errors to their camelCase form fields', async () => {
    server.use(
      http.get('*/borrower/pre-qualification', () => HttpResponse.json({ status: true, data: null })),
      http.post('*/borrower/pre-qualification/personal-info', () =>
        HttpResponse.json(
          { message: 'Validation failed', errors: { business_website: ['Must be a valid URL.'] } },
          { status: 422 }
        )
      )
    )

    const { result } = renderPreQualForm()
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setPersonal({
        firstName: 'Jane',
        lastName: 'Borrower',
        email: 'jane@example.com',
        countryCode: 'USA (+1)',
        phoneNumber: '(512) 555-0100',
        businessWebsite: 'not-a-url',
        stateOfIncorporation: 'Texas',
      })
    })

    await act(async () => {
      await result.current.handlePersonalInfoSubmit()
    })

    expect(result.current.personalErrors).toEqual({ businessWebsite: 'Must be a valid URL.' })
    expect(result.current.step).toBe(0) // did not advance
  })

  it('handleFinalSubmit creates a draft first, and fails loudly when it gets no id back', async () => {
    server.use(http.get('*/borrower/pre-qualification', () => HttpResponse.json({ status: true, data: null })))

    // With no draft yet, the final submit creates one. If that call comes back
    // without an id there is nothing to submit against, and the hook must say
    // so rather than silently doing nothing.
    let draftRequested = false
    server.use(
      http.post('*/borrower/pre-qualification/personal-info', () => {
        draftRequested = true
        return HttpResponse.json({ status: true, data: {} })
      })
    )

    const { result } = renderPreQualForm()
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.handleFinalSubmit()).rejects.toThrow(
      'Unable to create or locate pre-qualification draft to submit.'
    )
    expect(draftRequested).toBe(true)
  })
})
