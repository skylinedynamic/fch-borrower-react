import React, { useState, useMemo, useEffect } from 'react'
import { SaveFinancialInfoRequest, ValidationErrors } from '../../../modules/profile/types'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { countries as countriesData } from '../../../data/countries'
import { yearsInBusinessOptions } from '../../../data/profile'
import { useFinancialInfo, useSaveFinancialInfo } from '../../../modules/profile/queries'
import { toast } from 'react-toastify'
import TabLoader from '../../../components/Loader/TabLoader'
import { formatCurrency, unformatCurrency } from '../../../utils/formatters'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { LOCKED_FINANCIAL_FIELDS } from '../../../config/profileLockFields'
import { useSubmitChangeRequest } from '../../../modules/profile/queries'
import { useRef } from 'react'

interface FinancialSupportProps {
  data: any
  onChange: (data: any) => void
  onSave: () => void
  onBack: () => void
  saving: boolean
}

export default function FinancialSupport({ data, onChange, onSave, onBack, saving }: FinancialSupportProps) {
  const { data: apiData, isSuccess, isLoading } = useFinancialInfo()
  const { mutate: saveFinancial, isPending } = useSaveFinancialInfo()
  const [errors, setErrors] = useState<ValidationErrors>({})
  const { mutate: submitChange, isPending: isSubmittingChange } = useSubmitChangeRequest()
  const inputRef = useRef<HTMLInputElement>(null)

  // Update Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updateRequest, setUpdateRequest] = useState({
    label: '',
    key: '' as keyof SaveFinancialInfoRequest,
    currentValue: '',
    newValue: ''
  })

  const toggleModal = () => setIsModalOpen(!isModalOpen)

  const handleOpenRequestModal = (label: string, key: keyof SaveFinancialInfoRequest, value: any) => {
    setUpdateRequest({
      label,
      key,
      currentValue: value || '',
      newValue: ''
    })
    setIsModalOpen(true)
  }

  const isFieldLocked = (field: keyof SaveFinancialInfoRequest) => {
    const dbValue = (apiData as any)?.[field];
    return LOCKED_FINANCIAL_FIELDS.includes(field) && dbValue !== null && dbValue !== undefined && dbValue !== '';
  }

  const handleSave = () => {
    setErrors({})
    const payload: SaveFinancialInfoRequest = {
      currency: data.currency,
      years_in_business: data.years_in_business,
      monthly_revenue: parseFloat(unformatCurrency(data.monthly_revenue)) || 0,
      annual_revenue: parseFloat(unformatCurrency(data.annual_revenue)) || 0,
    }

    saveFinancial(payload, {
      onSuccess: (response) => {
        if (response.status) {
          toast.success(response.message)
          //onSave()
        } else {
          toast.error(response.message)
          if (response.errors) {
            setErrors(response.errors)
          }
        }
      },
      onError: (error: any) => {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors)
        } else {
          toast.error('Failed to save financial information')
        }
      }
    })
  }

  useEffect(() => {
    if (isSuccess && apiData) {
      onChange({
        ...data,
        currency: apiData.currency,
        years_in_business: apiData.years_in_business,
        monthly_revenue: apiData.monthly_revenue ? formatCurrency(apiData.monthly_revenue) : '',
        annual_revenue: apiData.annual_revenue ? formatCurrency(apiData.annual_revenue) : '',
      })
    }
  }, [isSuccess, apiData])

  const currencyOptions = useMemo(() => {
    return countriesData.map(country => ({
      label: `${country.currency} - ${country.name}`,
      value: country.currency
    }))
  }, [])

  if (isLoading) {
    return <TabLoader count={4} colClass="col-md-6" />
  }

  return (
    <div className="fade-panel">
      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Currency <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.currency}
            onChange={(value) => onChange({ ...data, currency: value })}
            options={currencyOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Select currency"
            className={`w-100 ${errors.currency ? 'is-invalid' : ''}`}
          />
          {errors.currency && <div className="invalid-feedback d-block">{errors.currency}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Years in Business <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.years_in_business}
            onChange={(value) => onChange({ ...data, years_in_business: value })}
            options={yearsInBusinessOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Select years"
            className={`w-100 ${errors.years_in_business ? 'is-invalid' : ''}`}
          />
          {errors.years_in_business && <div className="invalid-feedback d-block">{errors.years_in_business}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="$20,000"
              value={data.monthly_revenue}
              onChange={(e) => onChange({ ...data, monthly_revenue: formatCurrency(e.target.value) })}
              className={`form-control ${errors.monthly_revenue ? 'is-invalid' : ''} ${isFieldLocked('monthly_revenue' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('monthly_revenue' as any)}
            />
            {isFieldLocked('monthly_revenue' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute end-0 top-0 mt-1 me-1 shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Monthly Revenue', 'monthly_revenue' as any, data.monthly_revenue)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.monthly_revenue && <div className="invalid-feedback d-block">{errors.monthly_revenue}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Annual Revenue <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="$30,000"
              value={data.annual_revenue}
              onChange={(e) => onChange({ ...data, annual_revenue: formatCurrency(e.target.value) })}
              className={`form-control ${errors.annual_revenue ? 'is-invalid' : ''} ${isFieldLocked('annual_revenue' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('annual_revenue' as any)}
            />
            {isFieldLocked('annual_revenue' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute end-0 top-0 mt-1 me-1 shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Annual Revenue', 'annual_revenue' as any, data.annual_revenue)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.annual_revenue && <div className="invalid-feedback d-block">{errors.annual_revenue}</div>}
        </div>
        <div className="col-12 d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-warning" onClick={onBack}>Previous</button>
          <button type="button" className="btn primary-btn" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Update Request Modal */}
      <Modal
        isOpen={isModalOpen}
        toggle={toggleModal}
        centered
        onOpened={() => inputRef.current?.focus()}
      >
        <ModalHeader toggle={toggleModal}>Change Request: {updateRequest.label}</ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <label className="form-label text-muted">Current Value</label>
            <input
              type="text"
              className="form-control bg-light"
              value={formatCurrency(String(updateRequest.currentValue))}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Requested New Value <span className="text-danger">*</span></label>
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder={`Enter the updated ${updateRequest.label}`}
              value={updateRequest.newValue}
              onChange={(e) => setUpdateRequest({ ...updateRequest, newValue: formatCurrency(e.target.value) })}
            />
          </div>
          <div className="alert alert-info border-0 mb-0">
            <div className="d-flex">
              <div className="flex-shrink-0">
                <i className="ri-information-line fs-18"></i>
              </div>
              <div className="flex-grow-1 ms-2">
                <p className="mb-0 fs-13">
                  This field is verified and locked. Submitting this form will notify our compliance team to review and verify the new information before it is updated.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-ghost-danger" onClick={toggleModal}>Discard</button>
          <button
            className="btn btn-primary px-4"
            disabled={!updateRequest.newValue || isSubmittingChange}
            onClick={() => {
              submitChange({
                field_name: updateRequest.key,
                old_value: unformatCurrency(String(updateRequest.currentValue)),
                new_value: unformatCurrency(updateRequest.newValue),
              }, {
                onSuccess: (response) => {
                  if (response.status) {
                    toast.success(response.message);
                    toggleModal();
                  } else {
                    toast.error(response.message);
                  }
                },
                onError: () => {
                  toast.error('Failed to submit change request');
                }
              });
            }}
          >
            {isSubmittingChange ? 'Submitting...' : 'Submit for Review'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
