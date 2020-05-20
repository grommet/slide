import { Box, Button, Grommet, Keyboard, ResponsiveContext } from 'grommet';
import { grommet } from 'grommet/themes';
import { Down, Edit, Expand, Gremlin, Up } from 'grommet-icons';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import Content from './Content';
import Editor from './Editor';
import ConfirmReplace from './ConfirmReplace';
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

export const getParams = () => {
  const { location } = window;
  const params = {};
  location.search
    .slice(1)
    .split('&')
    .forEach((p) => {
      const [k, v] = p.split('=');
      params[k] = decodeURIComponent(v);
    });
  return params;
};

const setNameParam = (name) => {
  const search = `?name=${encodeURIComponent(name)}`;
  const url = window.location.pathname + search;
  window.history.replaceState(undefined, undefined, url);
};

const App = () => {
  const responsiveSize = useContext(ResponsiveContext);
  const [set, setSet] = useState();
  const [current, setCurrent] = useState();
  const [previous, setPrevious] = useState(-1);
  const [images, setImages] = useState([]);
  const [theme, setTheme] = useState();
  const [edit, setEdit] = useState(false);
  const [slides, setSlides] = useState();
  const [confirmReplace, setConfirmReplace] = useState();
  const [fullScreen, setFullScreen] = useState();
  const viewerRef = useRef();

  // load initial set from URL, or local storage, if any
  useEffect(() => {
    const params = getParams();
    if (params.id) {
      fetch(`${apiUrl}/${params.id}`)
        .then((response) => response.json())
        .then((set) => {
          document.title = set.name;
          setSet(set);
        });
    } else if (params.name) {
      const storedSet = window.localStorage.getItem(params.name);
      if (storedSet) {
        setSet(JSON.parse(storedSet));
      } else {
        setSet({ name: 'my slides', text: initialText });
      }
    } else {
      setSet({ name: 'my slides', text: initialText });
    }
    const nextEdit = window.localStorage.getItem('slide-edit');
    if (nextEdit) setEdit(JSON.parse(nextEdit));
  }, []);

  // set current, if needed, from hash and within slides
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
  const priorThemeRef = useRef();
  useEffect(() => {
    if (set && set.theme && set.theme !== priorThemeRef.current) {
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
    } else {
      setTheme(grommet);
    }
    if (set) priorThemeRef.current = set.theme;
  }, [set]);

  // set current to the slide being edited
  const priorSlidesRef = useRef();
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

  // lazily load slide images
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
              if (response.results && response.results.length > 0) {
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

  const onNext = useCallback(() => {
    setPrevious(current);
    // reset so animation works
    setCurrent(-1);
    setTimeout(() => setCurrent(Math.min(current + 1, slides.length - 1)), 1);
  }, [current, slides]);

  const onPrevious = useCallback(() => {
    setPrevious(current);
    // reset so animation works
    setCurrent(-1);
    setTimeout(() => setCurrent(Math.max(current - 1, 0)), 1);
  }, [current]);

  // gesture interaction
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
    if (nextSet && !nextSet.local && localStorage.getItem(nextSet.name)) {
      setConfirmReplace(nextSet);
    } else {
      if (nextSet) nextSet.local = true;
      setSet(nextSet);
    }
  }, []);

  useEffect(() => {
    if (set && set.local) {
      const timer = setTimeout(() => {
        window.localStorage.setItem(set.name, JSON.stringify(set));
        const params = getParams();
        if (params.name !== set.name) setNameParam(set.name);
        // ensure this set is first
        const stored = window.localStorage.getItem('slide-sets');
        const sets = stored ? JSON.parse(stored) : [];
        const index = sets.indexOf(set.name);
        if (index !== 0) {
          if (index > 0) sets.splice(index, 1);
          sets.unshift(set.name);
          window.localStorage.setItem('slide-sets', JSON.stringify(sets));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [set]);

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
    >
      <Button icon={<Edit />} hoverIndicator onClick={() => setEdit(!edit)} />

      <Box
        flex={false}
        direction="row"
        justify="center"
        align="center"
        background="background-front"
      >
        <Button icon={<Up />} hoverIndicator onClick={onPrevious} />
        <Button icon={<Down />} hoverIndicator onClick={onNext} />
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
              if (
                slides &&
                nextCurrent >= 0 &&
                nextCurrent <= slides.length - 1
              ) {
                setCurrent(nextCurrent);
              }
              if ((key === '.' || key === 'e') && metaKey) {
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
              background={{ color: 'background', dark: true }}
              direction={
                responsiveSize === 'small' ? 'column-reverse' : 'column'
              }
            >
              <Controls justify="between" />
              {slides && slides[current] !== undefined && theme ? (
                <Content
                  image={images[current]}
                  index={current}
                  previous={previous}
                  slide={slides[current]}
                />
              ) : (
                <Box
                  flex
                  align="center"
                  justify="center"
                  animation={['fadeIn', 'pulse']}
                >
                  <Gremlin size="large" />
                </Box>
              )}
            </Box>
          </Keyboard>
        </Box>
        {confirmReplace && (
          <ConfirmReplace
            set={set}
            nextSet={confirmReplace}
            onDone={(nextSet) => {
              if (nextSet) setSet(nextSet);
              setConfirmReplace(undefined);
            }}
          />
        )}
      </Box>
    </Grommet>
  );
};

export default App;
