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
    country: 'United States',
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
  const [editIndex, setEditIndex] = useState<number | null>(null)

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

  const editCoBorrower = (idx: number) => {
    setEditIndex(idx)
    setCoDraft(coBorrowers[idx])
    showCoModal()
  }

  const submitCoBorrower = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (editIndex !== null) {
      setCoBorrowers((prev) => {
        const updated = [...prev]
        updated[editIndex] = coDraft
        return updated
      })
    } else {
      setCoBorrowers((prev) => [...prev, coDraft])
    }
    
    setCoDraft(emptyCoDraft)
    setEditIndex(null)
    hideCoModal()
    toast.success(editIndex !== null ? 'Co-borrower updated' : 'Co-borrower added')
  }

  const deleteCoBorrower = (idx: number) => {
    setCoBorrowers(coBorrowers.filter((_, i) => i !== idx))
  }

  return {
    coBorrowers,
    setCoBorrowers,
    coDraft,
    setCoDraft,
    showCoModal,
    submitCoBorrower,
    deleteCoBorrower,
    editCoBorrower,
    emptyCoDraft,
  }
}
