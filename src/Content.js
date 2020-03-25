import { Box, Markdown, Paragraph } from 'grommet';
import React from 'react';

const LightBox = (props) => (
  <Box
    pad={{ horizontal: 'xlarge' }}
    background={{ color: 'background', dark: false, opacity: 'medium' }}
    justify="center"
    round="small"
    {...props}
  />
);

const Content = ({ image, index, slide }) => {
  // if second line of slide is an image, make it the background,
  // and remove from markdown content
  const lines = slide.split('\n');
  const secondLine = lines[1] || '';
  const match = secondLine.match(/^!\[.*\]\((.+)\)$/);
  let content = slide;
  let background = image || `graph-${(index % 3) + 1}`;
  if (match) {
    background = `url(${match[1]})`;
    lines.splice(1, 1);
    content = lines.join('\n');
  }
  if (lines[0] === '# ') {
    lines.splice(0, 1);
    content = lines.join('\n');
  }

  // base the size on the number of lines
  const headingSize = lines.length < 5 ? 'xlarge' : 'large';
  const textSize = lines.length < 5 ? 'xxlarge' : 'xlarge';
  const textAlign = slide.indexOf('\n') === -1 ? 'center' : 'start';
  const components = {
    h1: { props: { textAlign, size: headingSize } },
    h2: { props: { textAlign, size: headingSize } },
    h3: { props: { textAlign, size: headingSize } },
    p: { props: { textAlign, size: textSize } },
    ul: { component: Box, props: { as: 'ul', margin: { left: 'medium' } } },
    ol: { component: Box, props: { as: 'ol', margin: { left: 'medium' } } },
    li: { component: Paragraph, props: { as: 'li', size: textSize } },
  };

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
