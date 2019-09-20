import { Box, Button, Grid, Heading, Layer, Text } from 'grommet'
import { Add, Close } from 'grommet-icons'
import React from 'react'

const nameToBackground = (name) => {
  let num = 0;
  for (let i = 0; i < name.length; i++) {
    num += name.charCodeAt(i);
  }
  return `accent-${(num % 4) + 1}`;
};

const Choice = ({ icon, label, onClick }) => (
  <Box
    fill
    round="small"
    overflow="hidden"
    background={label ? nameToBackground(label) : 'dark-3'}
  >
    <Button fill hoverIndicator onClick={onClick}>
      <Box fill pad="small" align="center" justify="center">
        {icon}
        {label && <Text size="large" weight="bold">{label}</Text>}
      </Box>
    </Button>
  </Box>
)

const Manage = ({ onClose, setSet }) => {
  const [sets, setSets] = React.useState([])

  React.useEffect(() => {
    const stored = window.localStorage.getItem('slide-sets')
    if (stored) {
      setSets(JSON.parse(stored))
    }
  }, [])

  return (
    <Layer
      position="top"
      full="horizontal"
      margin="large"
      onEsc={onClose}
    >
      <Box background="dark-1">
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
                name: (new Date()).toISOString().slice(0, 10),
                text: '# Welcome',
              })
              onClose()
            }}
          />
          {sets.map(set => (
            <Choice
              key={set}
              label={set}
              onClick={() => {
                const stored = window.localStorage.getItem(set)
                if (stored) {
                  setSet(JSON.parse(stored))
                  onClose()
                }
              }}
            />
          ))}
        </Grid>
      </Box>
    </Layer>
  )
}

export default Manage
