export type Scenario = {
  tool: string
  arguments: Record<string, unknown>
}

/* the tool call that opens each view, with sample arguments; a new view
   needs an entry here to show up in the preview */
export const SCENARIOS: Record<string, Scenario> = {
  'band-activity': {
    tool: 'show_band_activity',
    arguments: {}
  },
  'band-conditions': {
    tool: 'show_band_conditions',
    arguments: {}
  },
  'qsl-card': {
    tool: 'show_qsl_card',
    arguments: {
      callsign: 'W1AW',
      operatorName: 'Hiram',
      frequency: 14.074,
      mode: 'FT8',
      rst: '-10',
      remarks: 'Tnx for the QSO, Hiram!'
    }
  }
}
