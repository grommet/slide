export const apiUrl =
  'https://us-central1-grommet-designer.cloudfunctions.net/slides'

export const themeApiUrl =
  'https://us-central1-grommet-designer.cloudfunctions.net/themes'

export const initialText = '# Hot\n\n- first\n- second\n\n# Frosty\n'

export const textToSlides =
  text => text.split(/\s# /).map((s, i) => i ? `# ${s}` : s)

export const characterToSlideIndex = (text, pos) => {
  const slides = textToSlides(text).map(s => s.length)
  let sum = 0
  let result
  slides.some((length, index) => {
    sum += length + 1
    if (sum > pos) {
      result = index
      return true
    }
    return false
  })
  return result
}
