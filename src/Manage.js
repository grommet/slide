import { Box, Button, Grid, Heading, Layer, Stack, Text } from 'grommet';
import { Add, Close, Trash } from 'grommet-icons';
import React, { useEffect, useState } from 'react';

const nameToBackground = (name) => {
  let num = 0;
  for (let i = 0; i < name.length; i++) {
    num += name.charCodeAt(i);
  }
  return `graph-${(num % 4) + 1}`;
};

const Choice = ({ href, icon, label, onClick }) => (
  <Box
    fill
    round="small"
    overflow="hidden"
    background={label ? nameToBackground(label) : 'control'}
  >
    <Button fill hoverIndicator href={href} onClick={onClick}>
      <Box fill pad="small" align="center" justify="center">
        {icon}
        {label && (
          <Text size="large" weight="bold">
            {label}
          </Text>
        )}
      </Box>
    </Button>
  </Box>
);

const Manage = ({ onClose, setSet }) => {
  const [sets, setSets] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState();

  useEffect(() => {
    const stored = window.localStorage.getItem('slide-sets');
    if (stored) {
      // prune out non-existing sets
      const nextSets = JSON.parse(stored).filter((name) =>
        localStorage.getItem(name),
      );
      setSets(nextSets);
      localStorage.setItem('slide-sets', JSON.stringify(nextSets));
    }
  }, []);

  const delet = (name) => {
    setConfirmDelete(undefined);
    const nextSets = sets.filter((n) => n !== name);
    localStorage.setItem('slide-sets', JSON.stringify(nextSets));
    localStorage.removeItem(name);
    setSets(nextSets);
  };

  return (
    <Layer position="top" full="horizontal" margin="large" onEsc={onClose}>
      <Box background={{ color: 'background', dark: true }}>
        <Box direction="row" align="center" justify="between">
          <Button icon={<Close />} hoverIndicator onClick={onClose} />
          <Heading
            level={2}
            size="small"
            margin={{ horizontal: 'medium', vertical: 'none' }}
          >
            slide
          </Heading>
        </Box>
        <Grid columns="small" rows="small" gap="medium" margin="medium">
          <Choice
            icon={<Add size="large" />}
            onClick={() => {
              setSet({
                name: new Date().toISOString().slice(0, 10),
                text: '# Welcome',
                theme: '',
              });
              onClose();
            }}
          />
          {sets.map((name) => (
            <Stack key={name} fill anchor="bottom-right">
              <Choice
                key={name}
                label={name}
                href={`/?name=${encodeURIComponent(name)}`}
                onClick={(event) => {
                  if (!event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    const stored = window.localStorage.getItem(name);
                    if (stored) {
                      const nextSet = JSON.parse(stored);
                      nextSet.local = true;
                      setSet(nextSet);
                      onClose();
                    }
                  }
                }}
              />
              <Box direction="row" gap="small">
                {confirmDelete === name && (
                  <Button
                    title="confirm delete"
                    icon={<Trash color="status-critical" />}
                    hoverIndicator
                    onClick={() => delet(name)}
                  />
                )}
                <Button
                  title="delete design"
                  icon={<Trash color="border" />}
                  hoverIndicator
                  onClick={() =>
                    setConfirmDelete(confirmDelete === name ? undefined : name)
                  }
                />
              </Box>
            </Stack>
          ))}
        </Grid>
      </Box>
    </Layer>
  );
};

export default Manage;
