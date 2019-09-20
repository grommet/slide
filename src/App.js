import {
  Box, Button, Grommet, Keyboard, Markdown, Paragraph,
  ResponsiveContext,
} from 'grommet'
import { grommet } from 'grommet/themes'
import { Edit, Expand, Next, Previous } from 'grommet-icons'
import LZString from 'lz-string'
import React from 'react'
import Editor from './Editor'
import { apiUrl } from './slide'

const textToSlides = text => text.split(/\s# /).map((s, i) => i ? `# ${s}` : s)

const initialText = '# Hot\n\n- first\n- second\n\n# Frosty\n'
const initialSlides = textToSlides(initialText)

const UNSPLASH_API_KEY = process.env.REACT_APP_UNSPLASH_API_KEY
if (!UNSPLASH_API_KEY) {
  console.error("Missing UNSPLASH_API_KEY")
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
    pad={{ horizontal: "xlarge" }}
    background={{ color: 'dark-3', opacity: 'medium' }}
    justify="center"
    round="small"
    {...props}
  />
)

const App = () => {
  const [set, setSet] = React.useState({ text: initialText })
  const [current, setCurrent] = React.useState(0)
  const [images, setImages] = React.useState([])
  const [edit, setEdit] = React.useState(false)
  const [slides, setSlides] = React.useState(initialSlides)
  const [fullScreen, setFullScreen] = React.useState()
  const storageTimer = React.useRef()
  const viewerRef = React.useRef()

  // load initial set from URL, or local storage, if any
  React.useEffect(() => {
    const params = {}
    document.location.search.slice(1).split('&').forEach(p => {
      const [k, v] = p.split('=')
      params[k] = v
    })
    if (params.id) {
      fetch(`${apiUrl}/${params.id}`)
      .then(response => response.json())
      .then((set) => {
        document.title = set.name
        setSet(set)
      })
    } else {
      const storedSets = window.localStorage.getItem('slide-sets')
      if (storedSets) {
        const sets = JSON.parse(storedSets)
        if (sets[0]) {
          const storedSet = window.localStorage.getItem(sets[0])
          setSet(JSON.parse(storedSet))
        }
      } else {
        const encodedText = params.t
          || window.localStorage.getItem('slides')
          || window.localStorage.getItem('text')
        if (encodedText) {
          const text = LZString.decompressFromEncodedURIComponent(encodedText)
          setSet({ text })
          setSlides(textToSlides(text))
        }
      }
    }
    const nextEdit = window.localStorage.getItem('slide-edit')
    if (nextEdit) setEdit(JSON.parse(nextEdit))
  }, [])

  // break apart slides when set changes
  React.useEffect(() => setSlides(textToSlides(set.text)), [set])

  // set current when slides change
  React.useEffect(() => {
    slides.some((s, i) => {
      const slide = slides[i]
      if (!slide || slide.length !== s.length) {
        setCurrent(i)
        return true
      }
      return false
    })
  }, [slides])

  // set images when slides change
  React.useEffect(() => {
    const nextImages = []
    slides.forEach((s, i) => {
      const match = s.match(/^# (\w+)\s*$/)
      if (match) {
        const name = match[1]
        nextImages[i] = window.localStorage.getItem(`slide-image-${name}`) || name
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
              window.localStorage.setItem(`slide-image-${image}`, url)
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

  React.useEffect(() =>
    window.localStorage.setItem('slide-edit', JSON.stringify(edit)), [edit])

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

  const onChange = nextSet => {
    setSet(nextSet)
    clearTimeout(storageTimer.current)
    storageTimer.current = setTimeout(() => {
      window.localStorage.setItem(nextSet.name, JSON.stringify(nextSet))
      // clear any text in the browser location when editing
      if (window.location.search) {
        window.history.pushState(null, '', '/')
      }
    }, 1000)
  }

  const toggleFullscreen = () => {
    if (!fullScreen) {
      viewerRef.current.webkitRequestFullscreen()
    } else {
      document.webkitExitFullscreen()
    }
    setFullScreen(!fullScreen)
  }

  const Controls = ({ justify }) => (
    <Box
      flex={false}
      direction="row"
      align="center"
      justify={justify || 'between'}
      background="dark-1"
    >
      <Button
        icon={<Edit />}
        hoverIndicator
        onClick={() => setEdit(!edit)}
      />

      <Box
        flex={false}
        direction="row"
        justify="center"
        align="center"
        background="dark-1"
      >
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
      </Box>

      <Button
        icon={<Expand />}
        hoverIndicator
        onClick={toggleFullscreen}
      />
    </Box>
  )

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
            <Box flex direction="row">
              {edit && <Editor set={set} onChange={onChange} />}
              <Keyboard
                onLeft={onPrevious}
                onRight={onNext}
                onShift={toggleFullscreen}
                onEsc={() => setFullScreen(false)}
                onKeyDown={({ keyCode }) => {
                  const nextCurrent = keyCode - 49
                  if (nextCurrent >= 0 && nextCurrent <= (slides.length - 1)) {
                    setCurrent(nextCurrent)
                  }
                }}
              >
                <Box
                  ref={viewerRef}
                  tabIndex="-1"
                  fill={fullScreen}
                  flex
                  overflow="hidden"
                  direction={responsiveSize === 'small' ? 'column-reverse' : 'column'}
                >
                  <Controls justify="between" />
                  <Box
                    fill
                    pad="xlarge"
                    background={background}
                    justify={backgroundImage ? 'center' : undefined}
                    align={backgroundImage ? 'center' : undefined}
                  >
                    {content}
                  </Box>
                </Box>
              </Keyboard>
            </Box>
          </Box>
        )}
      </ResponsiveContext.Consumer>
    </Grommet>
  )
}

export default App
