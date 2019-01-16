import {
  Box, Button, Grommet, Keyboard, Markdown, TextArea,
} from 'grommet';
import { grommet } from 'grommet/themes';
import { Close, Edit, Next, Previous } from 'grommet-icons';
import React, { Component } from 'react';

const textToSlides = text => text.split('#').slice(1).map(s => `#${s}`);

const initialText = '# Title 1\n\n- first\n- second\n\n# Title 2\n';
const initialSlides = textToSlides(initialText);

const editContainerProps = {
  both: { basis: 'medium', flex: false },
  edit: { flex: true },
  view: { basis: 'xxsmall', flex: false },
};

const editControl = {
  both: { Icon: Close, mode: 'view' },
  edit: { Icon: Previous, mode: 'both' },
  view: { Icon: Edit, mode: 'both' },
};

const viewContainerProps = {
  both: { flex: true },
  edit: { basis: 'xxsmall', flex: false },
  view: { flex: true },
};

const viewControl = {
  both: { Icon: Previous, mode: 'view' },
  edit: { Icon: Previous, mode: 'both' },
  view: { Icon: Next, mode: 'both' },
};

class App extends Component {
  state = {
    current: 0,
    mode: 'both',
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

  render() {
    const { current, mode, slides, text } = this.state;
    const EditControlIcon = editControl[mode].Icon;
    const ViewControlIcon = viewControl[mode].Icon;
    return (
      <Grommet full theme={grommet}>
        <Box fill>
          <Box flex={true} direction="row">
            <Box {...editContainerProps[mode]} background="dark-1">
              <Box flex={false}>
                <Button
                  alignSelf="start"
                  icon={<EditControlIcon />}
                  hoverIndicator
                  onClick={() => this.setState({ mode: editControl[mode].mode })}
                />
              </Box>
              {mode !== 'view' && (
                <TextArea fill value={text} onChange={this.onChange} />
              )}
            </Box>
            <Box {...viewContainerProps[mode]} overflow="hidden">
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
                  onClick={this.onPrevious}
                />
                <Button
                  icon={<Next />}
                  hoverIndicator
                  onClick={this.onNext}
                />
              </Box>
              {mode !== 'edit' && (
                <Keyboard target="document" onLeft={this.onPrevious} onRight={this.onNext}>
                  <Box fill pad="xlarge" background={`accent-${(current % 3) + 1}`}>
                    <Markdown>{slides[current]}</Markdown>
                  </Box>
                </Keyboard>
              )}
            </Box>
          </Box>
        </Box>
      </Grommet>
    );
  }
}

export default App;
