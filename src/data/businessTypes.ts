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
