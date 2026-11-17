import { bandForFrequency } from './bands'
import type { Contact, ContactDetails } from './model'

const PHONE_MODES = ['SSB', 'USB', 'LSB', 'AM', 'FM']
const TONE_MODES = ['CW', 'RTTY']

export function buildContact(details: ContactDetails): Contact {
  const now = new Date().toISOString()
  const mode = details.mode.trim().toUpperCase()
  const frequency = details.frequency ?? null

  return {
    callsign: details.callsign.trim().toUpperCase(),
    operatorName: details.operatorName ?? null,
    date: details.date ?? now.slice(0, 10),
    time: details.time ?? now.slice(11, 16),
    frequency,
    band: details.band ?? (frequency ? bandForFrequency(frequency) : null),
    mode,
    rst: details.rst ?? defaultReport(mode)
  }
}

function defaultReport(mode: string): string | null {
  if (PHONE_MODES.includes(mode)) return '59'
  if (TONE_MODES.includes(mode)) return '599'
  return null
}
