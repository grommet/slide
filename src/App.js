import {
  Box, Button, Grommet, Keyboard, Markdown, ResponsiveContext, TextArea,
} from 'grommet';
import { grommet } from 'grommet/themes';
import { Close, Edit, Next, Previous } from 'grommet-icons';
import React, { Component, Fragment } from 'react';

const textToSlides = text => text.split('#').slice(1).map(s => `#${s}`);

const initialText = '# Title 1\n\n- first\n- second\n\n# Title 2\n';
const initialSlides = textToSlides(initialText);

const editControl = {
  edit: { Icon: Close, mode: 'view' },
  view: { Icon: Edit, mode: 'edit' },
};

const viewContainerProps = {
  edit: { flex: true },
  view: { flex: true },
};

class App extends Component {
  state = {
    current: 0,
    mode: 'edit',
    slides: initialSlides,
    text: initialText,
  }

  onChange = event => {
    const text = event.target.value;
    const slides = textToSlides(text);
    this.setState({ slides, text })
  }

  onNext = () => {
    const { current, slides } = this.state;
    this.setState({ current: Math.min(current + 1, slides.length - 1)});
  }

  onPrevious = () => {
    const { current } = this.state;
    this.setState({ current: Math.max(current - 1, 0)});
  }

  renderControls = (mode, responsiveSize) => {
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
          alignSelf="start"
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

        <Box basis="xxsmall" />
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
                this.renderControls(mode, responsiveSize)}
              <Box flex={true} direction="row">
                {mode !== 'view' && (
                  <Box basis="medium">
                    <TextArea fill value={text} onChange={this.onChange} />
                  </Box>
                )}
                <Box {...viewContainerProps[mode]} overflow="hidden">
                  <Keyboard target="document" onLeft={this.onPrevious} onRight={this.onNext}>
                    <Box fill pad="xlarge" background={`accent-${(current % 3) + 1}`}>
                      <Markdown>{slides[current]}</Markdown>
                    </Box>
                  </Keyboard>
                </Box>
              </Box>
              {responsiveSize === 'small' &&
                this.renderControls(mode, responsiveSize)}
            </Box>
          )}
        </ResponsiveContext.Consumer>
      </Grommet>
    );
  }
}

export default App;
