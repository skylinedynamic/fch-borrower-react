import { useState, useEffect, useRef } from 'react'
import { usePreQualification, useSubmitPersonalInfo, useSubmitBusinessInfo, useSubmitFundingInfo, useSubmitPreQualification } from '../../../modules/pre-qualification'
import type { PersonalInfo, BusinessDetails, FinancialSupport } from '../../../modules/pre-qualification'
import { countries } from '../../../data/countries'
import { formatCurrency, unformatCurrency } from '../../../utils/formatters'
import { FUNDING_PURPOSE_OTHER } from '../../../data/profile'

export const usePreQualificationForm = () => {
  const [step, setStep] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [mobileOpenIdx, setMobileOpenIdx] = useState<number | null>(0)
  const [maxStepReached, setMaxStepReached] = useState<number>(0)
  const [preQualId, setPreQualId] = useState<string | null>(null)

  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({})
  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>({})
  const [fundingErrors, setFundingErrors] = useState<Record<string, string>>({})

  const { data: apiData, isLoading } = usePreQualification()
  const submitPersonalInfoMutation = useSubmitPersonalInfo()
  const submitBusinessInfoMutation = useSubmitBusinessInfo()
  const submitFundingInfoMutation = useSubmitFundingInfo()
  const submitPreQualificationMutation = useSubmitPreQualification()

  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: 'USA (+1)',
    phoneNumber: '',
    businessWebsite: '',
    stateOfIncorporation: '',
  })

  const [business, setBusiness] = useState<BusinessDetails>({
    businessName: '',
    industryType: '',
    businessStructure: '',
    yearsInBusiness: '',
    annualRevenue: '',
    monthlyRevenue: '',
  })

  const [support, setSupport] = useState<FinancialSupport>({
    fundingRequestedAmount: '',
    fundingUrgency: '',
    purposeOfFunding: '',
    personalCreditScore: '',
    estimatedBusinessCreditScore: '',
    existingBusinessDebt: false,
    debtBalance: '',
    purposeNote: '',
    notes: '',
  })

  // Refs to track initial values for change detection
  const initialPersonalRef = useRef<PersonalInfo | null>(null)
  const initialBusinessRef = useRef<BusinessDetails | null>(null)
  const initialSupportRef = useRef<FinancialSupport | null>(null)

  useEffect(() => {
    if (apiData) {
      if (apiData.id) {
        setPreQualId(apiData.id)
      }
      let countryCode = 'USA (+1)'
      if (apiData.country) {
        const country = countries.find(c => c.name === apiData.country)
        if (country) {
          countryCode = `${country.code} (${country.phone_code})`
        }
      }

      setPersonal({
        firstName: apiData.first_name || '',
        lastName: apiData.last_name || '',
        email: apiData.email || '',
        countryCode: countryCode,
        phoneNumber: apiData.phone_number || '',
        businessWebsite: apiData.business_website || '',
        stateOfIncorporation: apiData.state_of_incorporation || '',
      })

      setBusiness({
        businessName: apiData.business_name || '',
        industryType: apiData.industry_type || '',
        businessStructure: apiData.business_structure || '',
        yearsInBusiness: apiData.years_in_business || '',
        annualRevenue: apiData.annual_revenue ? formatCurrency(apiData.annual_revenue.toString()) : '',
        monthlyRevenue: apiData.monthly_revenue ? formatCurrency(apiData.monthly_revenue.toString()) : '',
      })

      setSupport({
        fundingRequestedAmount: apiData.funding_requested_amount ? formatCurrency(apiData.funding_requested_amount.toString()) : '',
        fundingUrgency: apiData.funding_urgency || '',
        purposeOfFunding: apiData.purpose_of_funding || '',
        personalCreditScore: apiData.personal_credit_score || '',
        estimatedBusinessCreditScore: apiData.estimated_business_credit_score || '',
        notes: apiData.notes || '',
        existingBusinessDebt: apiData.existing_business_debt,
        debtBalance: apiData.debt_balance ? formatCurrency(apiData.debt_balance.toString()) : '',
        purposeNote: apiData.purpose_note || '',
      })

      setLoading(false)

      // Store initial values after data is loaded
      setTimeout(() => {
        initialPersonalRef.current = {
          firstName: apiData.first_name || '',
          lastName: apiData.last_name || '',
          email: apiData.email || '',
          countryCode: countryCode,
          phoneNumber: apiData.phone_number || '',
          businessWebsite: apiData.business_website || '',
          stateOfIncorporation: apiData.state_of_incorporation || '',
        }
        initialBusinessRef.current = {
          businessName: apiData.business_name || '',
          industryType: apiData.industry_type || '',
          businessStructure: apiData.business_structure || '',
          yearsInBusiness: apiData.years_in_business || '',
          annualRevenue: apiData.annual_revenue ? formatCurrency(apiData.annual_revenue.toString()) : '',
          monthlyRevenue: apiData.monthly_revenue ? formatCurrency(apiData.monthly_revenue.toString()) : '',
        }
        initialSupportRef.current = {
          fundingRequestedAmount: apiData.funding_requested_amount ? formatCurrency(apiData.funding_requested_amount.toString()) : '',
          fundingUrgency: apiData.funding_urgency || '',
          purposeOfFunding: apiData.purpose_of_funding || '',
          personalCreditScore: apiData.personal_credit_score || '',
          estimatedBusinessCreditScore: apiData.estimated_business_credit_score || '',
          existingBusinessDebt: apiData.existing_business_debt,
          debtBalance: apiData.debt_balance ? formatCurrency(apiData.debt_balance.toString()) : '',
          purposeNote: apiData.purpose_note || '',
          notes: apiData.notes || '',
        }
      }, 100)
    } else if (!isLoading) {
      setLoading(false)
    }
  }, [apiData, isLoading])

  const handlePersonalInfoSubmit = async (navigateToStep?: number) => {
    // Check if any required field is empty
    const hasEmptyFields = !personal.firstName.trim() ||
      !personal.lastName.trim() ||
      !personal.email.trim() ||
      !personal.phoneNumber.trim() ||
      !personal.stateOfIncorporation.trim()

    // Check if any field has changed
    const hasChanged = initialPersonalRef.current === null ||
      personal.firstName !== initialPersonalRef.current.firstName ||
      personal.lastName !== initialPersonalRef.current.lastName ||
      personal.email !== initialPersonalRef.current.email ||
      personal.phoneNumber !== initialPersonalRef.current.phoneNumber ||
      personal.businessWebsite !== initialPersonalRef.current.businessWebsite ||
      personal.stateOfIncorporation !== initialPersonalRef.current.stateOfIncorporation

    // Only call API if fields are empty OR changed
    if (!hasEmptyFields && !hasChanged) {
      setPersonalErrors({})
      setMaxStepReached(Math.max(maxStepReached, 1))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 1
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      return
    }

    try {
      const response = await submitPersonalInfoMutation.mutateAsync({
        id: preQualId,
        first_name: personal.firstName,
        last_name: personal.lastName,
        email: personal.email,
        phone_number: personal.phoneNumber,
        business_website: personal.businessWebsite || undefined,
        state_of_incorporation: personal.stateOfIncorporation,
      })

      if (response?.id) {
        setPreQualId(response.id)
      }

      setPersonalErrors({})
      setMaxStepReached(Math.max(maxStepReached, 1))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 1
      setStep(nextStep)
      setMobileOpenIdx(nextStep)

      initialPersonalRef.current = { ...personal }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const mappedErrors: Record<string, string> = {}
        const errorKeyMap: Record<string, string> = {
          'first_name': 'firstName',
          'last_name': 'lastName',
          'email': 'email',
          'phone_number': 'phoneNumber',
          'business_website': 'businessWebsite',
          'state_of_incorporation': 'stateOfIncorporation'
        }
        Object.keys(apiErrors).forEach(key => {
          const mappedKey = errorKeyMap[key] || key
          mappedErrors[mappedKey] = typeof apiErrors[key] === 'string' ? apiErrors[key] : apiErrors[key][0]
        })
        setPersonalErrors(mappedErrors)
      }
    }
  }

  const handleBusinessInfoSubmit = async (navigateToStep?: number) => {
    const hasEmptyFields = !business.businessName.trim() ||
      !business.industryType.trim() ||
      !business.businessStructure.trim() ||
      !business.yearsInBusiness.trim() ||
      !business.monthlyRevenue.trim() ||
      !business.annualRevenue.trim()

    const hasChanged = initialBusinessRef.current === null ||
      business.businessName !== initialBusinessRef.current.businessName ||
      business.industryType !== initialBusinessRef.current.industryType ||
      business.businessStructure !== initialBusinessRef.current.businessStructure ||
      business.yearsInBusiness !== initialBusinessRef.current.yearsInBusiness ||
      business.monthlyRevenue !== initialBusinessRef.current.monthlyRevenue ||
      business.annualRevenue !== initialBusinessRef.current.annualRevenue

    if (!hasEmptyFields && !hasChanged) {
      setBusinessErrors({})
      setMaxStepReached(Math.max(maxStepReached, 2))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 2
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      return
    }
    try {
      const monthlyRevenue = business.monthlyRevenue.trim() ? parseFloat(unformatCurrency(business.monthlyRevenue)) || null : null
      const annualRevenue = business.annualRevenue.trim() ? parseFloat(unformatCurrency(business.annualRevenue)) || null : null

      await submitBusinessInfoMutation.mutateAsync({
        id: preQualId,
        business_name: business.businessName,
        industry_type: business.industryType,
        business_structure: business.businessStructure,
        monthly_revenue: monthlyRevenue,
        annual_revenue: annualRevenue,
        years_in_business: business.yearsInBusiness
      })
      setBusinessErrors({})
      setMaxStepReached(Math.max(maxStepReached, 2))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 2
      setStep(nextStep)
      setMobileOpenIdx(nextStep)

      initialBusinessRef.current = { ...business }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const mappedErrors: Record<string, string> = {}
        const errorKeyMap: Record<string, string> = {
          'business_name': 'businessName',
          'industry_type': 'industryType',
          'business_structure': 'businessStructure',
          'monthly_revenue': 'monthlyRevenue',
          'annual_revenue': 'annualRevenue',
          'years_in_business': 'yearsInBusiness'
        }
        Object.keys(apiErrors).forEach(key => {
          const mappedKey = errorKeyMap[key] || key
          mappedErrors[mappedKey] = typeof apiErrors[key] === 'string' ? apiErrors[key] : apiErrors[key][0]
        })
        setBusinessErrors(mappedErrors)
      }
    }
  }

  const handleFundingInfoSubmit = async (navigateToStep?: number) => {
    const hasEmptyFields = !support.fundingRequestedAmount.trim() ||
      !support.fundingUrgency.trim() ||
      !support.purposeOfFunding.trim() ||
      !support.personalCreditScore.trim() ||
      !support.estimatedBusinessCreditScore.trim() ||
      (support.existingBusinessDebt && !support.debtBalance.trim()) ||
      (support.purposeOfFunding === FUNDING_PURPOSE_OTHER && !support.purposeNote.trim())

    const hasChanged = initialSupportRef.current === null ||
      support.fundingRequestedAmount !== initialSupportRef.current.fundingRequestedAmount ||
      support.fundingUrgency !== initialSupportRef.current.fundingUrgency ||
      support.purposeOfFunding !== initialSupportRef.current.purposeOfFunding ||
      support.personalCreditScore !== initialSupportRef.current.personalCreditScore ||
      support.estimatedBusinessCreditScore !== initialSupportRef.current.estimatedBusinessCreditScore ||
      support.existingBusinessDebt !== initialSupportRef.current.existingBusinessDebt ||
      support.debtBalance !== initialSupportRef.current.debtBalance ||
      support.purposeNote !== initialSupportRef.current.purposeNote ||
      support.notes !== initialSupportRef.current.notes

    if (!hasEmptyFields && !hasChanged) {
      setFundingErrors({})
      setMaxStepReached(Math.max(maxStepReached, 3))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 3
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      return
    }
    try {
      const fundingAmount = support.fundingRequestedAmount.trim() ? parseFloat(unformatCurrency(support.fundingRequestedAmount)) : null
      const debtBalance = support.debtBalance.trim() ? parseFloat(unformatCurrency(support.debtBalance)) : null

      await submitFundingInfoMutation.mutateAsync({
        id: preQualId,
        funding_requested_amount: fundingAmount,
        funding_urgency: support.fundingUrgency,
        purpose_of_funding: support.purposeOfFunding,
        personal_credit_score: support.personalCreditScore,
        estimated_business_credit_score: support.estimatedBusinessCreditScore,
        existing_business_debt: support.existingBusinessDebt,
        debt_balance: debtBalance,
        purpose_note: support.purposeOfFunding === FUNDING_PURPOSE_OTHER ? support.purposeNote : null,
        notes: support.notes
      })
      setFundingErrors({})
      setMaxStepReached(Math.max(maxStepReached, 3))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 3
      setStep(nextStep)
      setMobileOpenIdx(nextStep)

      initialSupportRef.current = { ...support }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const mappedErrors: Record<string, string> = {}
        const errorKeyMap: Record<string, string> = {
          'funding_requested_amount': 'fundingRequestedAmount',
          'funding_urgency': 'fundingUrgency',
          'purpose_of_funding': 'purposeOfFunding',
          'personal_credit_score': 'personalCreditScore',
          'estimated_business_credit_score': 'estimatedBusinessCreditScore',
          'existing_business_debt': 'existingBusinessDebt',
          'debt_balance': 'debtBalance',
          'purpose_note': 'purposeNote',
          'notes': 'notes'
        }
        Object.keys(apiErrors).forEach(key => {
          const mappedKey = errorKeyMap[key] || key
          mappedErrors[mappedKey] = typeof apiErrors[key] === 'string' ? apiErrors[key] : apiErrors[key][0]
        })
        setFundingErrors(mappedErrors)
      }
    }
  }

  const handleTabClick = async (targetStep: number) => {
    if (targetStep === step) return

    if (step === 0 && targetStep !== 0) {
      await handlePersonalInfoSubmit(targetStep)
      return
    } else if (step === 1 && targetStep !== 1) {
      await handleBusinessInfoSubmit(targetStep)
      return
    } else if (step === 2 && targetStep !== 2) {
      await handleFundingInfoSubmit(targetStep)
      return
    }

    setStep(targetStep)
    setMobileOpenIdx(mobileOpenIdx === targetStep ? null : targetStep)
  }

  const handleFinalSubmit = async () => {
    let currentId = preQualId

    // If no draft exists yet (e.g. fields unchanged from profile), create ON_HOLD draft first
    if (!currentId) {
      try {
        const draftRes = await submitPersonalInfoMutation.mutateAsync({
          first_name: personal.firstName,
          last_name: personal.lastName,
          email: personal.email,
          phone_number: personal.phoneNumber,
          business_website: personal.businessWebsite || undefined,
          state_of_incorporation: personal.stateOfIncorporation,
        })
        currentId = draftRes?.id || (draftRes as any)?.data?.id
        if (currentId) {
          setPreQualId(currentId)
        }
      } catch (err) {
        console.error('Failed to create initial pre-qualification draft', err)
        throw err
      }
    }

    if (!currentId) {
      throw new Error('Unable to create or locate pre-qualification draft to submit.')
    }

    try {
      const response = await submitPreQualificationMutation.mutateAsync({
        id: currentId
      })
      return response
    } catch (error) {
      console.error('Failed to submit pre-qualification', error)
      throw error
    }
  }

  return {
    step,
    setStep,
    loading,
    mobileOpenIdx,
    setMobileOpenIdx,
    personal,
    setPersonal,
    business,
    setBusiness,
    support,
    setSupport,
    personalErrors,
    businessErrors,
    fundingErrors,
    handlePersonalInfoSubmit,
    handleBusinessInfoSubmit,
    handleFundingInfoSubmit,
    handleTabClick,
    submitPersonalInfoMutation,
    submitBusinessInfoMutation,
    submitFundingInfoMutation,
    handleFinalSubmit,
    submitPreQualificationMutation,
    preQualId,
  }
}
