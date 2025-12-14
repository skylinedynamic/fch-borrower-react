import React, { useState, useMemo, useEffect } from 'react'
import { SaveFinancialInfoRequest, ValidationErrors } from '../../../modules/profile/types'
import CustomDropdown from './CustomDropdown'
import { countries as countriesData } from '../../../data/countries'
import { yearsInBusinessOptions } from '../../../data/profile'
import { useFinancialInfo, useSaveFinancialInfo } from '../../../modules/profile/queries'
import { toast } from 'react-toastify'
import TabLoader from '../../../components/Loader/TabLoader'

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

  const handleSave = () => {
    setErrors({})
    const payload: SaveFinancialInfoRequest = {
      currency: data.currency,
      years_in_business: data.years_in_business,
      monthly_revenue: parseFloat(data.monthly_revenue) || 0,
      annual_revenue: parseFloat(data.annual_revenue) || 0,
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
        monthly_revenue: apiData.monthly_revenue,
        annual_revenue: apiData.annual_revenue,
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
          <input 
            type="text" 
            placeholder="$20,000" 
            value={data.monthly_revenue} 
            onChange={(e) => onChange({ ...data, monthly_revenue: e.target.value })} 
            className={`form-control ${errors.monthly_revenue ? 'is-invalid' : ''}`}
          />
          {errors.monthly_revenue && <div className="invalid-feedback">{errors.monthly_revenue}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Annual Revenue <span className="text-danger">*</span></label>
          <input 
            type="text" 
            placeholder="$30,000" 
            value={data.annual_revenue} 
            onChange={(e) => onChange({ ...data, annual_revenue: e.target.value })} 
            className={`form-control ${errors.annual_revenue ? 'is-invalid' : ''}`}
          />
          {errors.annual_revenue && <div className="invalid-feedback">{errors.annual_revenue}</div>}
        </div>
        <div className="col-12 d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-warning" onClick={onBack}>Previous</button>
          <button type="button" className="btn primary-btn" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
