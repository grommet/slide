# grommet-slide

A tool to create and show slide presentations.

Live at: [slides.grommet.io](https://slides.grommet.io)

## Reference

### Syntax

Slides are built
using [Markdown syntax](https://www.markdownguide.org/basic-syntax).
Each heading level 1, `#`, starts
a new slide. If the heading is a single word and there is no other content
before the next slide, a background image will be automatcailly provided.

### Command shortcuts

- **command-e** or **windows-E**: toggles view vs. edit modes
- **ArrowLeft** and **ArrowRight**: previous and next slide
- **1-9**: jump to slide at numbered position
- **Shift**: toggles full screen

### Saving

Your latest edits are saved in your browser's local storage. So,
you can refresh your window without fear of losing anything. But, if you
clear your browser's local storage, you'll lose whatever you've done.

You can change the name of a slide set and it will be saved with that name.
The control in the top left let's you browse your slide sets, create a new one.

### Sharing

The Share control near the upper left allows you to publish your slide set.
This will generate a unique URL you can send
to someone. When they open that URL, they will see your slide set.
They will not be
able to modify the published version.

## Local development

1. `git clone`

1. `yarn install`

1. `yarn start`
