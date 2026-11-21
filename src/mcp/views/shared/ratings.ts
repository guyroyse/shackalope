import type {
  BandRating,
  HF_BandCondition
} from '@services/band-conditions/model'

const HYPHEN = /-/g

/* a row of the HF table: the band pair, then day and night as signal bars */
export function renderHF_Row({ bands, day, night }: HF_BandCondition) {
  const row = document.createElement('tr')
  const bandsCell = document.createElement('td')

  bandsCell.className = 'bands'
  bandsCell.textContent = bands.replace(HYPHEN, '–')

  row.append(bandsCell, ratingCell(day), ratingCell(night))
  return row
}

function ratingCell(rating: BandRating) {
  const cell = document.createElement('td')
  const wrapper = document.createElement('span')

  wrapper.className = 'rating'
  wrapper.dataset.rating = rating
  wrapper.textContent = rating

  cell.append(wrapper)
  return cell
}
