type Band = {
  name: string
  lowMHz: number
  highMHz: number
}

/* US amateur allocations; close enough to label a QSL card anywhere */
const BANDS: Band[] = [
  { name: '160m', lowMHz: 1.8, highMHz: 2.0 },
  { name: '80m', lowMHz: 3.5, highMHz: 4.0 },
  { name: '60m', lowMHz: 5.3305, highMHz: 5.4065 },
  { name: '40m', lowMHz: 7.0, highMHz: 7.3 },
  { name: '30m', lowMHz: 10.1, highMHz: 10.15 },
  { name: '20m', lowMHz: 14.0, highMHz: 14.35 },
  { name: '17m', lowMHz: 18.068, highMHz: 18.168 },
  { name: '15m', lowMHz: 21.0, highMHz: 21.45 },
  { name: '12m', lowMHz: 24.89, highMHz: 24.99 },
  { name: '10m', lowMHz: 28.0, highMHz: 29.7 },
  { name: '6m', lowMHz: 50, highMHz: 54 },
  { name: '2m', lowMHz: 144, highMHz: 148 },
  { name: '1.25m', lowMHz: 222, highMHz: 225 },
  { name: '70cm', lowMHz: 420, highMHz: 450 },
  { name: '33cm', lowMHz: 902, highMHz: 928 },
  { name: '23cm', lowMHz: 1240, highMHz: 1300 }
]

export function bandForFrequency(megahertz: number): string | null {
  const band = BANDS.find(
    ({ lowMHz, highMHz }) => megahertz >= lowMHz && megahertz <= highMHz
  )
  return band?.name ?? null
}
