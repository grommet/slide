import {
  Box, Button, Grommet, Keyboard, Markdown, Paragraph, ResponsiveContext, TextArea,
} from 'grommet';
import { grommet } from 'grommet/themes';
import { Close, Edit, Next, Previous, Share } from 'grommet-icons';
import LZString from 'lz-string';
import React, { Component, Fragment } from 'react';

const textToSlides = text => text.split(/\s# /).map((s, i) => i ? `# ${s}` : s);

const initialText = '# Hot\n\n- first\n- second\n\n# Frosty\n';
const initialSlides = textToSlides(initialText);

const UNSPLASH_API_KEY = process.env.REACT_APP_UNSPLASH_API_KEY;
if (!UNSPLASH_API_KEY) {
  console.error("Missing UNSPLASH_API_KEY");
}

const editControl = {
  edit: { Icon: Close, mode: 'view' },
  view: { Icon: Edit, mode: 'edit' },
};

const viewContainerProps = {
  edit: { flex: true },
  view: { flex: true },
};

const createTouch = (event) => {
  if (event.changedTouches.length === 1) {
    const touch = event.changedTouches.item(0);
    if (touch) {
      return {
        at: (new Date()).getTime(),
        x: touch.pageX,
        y: touch.pageY,
      };
    }
  }
  return undefined;
}

class App extends Component {
  state = {
    current: 0,
    images: [],
    mode: 'view',
    slides: initialSlides,
    text: initialText,
  }

  componentDidMount () {
    const { addEventListener, location } = document;
    addEventListener('touchstart', this.onTouchStart);
    addEventListener('touchmove', this.onTouchMove);
    addEventListener('touchend', this.onTouchEnd);
    addEventListener('touchcancel', this.onTouchCancel);

    // load text from URL, or local storage, if any
    const params = {};
    location.search.slice(1).split('&').forEach(p => {
      const [k, v] = p.split('=');
      params[k] = v;
    });
    const encodedText = params.t || window.localStorage.getItem('text');
    if (encodedText) {
      const text = LZString.decompressFromEncodedURIComponent(encodedText);
      const slides = textToSlides(text);
      this.setState({ text, slides }, this.loadImages);
    }
    const mode = window.localStorage.getItem('mode') || this.state.mode;
    this.setState({ mode });
  }

  componentWillUnmount () {
    const { removeEventListener } = document;
    clearTimeout(this.timer);
    removeEventListener('touchstart', this.onTouchStart);
    removeEventListener('touchmove', this.onTouchMove);
    removeEventListener('touchend', this.onTouchEnd);
    removeEventListener('touchcancel', this.onTouchCancel);
  }

  loadImages = () => {
    const { images, slides } = this.state;
    const nextImages = images.slice(0);
    slides.forEach((s, i) => {
      const match = s.match(/^# (\w+)\s*$/);
      if (match) {
        const name = match[1];
        nextImages[i] = this.loadImage(name, i);
      }
    });
    this.setState({ images: nextImages });
  }

  loadImage = (name, index) => {
    const url = window.localStorage.getItem(`image-${name}`);
    if (!url) {
      fetch(
        `https://api.unsplash.com/search/photos?query=${name}&per_page=1`,
        {
          headers: {
            "method": "GET",
            "Accept-Version": "v1",
            "Authorization": `Client-ID ${UNSPLASH_API_KEY}`,
          },
        })
          .then(response => response.json())
          .then(response => {
            const url = `url(${response.results[0].urls.regular})`;
            window.localStorage.setItem(`image-${name}`, url);
            const images = this.state.images.slice(0);
            images[index] = url;
            this.setState({ images });
          });
    }
    return url;
  }

  onTouchStart = (event) => {
    event.preventDefault();
    this.touchStart = createTouch(event);
  }

  onTouchMove = (event) => {
    event.preventDefault();
  }

  onTouchEnd = (event) => {
    if (this.touchStart) {
      const touchEnd = createTouch(event);
      if (touchEnd) {
        const delta = {
          at: (touchEnd.at - this.touchStart.at),
          x: (touchEnd.x - this.touchStart.x),
          y: (touchEnd.y - this.touchStart.y),
        }

        if (Math.abs(delta.y) < 100 && delta.at < 200) {
          if (delta.x > 100) {
            this.onPrevious();
          } else if (delta.x < -100) {
            this.onNext();
          }
        }
      }
      this.touchStart = undefined;
    }
  }

  onTouchCancel = (event) => {
    this.touchStart = undefined;
  }

  onChange = event => {
    const { slides: priorSlides } = this.state;
    const text = event.target.value;
    const slides = textToSlides(text);
    let { current } = this.state;
    slides.some((s, i) => {
      const prior = priorSlides[i];
      if (!prior || prior.length !== s.length) {
        current = i;
        return true;
      }
      return false;
    });
    this.setState({ current, slides, text }, () => {
      window.localStorage.setItem(
        'text', LZString.compressToEncodedURIComponent(text));
      // clear any text in the browser location when editing
      if (window.location.search) {
        window.history.pushState(null, '', '/');
      }
    });
  }

  onNext = () => {
    const { current, slides } = this.state;
    this.setState({ current: Math.min(current + 1, slides.length - 1)});
  }

  onPrevious = () => {
    const { current } = this.state;
    this.setState({ current: Math.max(current - 1, 0)});
  }

  onChangeMode = (mode) => {
    this.setState({ mode }, () => {
      window.localStorage.setItem('mode', mode)
    });
  }

  renderControls = (mode, responsiveSize, text) => {
    const EditControlIcon = editControl[mode].Icon;
    return (
      <Box
        flex={false}
        direction="row"
        align="center"
        justify="between"
        background="dark-1"
        style={responsiveSize === 'small' ? { justifyContent: 'space-around' } : undefined}
      >
        <Button
          icon={<EditControlIcon />}
          hoverIndicator
          onClick={() => this.onChangeMode(editControl[mode].mode)}
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
                onClick={this.onPrevious}
              />
              <Button
                icon={<Next />}
                hoverIndicator
                onClick={this.onNext}
              />
            </Fragment>
          )}
        </Box>

        <Button
          icon={<Share />}
          hoverIndicator
          target="_blank"
          rel="noopener noreferrer"
          href={`?t=${LZString.compressToEncodedURIComponent(text)}`}
        />
      </Box>
    );
  }

  render() {
    const { current, images, mode, slides, text } = this.state;
    const slide = slides[current].trim();
    const size = (slide.length < 10) ? 'xlarge' : 'large';
    const textAlign = (slide.indexOf("\n") === -1) ? 'center' : 'start';
    const components = {
      h1: { props: { textAlign, size } },
      h2: { props: { textAlign, size } },
      h3: { props: { textAlign, size } },
      p: { props: { textAlign, size } },
      ul: { component: Box, props: { style: { margin: 0 } } },
      ol: { component: Box, props: { style: { margin: 0 } } },
      li: { component: Paragraph, props: { as: 'li', size } },
    };

    // if second line of slide is an image, make it the background,
    // and remove from markdown content
    const lines = slide.split("\n");
    const secondLine = lines[1] || '';
    const match = secondLine.match(/^!\[.*\]\((.+)\)$/);
    let content = slide;
    let background = images[current] || `accent-${(current % 3) + 1}`;
    if (match) {
      background = `url(${match[1]})`;
      lines.splice(1, 1);
      content = lines.join("\n");
    }

    return (
      <Grommet full theme={grommet}>
        <ResponsiveContext.Consumer>
          {(responsiveSize) => (
            <Box fill>
              {responsiveSize !== 'small' &&
                this.renderControls(mode, responsiveSize, text)}
              <Box flex={true} direction="row">
                {mode !== 'view' && (
                  <Box basis="medium">
                    <TextArea fill value={text} onChange={this.onChange} />
                  </Box>
                )}
                <Box {...viewContainerProps[mode]} overflow="hidden">
                  <Keyboard
                    onLeft={this.onPrevious}
                    onRight={this.onNext}
                  >
                    <Box
                      tabIndex="-1"
                      fill
                      pad="xlarge"
                      background={background}
                    >
                      <Markdown components={components}>
                        {content}
                      </Markdown>
                    </Box>
                  </Keyboard>
                </Box>
              </Box>
              {responsiveSize === 'small' &&
                this.renderControls(mode, responsiveSize, text)}
            </Box>
          )}
        </ResponsiveContext.Consumer>
      </Grommet>
    );
  }
}

export default App;
