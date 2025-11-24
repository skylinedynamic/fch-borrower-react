import React, { useEffect, useState, useRef } from 'react'
import { Calendar } from 'primereact/calendar'
import CustomDropdown from '../../../components/CustomDropdown'
import { PersonalInfo as PersonalInfoType } from '../types'
import { usePersonalInfo } from '../../../modules/profile'
import type { PersonalInfoData } from '../../../modules/profile'
import TabLoader from '../../../components/Loader/TabLoader'
import countriesData from '../../../data/countries.json'

interface PersonalInfoProps {
  data: PersonalInfoType
  onChange: (data: PersonalInfoType) => void
  onSave: () => void
}

type StateType = {
  name: string
  code: string
  cities?: string[]
}

type CityType = {
  name: string
  code: string
}

// Helper function to transform API data to component format
const transformApiToComponent = (apiData: PersonalInfoData): PersonalInfoType => {
  return {
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    email: apiData.email || '',
    phoneCountry: apiData.phone_number || '',
    phoneNumber: apiData.phone_number || '',
    country: apiData.country || '',
    city: apiData.city || '',
    state: apiData.state || '',
    zip: apiData.zip_code || '',
    address: apiData.home_address || '',
    homeCountry: apiData.home_phone || '',
    homePhone: apiData.home_phone || '',
    dob: apiData.date_of_birth || '',
    last4ssn: apiData.last_4_ssn || '',
  }
}

export default function PersonalInfo({ data, onChange, onSave }: PersonalInfoProps) {
  const { data: apiData, isLoading, error } = usePersonalInfo()
  const [availableStates, setAvailableStates] = useState<StateType[]>([])
  const [availableCities, setAvailableCities] = useState<CityType[]>([])
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false)
  const [homePhoneDropdownOpen, setHomePhoneDropdownOpen] = useState(false)
  
  const phoneDropdownRef = useRef<HTMLDivElement>(null)
  const homePhoneDropdownRef = useRef<HTMLDivElement>(null)
  
  // Helper to find country by code or phone code (fallback)
  const getCountry = (value: string) => {
    return countriesData.find(c => c.code === value) || 
           countriesData.find(c => c.phone_code === value) || 
           countriesData[0]
  }

  const selectedPhoneCountry = getCountry(data.phoneCountry)
  const selectedHomeCountry = getCountry(data.homeCountry)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
        setPhoneDropdownOpen(false)
      }
      if (homePhoneDropdownRef.current && !homePhoneDropdownRef.current.contains(event.target as Node)) {
        setHomePhoneDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update available states when country changes
  useEffect(() => {
    if (data.country) {
      const selectedCountry = countriesData.find(c => c.name === data.country || c.code === data.country)
      if (selectedCountry) {
        setAvailableStates(selectedCountry.states)
      } else {
        setAvailableStates([])
      }
    } else {
      setAvailableStates([])
    }
  }, [data.country])

  // Update available cities when state changes
  useEffect(() => {
    if (data.state && availableStates.length > 0) {
      const selectedState = availableStates.find(s => s.name === data.state || s.code === data.state)
      if (selectedState && selectedState.cities) {
        setAvailableCities(selectedState.cities.map(city => ({ name: city, code: city })))
      } else {
        setAvailableCities([])
      }
    } else {
      setAvailableCities([])
    }
  }, [data.state, availableStates])

  // Update component state when API data is loaded
  useEffect(() => {
    if (apiData) {
      const transformedData = transformApiToComponent(apiData)
      onChange(transformedData)
    }
  }, [apiData])

  if (isLoading) {
    return <TabLoader />
  }

  if (error) {
    return (
      <div className="fade-panel">
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error Loading Profile</h5>
          <p className="mb-0">Unable to load your personal information. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-panel">
      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First Name <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter first name" 
            value={data.firstName}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            required 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter last name" 
            value={data.lastName}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            required 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email <span className="text-danger">*</span></label>
          <input 
            type="email" 
            className="form-control" 
            placeholder="Enter email id" 
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            required 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone Number <span className="text-danger">*</span></label>
          <div className="input-group">
            <div className="dropdown position-relative" ref={phoneDropdownRef}>
              <button 
                className="btn btn-light border dropdown-toggle" 
                type="button" 
                onClick={() => setPhoneDropdownOpen(!phoneDropdownOpen)}
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              >
                <span className="me-1">{selectedPhoneCountry.code}</span>
                <span className="text-muted">{selectedPhoneCountry.phone_code}</span>
              </button>
              {phoneDropdownOpen && (
                <ul className="dropdown-menu show position-absolute" style={{ maxHeight: '220px', overflowY: 'auto', minWidth: '200px' }}>
                  {countriesData.map((country, idx) => (
                    <li key={idx}>
                      <button
                        className="dropdown-item d-flex justify-content-between align-items-center"
                        type="button"
                        onClick={() => {
                          onChange({ ...data, phoneCountry: country.code })
                          setPhoneDropdownOpen(false)
                        }}
                      >
                        <span className="fw-medium">{country.code}</span>
                        <span className="text-muted ms-2">{country.phone_code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input 
              type="tel" 
              className="form-control" 
              placeholder="Enter number" 
              value={data.phoneNumber}
              onChange={(e) => onChange({ ...data, phoneNumber: e.target.value })}
              required 
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Country <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.country}
            onChange={(value) => {
              onChange({ 
                ...data, 
                country: value,
                state: '', // Reset state when country changes
                city: '' // Reset city when country changes
              })
            }}
            options={countriesData}
            optionLabel="name"
            optionValue="name"
            placeholder="Select country"
            searchable={true}
            className="w-100"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.state}
            onChange={(value) => {
              onChange({ 
                ...data, 
                state: value,
                city: '' // Reset city when state changes
              })
            }}
            options={availableStates}
            optionLabel="name"
            optionValue="name"
            placeholder="Select state"
            searchable={true}
            className="w-100"
            disabled={!data.country}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">City <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.city}
            onChange={(value) => onChange({ ...data, city: value })}
            options={availableCities}
            optionLabel="name"
            optionValue="name"
            placeholder="Select city"
            searchable={true}
            className="w-100"
            disabled={!data.state}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter zip code" 
            value={data.zip}
            onChange={(e) => onChange({ ...data, zip: e.target.value })}
            required 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Home Address <span className="text-danger">*</span></label>
          <textarea 
            className="form-control" 
            placeholder="Enter address" 
            rows={1} 
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            required 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Home Phone <span className="text-danger">*</span></label>
          <div className="input-group">
            <div className="dropdown position-relative" ref={homePhoneDropdownRef}>
              <button 
                className="btn btn-light border dropdown-toggle" 
                type="button" 
                onClick={() => setHomePhoneDropdownOpen(!homePhoneDropdownOpen)}
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              >
                <span className="me-1">{selectedHomeCountry.code}</span>
                <span className="text-muted">{selectedHomeCountry.phone_code}</span>
              </button>
              {homePhoneDropdownOpen && (
                <ul className="dropdown-menu show position-absolute" style={{ maxHeight: '220px', overflowY: 'auto', minWidth: '200px' }}>
                  {countriesData.map((country, idx) => (
                    <li key={idx}>
                      <button
                        className="dropdown-item d-flex justify-content-between align-items-center"
                        type="button"
                        onClick={() => {
                          onChange({ ...data, homeCountry: country.code })
                          setHomePhoneDropdownOpen(false)
                        }}
                      >
                        <span className="fw-medium">{country.code}</span>
                        <span className="text-muted ms-2">{country.phone_code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input 
              type="tel" 
              className="form-control" 
              placeholder="Enter number" 
              value={data.homePhone}
              onChange={(e) => onChange({ ...data, homePhone: e.target.value })}
              required 
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
          <Calendar
            value={data.dob ? new Date(data.dob) : null}
            onChange={(e) => {
              if (e.value) {
                // Format date as YYYY-MM-DD
                const date = e.value as Date
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                onChange({ ...data, dob: `${year}-${month}-${day}` })
              } else {
                onChange({ ...data, dob: '' })
              }
            }}
            dateFormat="yy-mm-dd"
            className="w-100"
            placeholder="Select date"
            showIcon
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last 4 SSN <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter last 4 ssn number" 
            value={data.last4ssn}
            onChange={(e) => onChange({ ...data, last4ssn: e.target.value })}
            required 
          />
        </div>
        <div className="col-12 d-flex justify-content-end mt-4">
          <button type="button" className="btn primary-btn" onClick={onSave}>Save Changes</button>
        </div>
      </form>
    </div>
  )
}
