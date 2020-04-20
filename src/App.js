import { Box, Button, Grommet, Keyboard, ResponsiveContext } from 'grommet';
import { grommet } from 'grommet/themes';
import { Edit, Expand, Gremlin, Next, Previous } from 'grommet-icons';
import React, { useCallback, useEffect } from 'react';
import Content from './Content';
import Editor from './Editor';
import { apiUrl, initialText, textToSlides, themeApiUrl } from './slide';

const UNSPLASH_API_KEY = process.env.REACT_APP_UNSPLASH_API_KEY;
if (!UNSPLASH_API_KEY) {
  console.error('Missing UNSPLASH_API_KEY');
}

const createTouch = (event) => {
  if (event.changedTouches.length === 1) {
    const touch = event.changedTouches.item(0);
    if (touch) {
      return {
        at: new Date().getTime(),
        x: touch.pageX,
        y: touch.pageY,
      };
    }
  }
  return undefined;
};

const App = () => {
  const responsiveSize = React.useContext(ResponsiveContext);
  const [set, setSet] = React.useState();
  const [current, setCurrent] = React.useState();
  const [images, setImages] = React.useState([]);
  const [theme, setTheme] = React.useState();
  const [edit, setEdit] = React.useState(false);
  const [changed, setChanged] = React.useState();
  const [slides, setSlides] = React.useState();
  const [fullScreen, setFullScreen] = React.useState();
  const viewerRef = React.useRef();

  // load initial set from URL, or local storage, if any
  useEffect(() => {
    const params = {};
    document.location.search
      .slice(1)
      .split('&')
      .forEach((p) => {
        const [k, v] = p.split('=');
        params[k] = v;
      });
    if (params.id) {
      fetch(`${apiUrl}/${params.id}`)
        .then((response) => response.json())
        .then((set) => {
          document.title = set.name;
          setSet(set);
        });
    } else {
      const storedSets = window.localStorage.getItem('slide-sets');
      if (storedSets) {
        const sets = JSON.parse(storedSets);
        if (sets[0]) {
          const storedSet = window.localStorage.getItem(sets[0]);
          setSet(JSON.parse(storedSet));
        }
      } else {
        setSet({ text: initialText });
      }
    }
    const nextEdit = window.localStorage.getItem('slide-edit');
    if (nextEdit) setEdit(JSON.parse(nextEdit));
  }, []);

  useEffect(() => {
    if (window.location.hash && slides && current === undefined) {
      setCurrent(
        Math.min(
          parseInt(window.location.hash.slice(1), 10),
          slides.length - 1,
        ),
      );
    } else if (slides && current > slides.length - 1) {
      setCurrent(slides.length - 1);
    } else if (slides && current === undefined) {
      setCurrent(0);
    }
  }, [current, slides]);

  // set hash when changing current slide
  useEffect(() => {
    if (current >= 0) window.location.hash = `#${current}`;
  }, [current]);

  // break apart slides when set changes
  useEffect(() => set && setSlides(textToSlides(set.text)), [set]);

  // load theme if needed
  const priorThemeRef = React.useRef();
  useEffect(() => {
    if (set && set.theme !== priorThemeRef.current) {
      if (set.theme.slice(0, 6) === 'https:') {
        // extract id from URL
        const id = set.theme.split('id=')[1];
        fetch(`${themeApiUrl}/${id}`)
          .then((response) => response.json())
          .then((nextTheme) => setTheme(nextTheme))
          .catch(() => setTheme(grommet));
      } else {
        setTheme(grommet);
      }
    }
    if (set) priorThemeRef.current = set.theme;
  }, [set]);

  // set current to the slide being edited
  const priorSlidesRef = React.useRef();
  useEffect(() => {
    if (slides && priorSlidesRef.current) {
      slides.some((s, i) => {
        const priorSlide = priorSlidesRef.current[i];
        if (!priorSlide || priorSlide.length !== s.length) {
          setCurrent(i);
          return true;
        }
        return false;
      });
    }
    priorSlidesRef.current = slides;
  }, [slides]);

  // set images when slides change
  useEffect(() => {
    const nextImages = [];
    slides &&
      slides.forEach((s, i) => {
        // allow footer
        const match = s.match(/^#\s+(\w+)\s*$|^#\s+(\w+)\s*\n\n\n[^\n]+\s*$/);
        if (match) {
          const name = match[1] || match[2];
          nextImages[i] =
            window.localStorage.getItem(`slide-image-${name}`) || name;
        }
      });
    setImages(nextImages);
  }, [slides]);

  // lazily load
  useEffect(() => {
    const timer = setTimeout(() => {
      images.forEach((image, index) => {
        if (image && !image.startsWith('url(')) {
          fetch(
            `https://api.unsplash.com/search/photos?query=${image}&per_page=1`,
            {
              headers: {
                method: 'GET',
                'Accept-Version': 'v1',
                Authorization: `Client-ID ${UNSPLASH_API_KEY}`,
              },
            },
          )
            .then((response) => response.json())
            .then((response) => {
              if (response.results.length > 0) {
                const url = `url(${response.results[0].urls.regular})`;
                window.localStorage.setItem(`slide-image-${image}`, url);
                const nextImages = images.slice(0);
                nextImages[index] = url;
                setImages(nextImages);
              }
            });
        }
      });
    }, 5000); // 5s empircally determined
    return () => clearTimeout(timer);
  }, [images]);

  useEffect(
    () => window.localStorage.setItem('slide-edit', JSON.stringify(edit)),
    [edit],
  );

  const onNext = useCallback(
    () => setCurrent(Math.min(current + 1, slides.length - 1)),
    [current, slides],
  );

  const onPrevious = useCallback(() => setCurrent(Math.max(current - 1, 0)), [
    current,
  ]);

  useEffect(() => {
    const { addEventListener, removeEventListener } = document;
    let touchStart;

    const onTouchStart = (event) => {
      event.preventDefault();
      touchStart = createTouch(event);
    };

    const onTouchMove = (event) => {
      event.preventDefault();
    };

    const onTouchEnd = (event) => {
      if (touchStart) {
        const touchEnd = createTouch(event);
        if (touchEnd) {
          const delta = {
            at: touchEnd.at - touchStart.at,
            x: touchEnd.x - touchStart.x,
            y: touchEnd.y - touchStart.y,
          };

          if (Math.abs(delta.y) < 100 && delta.at < 200) {
            if (delta.x > 100) {
              onPrevious();
            } else if (delta.x < -100) {
              onNext();
            }
          }
        }
        touchStart = undefined;
      }
    };

    const onTouchCancel = (event) => {
      touchStart = undefined;
    };

    addEventListener('touchstart', onTouchStart);
    addEventListener('touchmove', onTouchMove);
    addEventListener('touchend', onTouchEnd);
    addEventListener('touchcancel', onTouchCancel);

    return () => {
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchmove', onTouchMove);
      removeEventListener('touchend', onTouchEnd);
      removeEventListener('touchcancel', onTouchCancel);
    };
  }, [onNext, onPrevious]);

  const onChange = useCallback((nextSet) => {
    setChanged(true);
    setSet(nextSet);
  }, []);

  useEffect(() => {
    if (changed) {
      const timer = setTimeout(() => {
        window.localStorage.setItem(set.name, JSON.stringify(set));
        // ensure this set is first
        const stored = window.localStorage.getItem('slide-sets');
        const sets = stored ? JSON.parse(stored) : [];
        const index = sets.indexOf(set.name);
        if (index !== 0) {
          if (index > 0) sets.splice(index, 1);
          sets.unshift(set.name);
          window.localStorage.setItem('slide-sets', JSON.stringify(sets));
        }
        // clear any text in the browser location when editing
        if (window.location.search) {
          window.history.pushState(null, '', '/');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [changed, set]);

  const toggleFullscreen = () => {
    if (!fullScreen) {
      viewerRef.current.webkitRequestFullscreen();
    } else {
      document.webkitExitFullscreen();
    }
    setFullScreen(!fullScreen);
  };

  const Controls = ({ justify }) => (
    <Box
      flex={false}
      direction="row"
      align="center"
      justify={justify || 'between'}
      background={{ color: 'background-back', dark: true }}
    >
      <Button icon={<Edit />} hoverIndicator onClick={() => setEdit(!edit)} />

      <Box
        flex={false}
        direction="row"
        justify="center"
        align="center"
        background="background-front"
      >
        <Button icon={<Previous />} hoverIndicator onClick={onPrevious} />
        <Button icon={<Next />} hoverIndicator onClick={onNext} />
      </Box>

      <Button icon={<Expand />} hoverIndicator onClick={toggleFullscreen} />
    </Box>
  );

  return (
    <Grommet full theme={theme}>
      <Box fill>
        <Box flex direction="row">
          {edit && set && (
            <Editor set={set} onChange={onChange} setCurrent={setCurrent} />
          )}
          <Keyboard
            onLeft={onPrevious}
            onRight={onNext}
            onUp={onPrevious}
            onDown={onNext}
            onShift={toggleFullscreen}
            onEsc={() => setFullScreen(false)}
            onKeyDown={({ key, keyCode, metaKey }) => {
              const nextCurrent = keyCode - 49;
              if (nextCurrent >= 0 && nextCurrent <= slides.length - 1) {
                setCurrent(nextCurrent);
              }
              if (key === 'e' && metaKey) {
                setEdit(!edit);
              }
            }}
          >
            <Box
              ref={viewerRef}
              tabIndex="-1"
              fill={fullScreen}
              flex
              overflow="hidden"
              direction={
                responsiveSize === 'small' ? 'column-reverse' : 'column'
              }
            >
              <Controls justify="between" />
              {slides && slides[current] && theme ? (
                <Content
                  image={images[current]}
                  index={current}
                  slide={slides[current]}
                  theme={theme}
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
    </Grommet>
  );
};

export default App;
