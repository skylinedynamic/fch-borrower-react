import React from 'react'
import { AppProviders } from './AppProviders'
// PrimeReact styles
import 'primereact/resources/themes/saga-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
// PrimeReact <Calendar> panel in the app's calendar design. JS-imported CSS is
// emitted after index.html's <link>s, so this also wins over custom.min.css.
import '../assets/css/primereact-calendar.css'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { loadLocations } from './modules/location'
import { applyCalendarLocale } from './config/calendarLocale'
import { applyFlatpickrDefaults } from './config/flatpickrDefaults'

// Before anything renders, so every PrimeReact calendar heads its columns SUN MON ...
applyCalendarLocale()
// ...and every Flatpickr picker shows the app calendar on phones too, not the
// browser's native date input.
applyFlatpickrDefaults()

const container = document.getElementById('root')
const root = createRoot(container)

const render = () =>
  root.render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>
  )

// Countries, states and cities come from the API now, and every address field
// reads them synchronously the way they read the old hardcoded file. Loading
// before the first render preserves that contract, and avoids dropdowns that
// populate a moment after they appear.
//
// A failure still renders. The response is cached for an hour and this is
// reference data, so an empty country list is a far better outcome than a blank
// application; anything that needs it can retry through loadLocations().
loadLocations()
  .catch((err) => console.error('Failed to load location data', err))
  .finally(render)
