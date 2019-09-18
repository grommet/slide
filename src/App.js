import {
  Box, Button, Grommet, Keyboard, Markdown, Paragraph,
  ResponsiveContext, TextArea,
} from 'grommet'
import { grommet } from 'grommet/themes'
import { Close, Edit, Next, Previous, Share } from 'grommet-icons'
import LZString from 'lz-string'
import React, { Fragment } from 'react'

const textToSlides = text => text.split(/\s# /).map((s, i) => i ? `# ${s}` : s)

const initialText = '# Hot\n\n- first\n- second\n\n# Frosty\n'
const initialSlides = textToSlides(initialText)

const UNSPLASH_API_KEY = process.env.REACT_APP_UNSPLASH_API_KEY
if (!UNSPLASH_API_KEY) {
  console.error("Missing UNSPLASH_API_KEY")
}

const editControl = {
  edit: { Icon: Close, mode: 'view' },
  view: { Icon: Edit, mode: 'edit' },
}

const viewContainerProps = {
  edit: { flex: true },
  view: { flex: true },
}

const createTouch = (event) => {
  if (event.changedTouches.length === 1) {
    const touch = event.changedTouches.item(0)
    if (touch) {
      return {
        at: (new Date()).getTime(),
        x: touch.pageX,
        y: touch.pageY,
      }
    }
  }
  return undefined
}

const LightBox = props => (
  <Box
    pad={{ horizontal: "large" }}
    background={{ color: 'dark-3', opacity: 'medium' }}
    justify="center"
    {...props}
  />
)

const App = () => {
  const [current, setCurrent] = React.useState(0)
  const [images, setImages] = React.useState([])
  const [mode, setMode] = React.useState('view')
  const [slides, setSlides] = React.useState(initialSlides)
  const [text, setText] = React.useState(initialText)

  // load initial text from URL, or local storage, if any
  React.useEffect(() => {
    const params = {}
    document.location.search.slice(1).split('&').forEach(p => {
      const [k, v] = p.split('=')
      params[k] = v
    })
    const encodedText = params.t || window.localStorage.getItem('text')
    if (encodedText) {
      const nextText = LZString.decompressFromEncodedURIComponent(encodedText)
      setText(nextText)
      setSlides(textToSlides(nextText))
    }
    const nextMode = window.localStorage.getItem('mode')
    if (nextMode) setMode(nextMode)
  }, [])

  // set images when slides change
  React.useEffect(() => {
    const nextImages = []
    slides.forEach((s, i) => {
      const match = s.match(/^# (\w+)\s*$/)
      if (match) {
        const name = match[1]
        nextImages[i] = window.localStorage.getItem(`image-${name}`) || name
      }
    })
    setImages(nextImages)
  }, [slides])

  const loadTimer = React.useRef()

  // lazily load
  React.useEffect(() => {
    clearTimeout(loadTimer.current)
    loadTimer.current = setTimeout(() => {
      images.forEach((image, index) => {
        if (image && !image.startsWith('url(')) {
          fetch(
            `https://api.unsplash.com/search/photos?query=${image}&per_page=1`,
            {
              headers: {
                "method": "GET",
                "Accept-Version": "v1",
                "Authorization": `Client-ID ${UNSPLASH_API_KEY}`,
              },
            },
          )
          .then(response => response.json())
          .then(response => {
            if (response.results.length > 0) {
              const url = `url(${response.results[0].urls.regular})`
              window.localStorage.setItem(`image-${image}`, url)
              const nextImages = images.slice(0)
              nextImages[index] = url
              setImages(nextImages)
            }
          })
        }
      })
    }, 5000) // 5s empircally determined
    return () => clearTimeout(loadTimer.current)
  }, [images])

  const onNext = React.useCallback(() =>
    setCurrent(Math.min(current + 1, slides.length - 1)),
    [current, slides],
  )

  const onPrevious = React.useCallback(() =>
    setCurrent(Math.max(current - 1, 0)),
    [current],
  )

  React.useEffect(() => {
    const { addEventListener, removeEventListener } = document
    let touchStart

    const onTouchStart = (event) => {
      event.preventDefault()
      touchStart = createTouch(event)
    }
  
    const onTouchMove = (event) => {
      event.preventDefault()
    }
  
    const onTouchEnd = (event) => {
      if (touchStart) {
        const touchEnd = createTouch(event)
        if (touchEnd) {
          const delta = {
            at: (touchEnd.at - touchStart.at),
            x: (touchEnd.x - touchStart.x),
            y: (touchEnd.y - touchStart.y),
          }
  
          if (Math.abs(delta.y) < 100 && delta.at < 200) {
            if (delta.x > 100) {
              onPrevious()
            } else if (delta.x < -100) {
              onNext()
            }
          }
        }
        touchStart = undefined
      }
    }
  
    const onTouchCancel = (event) => {
      touchStart = undefined
    }

    addEventListener('touchstart', onTouchStart)
    addEventListener('touchmove', onTouchMove)
    addEventListener('touchend', onTouchEnd)
    addEventListener('touchcancel', onTouchCancel)

    return () => {
      removeEventListener('touchstart', onTouchStart)
      removeEventListener('touchmove', onTouchMove)
      removeEventListener('touchend', onTouchEnd)
      removeEventListener('touchcancel', onTouchCancel)
    }
  }, [onNext, onPrevious])

  const onChange = event => {
    const nextText = event.target.value
    setText(nextText)
    const nextSlides = textToSlides(nextText)
    setSlides(nextSlides)
    nextSlides.some((s, i) => {
      const slide = slides[i]
      if (!slide || slide.length !== s.length) {
        setCurrent(i)
        return true
      }
      return false
    })
    window.localStorage.setItem('text',
      LZString.compressToEncodedURIComponent(nextText))
    // clear any text in the browser location when editing
    if (window.location.search) {
      window.history.pushState(null, '', '/')
    }
  }

  const onChangeMode = (mode) => {
    setMode(mode)
    window.localStorage.setItem('mode', mode)
  }

  const renderControls = (responsiveSize) => {
    const EditControlIcon = editControl[mode].Icon
    return (
      <Box
        flex={false}
        direction="row"
        align="center"
        justify={responsiveSize === 'small' ? 'around' : 'between'}
        background="dark-1"
      >
        <Button
          icon={<EditControlIcon />}
          hoverIndicator
          onClick={() => onChangeMode(editControl[mode].mode)}
        />

        <Box
          flex={false}
          direction="row"
          justify="center"
          align="center"
          background="dark-1"
        >
          {(mode !== 'edit' || responsiveSize !== 'small') && (
            <Fragment>
              <Button
                icon={<Previous />}
                hoverIndicator
                onClick={onPrevious}
              />
              <Button
                icon={<Next />}
                hoverIndicator
                onClick={onNext}
              />
            </Fragment>
          )}
        </Box>

        {navigator.share && (
          <Button
            icon={<Share />}
            hoverIndicator
            onClick={() => {
              const match = text.match(/^# (.+)\s*$/)
              const title = match ? match[1] : 'Slides'
              navigator.share({
                title,
                text: title,
                url: `?t=${LZString.compressToEncodedURIComponent(text)}`,
              })
            }}
          />
        )}
      </Box>
    )
  }

  const slide = slides[current].trim()
  const size = (slide.length < 10) ? 'xlarge' : 'large'
  const textAlign = (slide.indexOf("\n") === -1) ? 'center' : 'start'
  const components = {
    h1: { props: { textAlign, size } },
    h2: { props: { textAlign, size } },
    h3: { props: { textAlign, size } },
    p: { props: { textAlign, size } },
    ul: { component: Box, props: { as: 'ul', margin: { left: 'medium' } } },
    ol: { component: Box, props: { as: 'ol', margin: { left: 'medium' } } },
    li: { component: Paragraph, props: { as: 'li', size } },
  }

  // if second line of slide is an image, make it the background,
  // and remove from markdown content
  const lines = slide.split("\n")
  const secondLine = lines[1] || ''
  const match = secondLine.match(/^!\[.*\]\((.+)\)$/)
  let content = slide
  let background = images[current] || `accent-${(current % 3) + 1}`
  if (match) {
    background = `url(${match[1]})`
    lines.splice(1, 1)
    content = lines.join("\n")
  }
  content = <Markdown components={components}>{content}</Markdown>

  const backgroundImage = (background.slice(0, 4) === 'url(')
  if (backgroundImage) {
    content = <LightBox>{content}</LightBox>
  }

  return (
    <Grommet full theme={grommet}>
      <ResponsiveContext.Consumer>
        {(responsiveSize) => (
          <Box fill>
            {responsiveSize !== 'small' &&
              renderControls(mode, responsiveSize, text)}
            <Box flex={true} direction="row">
              {mode !== 'view' && (
                <Box basis="medium">
                  <Box flex={true}>
                    <TextArea fill value={text} onChange={onChange} />
                  </Box>
                </Box>
              )}
              <Box {...viewContainerProps[mode]} overflow="hidden">
                <Keyboard
                  onLeft={onPrevious}
                  onRight={onNext}
                >
                  <Box
                    tabIndex="-1"
                    fill
                    pad="xlarge"
                    background={background}
                    justify={backgroundImage ? 'center' : undefined}
                    align={backgroundImage ? 'center' : undefined}
                  >
                    {content}
                  </Box>
                </Keyboard>
              </Box>
            </Box>
            {responsiveSize === 'small' &&
              renderControls(mode, responsiveSize, text)}
          </Box>
        )}
      </ResponsiveContext.Consumer>
    </Grommet>
  )
}

export default App
