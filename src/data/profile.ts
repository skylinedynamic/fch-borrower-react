export interface OptionType {
  label: string
  value: string
}

export const entityTypes: OptionType[] = [
  { label: 'LLC', value: 'LLC' },
  { label: 'S-Corporation', value: 'S-Corporation' },
  { label: 'Corporation', value: 'Corporation' },
  { label: 'Sole Proprietorship', value: 'Sole Proprietorship' },
  { label: 'Partnership', value: 'Partnership' },
  { label: 'PLLC', value: 'PLLC' },
  { label: 'Public Corporation', value: 'Public Corporation' },
  { label: 'Other', value: 'Other' }
]

export const industryTypes: OptionType[] = [
  { label: 'Accounting & Financial Services', value: 'Accounting & Financial Services' },
  { label: 'Automotive Services & Dealerships', value: 'Automotive Services & Dealerships' },
  { label: 'Beauty, Salon & Spa Services', value: 'Beauty, Salon & Spa Services' },
  { label: 'Cannabis / CBD Industry', value: 'Cannabis / CBD Industry' },
  { label: 'Childcare & Daycare', value: 'Childcare & Daycare' },
  { label: 'Cleaning & Janitorial Services', value: 'Cleaning & Janitorial Services' },
  { label: 'Construction & Contracting', value: 'Construction & Contracting' },
  { label: 'E-Commerce / Online Retail', value: 'E-Commerce / Online Retail' },
  { label: 'Education & Tutoring Services', value: 'Education & Tutoring Services' },
  { label: 'Fitness & Wellness (Gyms, Yoga, Etc.)', value: 'Fitness & Wellness (Gyms, Yoga, Etc.)' },
  { label: 'Franchise Businesses', value: 'Franchise Businesses' },
  { label: 'Government Contractor / Vendor', value: 'Government Contractor / Vendor' },
  { label: 'Healthcare & Medical Practices', value: 'Healthcare & Medical Practices' },
  { label: 'Home Services (Plumbing, HVAC, Landscaping, etc.)', value: 'Home Services (Plumbing, HVAC, Landscaping, etc.)' },
  { label: 'Hospitality (Hotels / Lodging)', value: 'Hospitality (Hotels / Lodging)' },
  { label: 'IT & Software Development', value: 'IT & Software Development' },
  { label: 'Legal & Professional Services', value: 'Legal & Professional Services' },
  { label: 'Manufacturing & Wholesale', value: 'Manufacturing & Wholesale' },
  { label: 'Marketing, Advertising & Media', value: 'Marketing, Advertising & Media' },
  { label: 'Non-Profit Organization', value: 'Non-Profit Organization' },
  { label: 'Real Estate & Property Management', value: 'Real Estate & Property Management' },
  { label: 'Restaurants, Bars & Catering', value: 'Restaurants, Bars & Catering' },
  { label: 'Retail (Brick & Mortar)', value: 'Retail (Brick & Mortar)' },
  { label: 'Transportation & Logistics', value: 'Transportation & Logistics' },
  { label: 'Other', value: 'Other' }
]

export const yearsInBusinessOptions: OptionType[] = [
  { label: 'Under 6 months', value: 'Under 6 months' },
  { label: '6-12 months', value: '6-12 months' },
  { label: '1-2 years', value: '1-2 years' },
  { label: '2-3 years', value: '2-3 years' },
  { label: '3+ years', value: '3+ years' }
]

export const fundingUrgencyOptions: OptionType[] = [
  { label: 'Immediate', value: 'Immediate' },
  { label: 'Within 30 days', value: 'Within 30 days' },
  { label: '1-3 months', value: '1-3 months' },
  { label: 'Flexible', value: 'Flexible' }
]

export const purposeOfFundingOptions: OptionType[] = [
  { label: 'Working Capital', value: 'Working Capital' },
  { label: 'Equipment', value: 'Equipment' },
  { label: 'Inventory', value: 'Inventory' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Expansion', value: 'Expansion' },
  { label: 'Other', value: 'Other' }
]

export const personalCreditScoreOptions: OptionType[] = [
  { label: 'Poor (<580)', value: 'Poor (<580)' },
  { label: 'Fair (580-669)', value: 'Fair (580-669)' },
  { label: 'Good (670-739)', value: 'Good (670-739)' },
  { label: 'Very Good (740-799)', value: 'Very Good (740-799)' },
  { label: 'Excellent (800+)', value: 'Excellent (800+)' }
]

export const estimatedBusinessCreditScoreOptions: OptionType[] = [
  { label: 'No Business Credit', value: 'No Business Credit' },
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' }
]

export const citizenshipOptions: OptionType[] = [
  { label: 'US Citizen', value: 'US Citizen' },
  { label: 'Permanent Resident', value: 'Permanent Resident' },
  { label: 'Other', value: 'Other' }
]

export const selfReportedCreditScoreOptions: OptionType[] = [
  { label: 'Below 600', value: 'Below 600' },
  { label: '600-649', value: '600-649' },
  { label: '650-699', value: '650-699' },
  { label: '700-749', value: '700-749' },
  { label: '750+', value: '750+' },
]

export const selfReportedBusinessCreditScoreOptions: OptionType[] = [
  { label: 'Not established yet', value: 'Not established yet' },
  { label: 'Not sure', value: 'Not sure' },
  { label: '0-49', value: '0-49' },
  { label: '50-64', value: '50-64' },
  { label: '65-74', value: '65-74' },
  { label: '75-79', value: '75-79' },
  { label: '80-100', value: '80-100' },
]

export const fundingTypeOptions: OptionType[] = [
  { label: 'Term Loan', value: 'Term Loan' },
  { label: 'Line of Credit', value: 'Line of Credit' },
  { label: 'Equipment Financing', value: 'Equipment Financing' },
  { label: 'SBA Loan', value: 'SBA Loan' },
  { label: 'Merchant Cash Advance', value: 'Merchant Cash Advance' },
]

export const timeframeOptions: OptionType[] = [
  { label: 'Immediately', value: 'Immediately' },
  { label: '1-2 Weeks', value: '1-2 Weeks' },
  { label: '1 Month', value: '1 Month' },
  { label: 'Flexible', value: 'Flexible' },
]

export const collateralOptions: OptionType[] = [
  { label: 'None', value: 'None' },
  { label: 'Business Assets', value: 'Business Assets' },
  { label: 'Real Estate', value: 'Real Estate' },
  { label: 'Equipment', value: 'Equipment' },
  { label: 'Inventory', value: 'Inventory' },
]
