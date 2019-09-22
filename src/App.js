import { Box, Button, Grommet, Keyboard, ResponsiveContext } from 'grommet'
import { grommet } from 'grommet/themes'
import { Edit, Expand, Gremlin, Next, Previous } from 'grommet-icons'
import LZString from 'lz-string'
import React from 'react'
import Content from './Content'
import Editor from './Editor'
import { apiUrl, initialText, textToSlides, themeApiUrl } from './slide'

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

const App = () => {
  const [set, setSet] = React.useState()
  const [current, setCurrent] = React.useState(0)
  const [images, setImages] = React.useState([])
  const [theme, setTheme] = React.useState()
  const [edit, setEdit] = React.useState(false)
  const [slides, setSlides] = React.useState()
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
        } else {
          setSet({ text: initialText })
        }
      }
    }
    const nextEdit = window.localStorage.getItem('slide-edit')
    if (nextEdit) setEdit(JSON.parse(nextEdit))
  }, [])

  // break apart slides when set changes
  React.useEffect(() => set && setSlides(textToSlides(set.text)), [set])

  // load theme if needed
  const priorThemeRef = React.useRef()
  React.useEffect(() => {
    if (set && set.theme !== priorThemeRef.current) {
      if (set.theme.slice(0, 6) === 'https:') {
        // extract id from URL
        const id = set.theme.split('id=')[1]
        fetch(`${themeApiUrl}/${id}`)
          .then(response => response.json())
          .then(nextTheme => setTheme(nextTheme))
      } else {
        setTheme(undefined)
      }
    }
    if (set) priorSlidesRef.current = set.theme
  }, [set])

  // set current to the slide being edited
  const priorSlidesRef = React.useRef()
  React.useEffect(() => {
    if (slides && priorSlidesRef.current) {
      slides.some((s, i) => {
        const priorSlide = priorSlidesRef.current[i]
        if (!priorSlide || priorSlide.length !== s.length) {
          setCurrent(i)
          return true
        }
        return false
      })
    }
    priorSlidesRef.current = slides
  }, [slides])

  // set images when slides change
  React.useEffect(() => {
    const nextImages = []
    slides && slides.forEach((s, i) => {
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
      // ensure this set is first
      const stored = window.localStorage.getItem('slide-sets')
      const sets = stored ? JSON.parse(stored) : []
      const index = sets.indexOf(nextSet.name)
      if (index !== 0) {
        if (index > 0) sets.splice(index, 1)
        sets.unshift(nextSet.name)
        window.localStorage.setItem('slide-sets', JSON.stringify(sets))
      }
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

  return (
    <Grommet full theme={theme || grommet}>
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
                onKeyDown={({ key, keyCode, metaKey }) => {
                  const nextCurrent = keyCode - 49
                  if (nextCurrent >= 0 && nextCurrent <= (slides.length - 1)) {
                    setCurrent(nextCurrent)
                  }
                  if (key === 'e' && metaKey) {
                    setEdit(!edit)
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
                  {slides ? (
                    <Content
                      image={images[current]}
                      index={current}
                      slide={slides[current]}
                    />
                  ) : (
                    <Box flex align="center" justify="center" animation="pulse">
                      <Gremlin size="large" />
                    </Box>
                  )}
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
