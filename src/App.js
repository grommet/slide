import {
  Box, Button, Grommet, Keyboard, Markdown, ResponsiveContext, TextArea,
} from 'grommet';
import { grommet } from 'grommet/themes';
import { Close, Copy, Edit, Next, Previous } from 'grommet-icons';
import LZString from 'lz-string';
import React, { Component, Fragment } from 'react';

const textToSlides = text => text.split(/\s# /).map((s, i) => i ? `# ${s}` : s);

const initialText = '# Hot\n\n- first\n- second\n\n# Frosty\n';
const initialSlides = textToSlides(initialText);

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
      this.setState({ text, slides });
    }
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
    // TODO
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
    const text = event.target.value;
    const slides = textToSlides(text);
    this.setState({ slides, text }, () => {
      window.localStorage.setItem('text', LZString.compressToEncodedURIComponent(text))
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

  renderControls = (mode, responsiveSize, text) => {
    const EditControlIcon = editControl[mode].Icon;
    return (
      <Box
        flex={false}
        direction="row"
        align="center"
        justify="between"
        background="dark-1"
      >
        <Button
          icon={<EditControlIcon />}
          hoverIndicator
          onClick={() => this.setState({ mode: editControl[mode].mode })}
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
          icon={<Copy />}
          hoverIndicator
          href={`?t=${LZString.compressToEncodedURIComponent(text)}`}
        />
      </Box>
    );
  }

  render() {
    const { current, mode, slides, text } = this.state;


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
                    <Box tabIndex="-1" fill pad="xlarge" background={`accent-${(current % 3) + 1}`}>
                      <Markdown>{slides[current]}</Markdown>
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
