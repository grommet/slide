import { Box, Markdown, Paragraph } from 'grommet';
import React, { useContext, useMemo } from 'react';
import { ThemeContext } from 'styled-components';

const LightBox = (props) => (
  <Box
    pad={{ horizontal: 'xlarge' }}
    background={{ color: 'background', dark: true, opacity: 'strong' }}
    justify="center"
    round="small"
    {...props}
  />
);

const Content = ({ image, index, previous, slide }) => {
  const theme = useContext(ThemeContext);
  // if second line of slide is an image, make it the background,
  // and remove from markdown content
  const lines = slide.split('\n');
  const nonBlankLines = lines.filter((line) => line && line[0] !== '!');
  const secondLine = lines[1] || '';
  const matchImage = secondLine.match(/^!\[.*\]\((.+)\)$/);
  const matchColor = secondLine.match(/^!([\w-!]+)$/);
  let content = slide;
  let background = image || `graph-${(index % 3) + 1}`;
  if (matchImage) {
    background = `url(${matchImage[1]})`;
    lines.splice(1, 1);
    content = lines.join('\n');
  } else if (matchColor && theme.global.colors[matchColor[1]]) {
    background = matchColor[1];
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
    let alignSelf;
    if (lines[0] && lines[0].endsWith(' ')) alignSelf = 'start';
    else if (lines[0] && lines[0].startsWith('#  ')) alignSelf = 'end';
    content = (
      <LightBox
        alignSelf={alignSelf}
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

  const animation = useMemo(() => {
    let type;
    if (index < previous) type = 'slideDown';
    else if (index > previous) type = 'slideUp';
    if (type) return ['fadeIn', { type, size: 'large' }];
    return undefined;
  }, [index, previous]);

  return (
    <Box
      fill
      background={background}
      justify={footer ? 'between' : 'center'}
      align={backgroundImage ? 'center' : undefined}
      animation={animation}
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
