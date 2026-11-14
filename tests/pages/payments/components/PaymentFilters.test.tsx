import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test-utils'
import PaymentFilters from '../../../../src/pages/payments/components/PaymentFilters.jsx'

/**
 * BUG-169 follow-up: each filter's "All ..." option has `value: null`. Without
 * `optionValue`, PrimeReact's Dropdown hands back the whole option object for
 * a null value, so the page sent `payment_from: {label: 'All Methods', ...}`,
 * the API refused it (422) and the list came back empty.
 */
const renderFilters = (selected: Record<string, unknown>) => {
  const setters = {
    setSelectedStatus: vi.fn(),
    setSelectedEnvironment: vi.fn(),
    setSelectedMethod: vi.fn(),
    setSelectedType: vi.fn(),
  }
  renderWithProviders(
    <PaymentFilters
      searchText=""
      setSearchText={vi.fn()}
      selectedStatus={selected.status ?? null}
      selectedEnvironment={selected.environment ?? null}
      selectedMethod={selected.method ?? null}
      selectedType={selected.type ?? null}
      dateRange={[]}
      setDateRange={vi.fn()}
      onApply={vi.fn()}
      onClear={vi.fn()}
      loading={false}
      {...setters}
    />
  )
  return setters
}

const choose = (current: string, option: string) => {
  const trigger = screen.getAllByText(current).find((el) => el.closest('.p-dropdown')) as HTMLElement
  fireEvent.click(trigger.closest('.p-dropdown') as HTMLElement)
  const item = screen.getAllByText(option).find((el) => el.closest('.p-dropdown-item')) as HTMLElement
  fireEvent.click(item)
}

describe('PaymentFilters', () => {
  it.each([
    ['method', 'Stripe', 'All Methods', 'setSelectedMethod'],
    ['type', 'Debit', 'All Types', 'setSelectedType'],
    ['status', 'succeeded', 'All Status', 'setSelectedStatus'],
    ['environment', 1, 'All Environment', 'setSelectedEnvironment'],
  ] as const)('choosing "%s" All sends null, not the option object', (key, value, allLabel, setter) => {
    const setters = renderFilters({ [key]: value })
    const currentLabel = { method: 'Stripe', type: 'Debit', status: 'Succeeded', environment: 'Production' }[key]

    choose(currentLabel, allLabel)

    expect(setters[setter]).toHaveBeenCalledWith(null)
  })

  it('choosing a real method still sends its value', () => {
    const setters = renderFilters({})

    choose('All Methods', 'Square')

    expect(setters.setSelectedMethod).toHaveBeenCalledWith('Square')
  })

  it('offers the commission payout methods, e.g. Cheque', () => {
    const setters = renderFilters({})

    choose('All Methods', 'Cheque')

    expect(setters.setSelectedMethod).toHaveBeenCalledWith('Cheque')
  })
})
