import { useState } from 'react'
import { toast } from 'react-toastify'
import type { CoBorrower } from '../types'

export const useCoBorrowers = () => {
  const emptyCoDraft: CoBorrower = {
    firstName: '',
    lastName: '',
    role: '',
    ownershipPct: '',
    email: '',
    mobilePhone: '',
    homePhone: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    ssn: '',
    dob: '',
    driversLicenseNumber: '',
    driversLicenseState: '',
  }

  const [coBorrowers, setCoBorrowers] = useState<CoBorrower[]>([])
  const [coDraft, setCoDraft] = useState<CoBorrower>(emptyCoDraft)

  const showCoModal = () => {
    const el = typeof document !== 'undefined' ? document.getElementById('coBorrowerModal') : null
    const bs = (window as any)?.bootstrap
    if (el && bs?.Modal) bs.Modal.getOrCreateInstance(el).show()
  }

  const hideCoModal = () => {
    const el = typeof document !== 'undefined' ? document.getElementById('coBorrowerModal') : null
    const bs = (window as any)?.bootstrap
    if (el && bs?.Modal) bs.Modal.getInstance(el)?.hide()
  }

  const submitCoBorrower = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCoBorrowers((prev) => [...prev, coDraft])
    setCoDraft(emptyCoDraft)
    hideCoModal()
    toast.success('Co-borrower added')
  }

  const deleteCoBorrower = (idx: number) => {
    setCoBorrowers(coBorrowers.filter((_, i) => i !== idx))
  }

  return {
    coBorrowers,
    coDraft,
    setCoDraft,
    showCoModal,
    submitCoBorrower,
    deleteCoBorrower,
    emptyCoDraft,
  }
}
