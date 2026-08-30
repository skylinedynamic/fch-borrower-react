import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../../mocks/server'
import { createTestQueryClient } from '../../../../test-utils'
import FederalComplianceStep from '../../../../../src/pages/fundapplication/components/steps/FederalComplianceStep'
import type { FederalCompliance } from '../../../../../src/pages/fundapplication/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const blankFederal: FederalCompliance = {
  legalBusinessName: '',
  ein: '',
  country: '',
  ofacResult: '',
  patriotActAck: false,
  fcraAuth: false,
  ecoaAck: false,
  bankruptcy: '',
  lawsuit: '',
  federalLoanDefault: '',
  federalDebtDelinquent: '',
  criminalOffense: '',
  paroleProbation: '',
  suspendedDebarred: '',
  judgmentsLiensBusiness: '',
  judgmentsLiensOwner: '',
  explanation: '',
}

function Harness({ onSaveReady }: { onSaveReady: (fn: () => Promise<boolean>) => void }) {
  const [federal, setFederal] = useState<FederalCompliance>(blankFederal)
  return (
    <FederalComplianceStep
      federal={federal}
      setFederal={setFederal}
      onNext={() => {}}
      onBack={() => {}}
      loading={false}
      isValid={true}
      fundingRequestId={7}
      onRegisterSave={(fn) => fn && onSaveReady(fn)}
    />
  )
}

const renderStep = () => {
  let save: (() => Promise<boolean>) | null = null
  const queryClient = createTestQueryClient()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <Harness onSaveReady={(fn) => (save = fn)} />
    </QueryClientProvider>
  )
  return { ...utils, getSave: () => save }
}

describe('FederalComplianceStep', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('maps each answer to true/false/null and posts the funding_request_id', async () => {
    server.use(
      http.get('*/borrower/funding-application/federal-compliance-disclosures', () =>
        HttpResponse.json({ status: true, data: {} })
      )
    )
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/funding-application/federal-compliance-disclosures', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: { id: 1 } })
      })
    )

    const user = userEvent.setup()
    const { getSave } = renderStep()
    await screen.findByText(/bankruptcy/i)

    // Answer all 9 questions "No" except bankruptcy = "Yes"
    const noLabels = screen.getAllByText('No')
    const yesLabels = screen.getAllByText('Yes')

    await user.click(yesLabels[0]) // bankruptcy = yes
    for (let i = 1; i < noLabels.length; i++) {
      await user.click(noLabels[i])
    }

    const textarea = screen.getByPlaceholderText(/If yes to any of the above, explain/i)
    await user.type(textarea, 'Chapter 11 filed in 2019, discharged 2021.')

    const save = getSave()
    await save!()

    await waitFor(() => expect(receivedBody).not.toBeNull())
    expect(receivedBody.filed_for_bankruptcy).toBe(true)
    expect(receivedBody.any_pending_lawsuits).toBe(false)
    expect(receivedBody.funding_request_id).toBe(7)
    expect(receivedBody.federal_compliance_disclosures_explanation).toBe('Chapter 11 filed in 2019, discharged 2021.')
  })

  it('surfaces server-side validation errors per field without throwing', async () => {
    server.use(
      http.get('*/borrower/funding-application/federal-compliance-disclosures', () =>
        HttpResponse.json({ status: true, data: {} })
      ),
      http.post('*/borrower/funding-application/federal-compliance-disclosures', () =>
        HttpResponse.json(
          { message: 'Validation failed', errors: { federal_compliance_disclosures_explanation: 'Explanation is too short.' } },
          { status: 422 }
        )
      )
    )

    const { getSave } = renderStep()
    await screen.findByText(/bankruptcy/i)

    const result = await getSave()!()
    expect(result).toBe(false)
    expect(await screen.findByText('Explanation is too short.')).toBeInTheDocument()
  })
})
