import React, { useState, useRef, useEffect } from 'react'

interface Option {
  [key: string]: any
}

interface CustomDropdownProps {
  options: Option[]
  value: string | number
  onChange: (value: any) => void
  optionLabel: string
  optionValue: string
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  className?: string
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  optionLabel,
  optionValue,
  placeholder = 'Select...',
  searchable = false,
  disabled = false,
  className = ''
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find selected option object
  const selectedOption = options.find(opt => opt[optionValue] === value)

  // Filter options based on search
  const filteredOptions = searchable
    ? options.filter(opt => 
        String(opt[optionLabel]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <button
        className={`form-select text-start d-flex justify-content-between align-items-center ${isOpen ? 'show' : ''}`}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span className={!selectedOption ? 'text-muted' : ''}>
          {selectedOption ? selectedOption[optionLabel] : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="dropdown-menu show w-100 p-0" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          {searchable && (
            <div className="p-2 sticky-top bg-white border-bottom">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          
          <div className="list-group list-group-flush">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`list-group-item list-group-item-action border-0 ${option[optionValue] === value ? 'active' : ''}`}
                  onClick={() => {
                    onChange(option[optionValue])
                    setIsOpen(false)
                  }}
                >
                  {option[optionLabel]}
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-muted">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
