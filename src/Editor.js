import { Box, Button, TextArea, TextInput } from 'grommet';
import { Apps, Share as ShareIcon } from 'grommet-icons';
import React, { useState, useEffect } from 'react';
import Manage from './Manage';
import Share from './Share';
import { characterToSlideIndex } from './slide';
import useDebounce from './useDebounce';

const Editor = ({ set, onChange, setCurrent }) => {
  const [name, setName] = useDebounce(set, 'name', onChange);
  const [text, setText] = useDebounce(set, 'text', onChange);
  const [theme, setTheme] = useDebounce(set, 'theme', onChange);
  const [manage, setManage] = useState();
  const [share, setShare] = useState();

  useEffect(() => {
    const timer = setTimeout(() => {
      // ensure we have the name in our list
      const stored = window.localStorage.getItem('slide-sets');
      const sets = stored ? JSON.parse(stored) : [];
      if (sets.indexOf(name) === -1) {
        sets.unshift(name);
        window.localStorage.setItem('slide-sets', JSON.stringify(sets));
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [name]);

  const checkCaret = (node) => {
    setCurrent(characterToSlideIndex(set.text, node.selectionStart));
  };

  return (
    <Box basis="medium">
      <Box direction="row" align="center" justify="between">
        <Button
          icon={<Apps />}
          hoverIndicator
          onClick={() => setManage(!manage)}
        />
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button
          icon={<ShareIcon />}
          hoverIndicator
          onClick={() => setShare(!share)}
        />
      </Box>
      <TextArea
        fill
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => checkCaret(event.target)}
        onClick={(event) => checkCaret(event.target)}
      />
      <Box flex={false}>
        <TextInput
          placeholder="published theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
        />
      </Box>
      {manage && <Manage setSet={onChange} onClose={() => setManage(false)} />}
      {share && (
        <Share set={set} onChange={onChange} onClose={() => setShare(false)} />
      )}
    </Box>
  );
};

export default Editor;
