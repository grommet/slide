import {
  Box, Button, TextArea, TextInput,
} from 'grommet'
import { Apps, Share as ShareIcon } from 'grommet-icons'
import React from 'react'
import Manage from './Manage'
import Share from './Share'

const Editor = ({ set, onChange }) => {
  const [manage, setManage] = React.useState()
  const [share, setShare] = React.useState()

  return (
    <Box basis="medium">
      <Box direction="row" align="center" justify="between">
        <Button
          icon={<Apps />}
          hoverIndicator
          onClick={() => setManage(!manage)}
        />
        <TextInput
          value={set.name || ''}
          onChange={(event) => {
            const nextSet = JSON.parse(JSON.stringify(set))
            nextSet.name = event.target.value
            onChange(nextSet)
          }}
          onBlur={() => {
            // ensure we have the name in our list
            const stored = window.localStorage.getItem('slide-sets')
            const sets = stored ? JSON.parse(stored) : []
            if (sets.indexOf(set.name) === -1) {
              sets.unshift(set.name)
              window.localStorage.setItem('slide-sets', JSON.stringify(sets))
            }
          }}
        />
        <Button
          icon={<ShareIcon />}
          hoverIndicator
          onClick={() => setShare(!share)}
        />
      </Box>
      <TextArea
        fill
        value={set.text}
        onChange={(event) => {
          const nextSet = JSON.parse(JSON.stringify(set))
          nextSet.text = event.target.value
          onChange(nextSet)
        }}
      />
      {manage && <Manage setSet={onChange} onClose={() => setManage(false)} />}
      {share && (
        <Share set={set} onChange={onChange} onClose={() => setShare(false)} />
      )}
    </Box>
  )
}

export default Editor
