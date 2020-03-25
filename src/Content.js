import { Box, Markdown, Paragraph } from 'grommet';
import React from 'react';

const LightBox = (props) => (
  <Box
    pad={{ horizontal: 'xlarge' }}
    background={{ color: 'background', dark: true, opacity: 'strong' }}
    justify="center"
    round="small"
    {...props}
  />
);

const Content = ({ image, index, slide, theme }) => {
  // if second line of slide is an image, make it the background,
  // and remove from markdown content
  const lines = slide.split('\n');
  const nonBlankLines = lines.filter((line) => line && line[0] !== '!');
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
  const last = lines.length - 1;
  let footer;
  if (last > 1 && !lines[last - 2] && !lines[last - 1]) {
    footer = lines[last] + '\n';
    lines.splice(last - 2, 3);
    content = lines.join('\n');
  }

  // base the size on the number of lines
  const headingSize = nonBlankLines.length < 5 ? 'xlarge' : 'large';
  const textSize = nonBlankLines.length < 5 ? 'xxlarge' : 'xlarge';
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
    content = (
      <LightBox
        alignSelf={lines[0].endsWith(' ') ? 'start' : undefined}
        round={(theme && theme.rounding && `${theme.rounding}px`) || 'small'}
      >
        {content}
      </LightBox>
    );
  } else {
    content = <Box pad="xlarge">{content}</Box>;
  }

  const footerComponents = {
    p: { props: { textAlign, size: textSize, margin: 'none' } },
  };

  return (
    <Box
      fill
      background={background}
      justify={footer ? 'between' : 'center'}
      align={backgroundImage ? 'center' : undefined}
    >
      {content}
      {footer && (
        <Box
          alignSelf="stretch"
          background={{ color: 'background', dark: true }}
          pad="medium"
        >
          <Markdown components={footerComponents}>{footer}</Markdown>
        </Box>
      )}
    </Box>
  );
};

export default Content;
