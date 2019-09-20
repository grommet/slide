import { Box, Button, Heading, Layer } from 'grommet'
import { Close } from 'grommet-icons'
import React from 'react'

const Share = ({ set, onClose }) => {
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
            share
          </Heading>
        </Box>
      </Box>
    </Layer>
  )
}

export default Share
