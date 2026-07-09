import React, { useState, useMemo, useEffect, useRef } from 'react'
import { SaveFinancialInfoRequest, ValidationErrors } from '../../../modules/profile/types'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { countries as countriesData } from '../../../data/countries'
import { yearsInBusinessOptions } from '../../../data/profile'
import { useFinancialInfo, useSaveFinancialInfo, useSubmitChangeRequest } from '../../../modules/profile/queries'
import { toast } from 'react-toastify'
import TabLoader from '../../../components/Loader/TabLoader'
import { formatCurrency, unformatCurrency } from '../../../utils/formatters'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { LOCKED_FINANCIAL_FIELDS } from '../../../config/profileLockFields'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { yearDropdownPlugin } from '../../../utils/flatpickrPlugins'

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
    key: '' as any,
    currentValue: '',
    newValue: '',
    entityType: undefined as string | undefined,
    entityId: undefined as number | undefined
  })
  const [modalErrors, setModalErrors] = useState<ValidationErrors>({})

  const toggleModal = () => {
    if (isModalOpen) setModalErrors({})
    setIsModalOpen(!isModalOpen)
  }

  const handleOpenRequestModal = (label: string, key: any, value: any, entityId?: number, entityType?: string) => {
    setUpdateRequest({
      label,
      key,
      currentValue: value || '',
      newValue: '',
      entityId,
      entityType
    })
    setIsModalOpen(true)
  }

  const isFieldLocked = (field: keyof SaveFinancialInfoRequest) => {
    const dbValue = (apiData as any)?.[field];
    return LOCKED_FINANCIAL_FIELDS.includes(field) && dbValue !== null && dbValue !== undefined && dbValue !== '';
  }

  const bankAccounts = data.bank_accounts || []

  const handleAddBankAccount = () => {
    onChange({
      ...data,
      bank_accounts: [
        ...bankAccounts,
        { bank_name: '', account_open_date: null }
      ]
    })
  }

  const handleRemoveBankAccount = (index: number) => {
    const newAccounts = [...bankAccounts]
    newAccounts.splice(index, 1)
    onChange({
      ...data,
      bank_accounts: newAccounts
    })
  }

  const handleBankAccountChange = (index: number, field: string, value: any) => {
    const newAccounts = [...bankAccounts]
    newAccounts[index] = {
      ...newAccounts[index],
      [field]: value
    }
    onChange({
      ...data,
      bank_accounts: newAccounts
    })
  }

  const getRowFieldError = (index: number, field: string) => {
    const key = `bank_accounts.${index}.${field}`
    return errors[key]
  }

  const isBankAccountFieldLocked = (field: 'bank_name' | 'account_open_date', recordId?: number) => {
    if (!recordId) return false;
    const apiAccount = (apiData as any)?.bank_accounts?.find((acc: any) => acc.id === recordId);
    if (!apiAccount) return false;
    const dbValue = apiAccount[field];
    return LOCKED_FINANCIAL_FIELDS.includes(field) && dbValue !== null && dbValue !== undefined && dbValue !== '';
  }

  const handleSave = () => {
    setErrors({})
    const payload: SaveFinancialInfoRequest = {
      currency: data.currency,
      years_in_business: data.years_in_business,
      monthly_revenue: data.monthly_revenue || 0,
      annual_revenue: data.annual_revenue || 0,
      annual_personal_income: data.annual_personal_income || 0,
      average_monthly_deposits: data.average_monthly_deposits ? parseFloat(unformatCurrency(data.average_monthly_deposits)) : undefined,
      monthly_deposit_count: (data.monthly_deposit_count !== '' && data.monthly_deposit_count !== undefined && data.monthly_deposit_count !== null) ? parseInt(data.monthly_deposit_count, 10) : undefined,
      avg_bank_balance: data.avg_bank_balance ? parseFloat(unformatCurrency(data.avg_bank_balance)) : undefined,
      current_business_debt: data.current_business_debt ? parseFloat(unformatCurrency(data.current_business_debt)) : undefined,
      nsf_count: (data.nsf_count !== '' && data.nsf_count !== undefined && data.nsf_count !== null) ? parseInt(data.nsf_count, 10) : undefined,
      negative_days: (data.negative_days !== '' && data.negative_days !== undefined && data.negative_days !== null) ? parseInt(data.negative_days, 10) : undefined,
      bank_accounts: data.bank_accounts || []
    }

    saveFinancial(payload, {
      onSuccess: (response) => {
        if (response.status) {
          toast.success(response.message)
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
        annual_personal_income: apiData.annual_personal_income ? formatCurrency(apiData.annual_personal_income) : '',
        average_monthly_deposits: apiData.average_monthly_deposits ? formatCurrency(apiData.average_monthly_deposits) : '',
        monthly_deposit_count: apiData.monthly_deposit_count ?? '',
        avg_bank_balance: apiData.avg_bank_balance ? formatCurrency(apiData.avg_bank_balance) : '',
        current_business_debt: apiData.current_business_debt ? formatCurrency(apiData.current_business_debt) : '',
        nsf_count: apiData.nsf_count ?? '',
        negative_days: apiData.negative_days ?? '',
        bank_accounts: apiData.bank_accounts || []
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
          <div className="position-relative">
            <CustomDropdown
              searchable={true}
              value={data.currency}
              onChange={(value) => onChange({ ...data, currency: value })}
              options={currencyOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Select currency"
              className={`w-100 ${errors.currency ? 'is-invalid' : ''} ${isFieldLocked('currency') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={isFieldLocked('currency')}
            />
            {isFieldLocked('currency') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Currency', 'currency', data.currency)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.currency && <div className="invalid-feedback d-block">{errors.currency}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Years in Business <span className="text-danger">*</span></label>
          <div className="position-relative">
            <CustomDropdown
              searchable={true}
              value={data.years_in_business}
              onChange={(value) => onChange({ ...data, years_in_business: value })}
              options={yearsInBusinessOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Select years"
              className={`w-100 ${errors.years_in_business ? 'is-invalid' : ''} ${isFieldLocked('years_in_business') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={isFieldLocked('years_in_business')}
            />
            {isFieldLocked('years_in_business') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Years in Business', 'years_in_business', data.years_in_business)}
              >
                Change Request
              </button>
            )}
          </div>
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
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
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
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Annual Revenue', 'annual_revenue' as any, data.annual_revenue)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.annual_revenue && <div className="invalid-feedback d-block">{errors.annual_revenue}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Annual Personal Income <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="$50,000"
              value={data.annual_personal_income ?? ''}
              onChange={(e) => onChange({ ...data, annual_personal_income: formatCurrency(e.target.value) })}
              className={`form-control ${errors.annual_personal_income ? 'is-invalid' : ''} ${isFieldLocked('annual_personal_income' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('annual_personal_income' as any)}
            />
            {isFieldLocked('annual_personal_income' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Annual Personal Income', 'annual_personal_income' as any, data.annual_personal_income)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.annual_personal_income && <div className="invalid-feedback d-block">{errors.annual_personal_income}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Average Monthly Deposits <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="$0.00"
              value={data.average_monthly_deposits ?? ''}
              onChange={(e) => onChange({ ...data, average_monthly_deposits: formatCurrency(e.target.value) })}
              className={`form-control ${errors.average_monthly_deposits ? 'is-invalid' : ''} ${isFieldLocked('average_monthly_deposits' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('average_monthly_deposits' as any)}
            />
            {isFieldLocked('average_monthly_deposits' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Average Monthly Deposits', 'average_monthly_deposits' as any, data.average_monthly_deposits)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.average_monthly_deposits && <div className="invalid-feedback d-block">{errors.average_monthly_deposits}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Number of Monthly Deposits </label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="0"
              value={data.monthly_deposit_count ?? ''}
              onChange={(e) => onChange({ ...data, monthly_deposit_count: e.target.value.replace(/[^0-9]/g, '') })}
              className={`form-control ${errors.monthly_deposit_count ? 'is-invalid' : ''} ${isFieldLocked('monthly_deposit_count' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('monthly_deposit_count' as any)}
              maxLength={5}
            />
            {isFieldLocked('monthly_deposit_count' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Number of Monthly Deposits', 'monthly_deposit_count' as any, data.monthly_deposit_count)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.monthly_deposit_count && <div className="invalid-feedback d-block">{errors.monthly_deposit_count}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Average Daily Balance (ADB)</label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="$0.00"
              value={data.avg_bank_balance ?? ''}
              onChange={(e) => onChange({ ...data, avg_bank_balance: formatCurrency(e.target.value) })}
              className={`form-control ${errors.avg_bank_balance ? 'is-invalid' : ''} ${isFieldLocked('avg_bank_balance' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('avg_bank_balance' as any)}
            />
            {isFieldLocked('avg_bank_balance' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Average Daily Balance (ADB)', 'avg_bank_balance' as any, data.avg_bank_balance)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.avg_bank_balance && <div className="invalid-feedback d-block">{errors.avg_bank_balance}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Current Business Debt</label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="$0.00"
              value={data.current_business_debt ?? ''}
              onChange={(e) => onChange({ ...data, current_business_debt: formatCurrency(e.target.value) })}
              className={`form-control ${errors.current_business_debt ? 'is-invalid' : ''} ${isFieldLocked('current_business_debt' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('current_business_debt' as any)}
            />
            {isFieldLocked('current_business_debt' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Current Business Debt', 'current_business_debt' as any, data.current_business_debt)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.current_business_debt && <div className="invalid-feedback d-block">{errors.current_business_debt}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">NSF Count</label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="0"
              value={data.nsf_count ?? ''}
              onChange={(e) => onChange({ ...data, nsf_count: e.target.value.replace(/[^0-9]/g, '') })}
              className={`form-control ${errors.nsf_count ? 'is-invalid' : ''} ${isFieldLocked('nsf_count' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('nsf_count' as any)}
              maxLength={5}
            />
            {isFieldLocked('nsf_count' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('NSF Count', 'nsf_count' as any, data.nsf_count)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.nsf_count && <div className="invalid-feedback d-block">{errors.nsf_count}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Negative Days</label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="0"
              value={data.negative_days ?? ''}
              onChange={(e) => onChange({ ...data, negative_days: e.target.value.replace(/[^0-9]/g, '') })}
              className={`form-control ${errors.negative_days ? 'is-invalid' : ''} ${isFieldLocked('negative_days' as any) ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('negative_days' as any)}
              maxLength={5}
            />
            {isFieldLocked('negative_days' as any) && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Negative Days', 'negative_days' as any, data.negative_days)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.negative_days && <div className="invalid-feedback d-block">{errors.negative_days}</div>}
        </div>

        {/* Bank Accounts Repeater Section */}
        <div className="col-12 mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 ">
              <i className="ri-bank-line me-1 align-bottom "></i> Business Bank Accounts
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-soft-primary d-flex align-items-center"
              onClick={handleAddBankAccount}
            >
              <i className="ri-add-line me-1"></i> Add Bank Account
            </button>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="text-center py-4 border border-dashed rounded bg-light">
              <p className="text-muted mb-0">No bank accounts added yet. Click "Add Bank Account" to add one.</p>
            </div>
          ) : (
            <div className="row g-3">
              {bankAccounts.map((account: any, index: number) => {
                const isSaved = !!account.id;
                const isBankNameLocked = isBankAccountFieldLocked('bank_name', account.id);
                const isDateLocked = isBankAccountFieldLocked('account_open_date', account.id);

                return (
                  <div key={account.id || `new-${index}`} className="col-12">
                    <div className="card border shadow-none mb-0 bg-light-subtle position-relative overflow-hidden">
                      <div className="card-body p-3">
                        <div className="row g-3 align-items-end">
                          {/* Bank Name */}
                          <div className="col-md-6">
                            <label className="form-label">Bank Name <span className="text-danger">*</span></label>
                            <div className="position-relative">
                              <input
                                type="text"
                                placeholder="e.g. Chase, Bank of America"
                                value={account.bank_name || ''}
                                onChange={(e) => handleBankAccountChange(index, 'bank_name', e.target.value)}
                                className={`form-control ${getRowFieldError(index, 'bank_name') ? 'is-invalid' : ''} ${isBankNameLocked ? 'bg-light border-dashed locked-field-padding' : ''}`}
                                readOnly={isBankNameLocked}
                              />
                              {isBankNameLocked && (
                                <button
                                  className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                                  type="button"
                                  onClick={() => handleOpenRequestModal('Bank Name', 'bank_name', account.bank_name, account.id, 'borrower_bank_accounts')}
                                >
                                  Change Request
                                </button>
                              )}
                            </div>
                            {getRowFieldError(index, 'bank_name') && (
                              <div className="invalid-feedback d-block">{getRowFieldError(index, 'bank_name')}</div>
                            )}
                          </div>

                          {/* Account Open Date */}
                          <div className={`col-md-${!isSaved ? '5' : '6'}`}>
                            <label className="form-label">Business Account Open Date</label>
                            <div className="position-relative">
                              <Flatpickr
                                className={`form-control ${getRowFieldError(index, 'account_open_date') ? 'is-invalid' : ''} ${isDateLocked ? 'bg-light border-dashed locked-field-padding' : ''}`}
                                value={account.account_open_date || ''}
                                onChange={(dates, dateStr) => {
                                  handleBankAccountChange(index, 'account_open_date', dateStr || null)
                                }}
                                options={{
                                  dateFormat: "Y-m-d",
                                  altInput: true,
                                  altFormat: "j M, Y",
                                  maxDate: "today",
                                  yearRange: "1900:" + new Date().getFullYear(),
                                  monthSelectorType: "dropdown",
                                  clickOpens: !isDateLocked,
                                  plugins: [yearDropdownPlugin(1900)],
                                } as any}
                                placeholder="Select account open date"
                                disabled={isDateLocked}
                              />
                              {isDateLocked && (
                                <button
                                  className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                                  type="button"
                                  onClick={() => handleOpenRequestModal('Account Open Date', 'account_open_date', account.account_open_date, account.id, 'borrower_bank_accounts')}
                                >
                                  Change Request
                                </button>
                              )}
                            </div>
                            {getRowFieldError(index, 'account_open_date') && (
                              <div className="invalid-feedback d-block">{getRowFieldError(index, 'account_open_date')}</div>
                            )}
                          </div>

                          {/* Remove button — only for unsaved (new) rows */}
                          {!isSaved && (
                            <div className="col-md-1 text-end">
                              <button
                                type="button"
                                className="btn btn-icon btn-soft-danger w-100"
                                onClick={() => handleRemoveBankAccount(index)}
                                title="Remove bank account"
                              >
                                <i className="ri-delete-bin-line fs-16"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              value={updateRequest.key === 'years_in_business'
                ? (yearsInBusinessOptions.find(opt => opt.value === updateRequest.currentValue)?.label || updateRequest.currentValue)
                : ((['monthly_revenue', 'annual_revenue', 'annual_personal_income', 'average_monthly_deposits', 'avg_bank_balance', 'current_business_debt'].includes(updateRequest.key))
                  ? formatCurrency(String(updateRequest.currentValue))
                  : updateRequest.currentValue)}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Requested New Value <span className="text-danger">*</span></label>
            {updateRequest.key === 'currency' ? (
              <CustomDropdown
                searchable={true}
                value={updateRequest.newValue}
                onChange={(val) => setUpdateRequest({ ...updateRequest, newValue: val })}
                options={currencyOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select currency"
                className={`w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
              />
            ) : updateRequest.key === 'years_in_business' ? (
              <CustomDropdown
                searchable={true}
                value={updateRequest.newValue}
                onChange={(val) => setUpdateRequest({ ...updateRequest, newValue: val })}
                options={yearsInBusinessOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select years"
                className={`w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
              />
            ) : updateRequest.key === 'account_open_date' ? (
              <Flatpickr
                className={`form-control w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
                value={updateRequest.newValue}
                onChange={(dates, dateStr) => setUpdateRequest({ ...updateRequest, newValue: dateStr })}
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "j M, Y",
                  maxDate: "today",
                  monthSelectorType: "dropdown",
                  static: true,
                  plugins: [yearDropdownPlugin(1900)],
                }}
                placeholder="Select account open date"
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                className={`form-control w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
                placeholder={`Enter the updated ${updateRequest.label}`}
                value={updateRequest.newValue}
                maxLength={['nsf_count', 'negative_days', 'monthly_deposit_count'].includes(updateRequest.key) ? 5 : undefined}
                onChange={(e) => {
                  let val = e.target.value;
                  if (updateRequest.key === 'monthly_revenue' || updateRequest.key === 'annual_revenue' || updateRequest.key === 'annual_personal_income') {
                    val = formatCurrency(val);
                  } else if (['nsf_count', 'negative_days', 'monthly_deposit_count'].includes(updateRequest.key)) {
                    val = val.replace(/[^0-9]/g, '');
                  }
                  setUpdateRequest({ ...updateRequest, newValue: val });
                }}
              />
            )}
            {modalErrors.new_value && (
              <div className="invalid-feedback d-block mt-1">
                {Array.isArray(modalErrors.new_value) ? modalErrors.new_value[0] : modalErrors.new_value}
              </div>
            )}
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
              let finalNewValue = updateRequest.newValue;
              if (updateRequest.key === 'monthly_revenue' || updateRequest.key === 'annual_revenue' || updateRequest.key === 'annual_personal_income') {
                finalNewValue = unformatCurrency(finalNewValue);
              }

              submitChange({
                field_name: updateRequest.key,
                new_value: finalNewValue,
                entity_id: updateRequest.entityId,
                entity_type: updateRequest.entityType,
              }, {
                onSuccess: (response) => {
                  if (response.status) {
                    toast.success(response.message);
                    toggleModal();
                  } else {
                    if (response.errors) {
                      setModalErrors(response.errors);
                    } else {
                      toast.error(response.message);
                    }
                  }
                },
                onError: (error: any) => {
                  if (error.response?.data?.errors) {
                    setModalErrors(error.response.data.errors);
                  } else {
                    toast.error('Failed to submit change request');
                  }
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
