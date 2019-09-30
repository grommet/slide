import { Box, Markdown, Paragraph } from 'grommet';
import React from 'react';

const LightBox = props => (
  <Box
    pad={{ horizontal: 'xlarge' }}
    background={{ color: 'dark-3', opacity: 'medium' }}
    justify="center"
    round="small"
    {...props}
  />
);

const Content = ({ image, index, slide }) => {
  const size = slide.length < 10 ? 'xlarge' : 'large';
  const textAlign = slide.indexOf('\n') === -1 ? 'center' : 'start';
  const components = {
    h1: { props: { textAlign, size } },
    h2: { props: { textAlign, size } },
    h3: { props: { textAlign, size } },
    p: { props: { textAlign, size } },
    ul: { component: Box, props: { as: 'ul', margin: { left: 'medium' } } },
    ol: { component: Box, props: { as: 'ol', margin: { left: 'medium' } } },
    li: { component: Paragraph, props: { as: 'li', size } },
  };

  // if second line of slide is an image, make it the background,
  // and remove from markdown content
  const lines = slide.split('\n');
  const secondLine = lines[1] || '';
  const match = secondLine.match(/^!\[.*\]\((.+)\)$/);
  let content = slide;
  let background = image || `accent-${(index % 3) + 1}`;
  if (match) {
    background = `url(${match[1]})`;
    lines.splice(1, 1);
    content = lines.join('\n');
  }
  content = <Markdown components={components}>{content}</Markdown>;

  const backgroundImage = background.slice(0, 4) === 'url(';
  if (backgroundImage) {
    content = <LightBox>{content}</LightBox>;
  }

  return (
    <Box
      fill
      pad="xlarge"
      background={background}
      justify="center"
      align={backgroundImage ? 'center' : undefined}
    >
      {content}
    </Box>
  );
};

export default Content;
