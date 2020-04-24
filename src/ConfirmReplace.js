import React from 'react';
import { Box, Button, Layer, Paragraph, Text } from 'grommet';

const ConfirmReplace = ({ set, nextSet, onDone }) => (
  <Layer
    position="top"
    margin="medium"
    modal
    onEsc={() => onDone(undefined)}
    onClickOutside={() => onDone(undefined)}
  >
    <Box pad="large">
      <Paragraph>
        You already have a slide deck named{' '}
        <Text weight="bold">{set.name}</Text>. If you make a change, you will
        replace your local copy. If you do not want to replace your copy, you
        should rename this slide set.
      </Paragraph>
      <Box direction="row" align="center" gap="medium">
        <Button
          label={`Replace my ${set.name}`}
          onClick={() => {
            nextSet.derivedFromId = set.id;
            nextSet.local = true;
            onDone(nextSet);
          }}
        />
        <Button label="Discard change" onClick={() => onDone(undefined)} />
      </Box>
    </Box>
  </Layer>
);

export default ConfirmReplace;
