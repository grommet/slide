export const apiUrl =
  'https://us-central1-grommet-designer.cloudfunctions.net/slides'

export const themeApiUrl =
  'https://us-central1-grommet-designer.cloudfunctions.net/themes'

export const initialText = '# Hot\n\n- first\n- second\n\n# Frosty\n'

export const textToSlides =
  text => text.split(/\s# /).map((s, i) => i ? `# ${s}` : s)
