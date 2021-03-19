# grommet-slide

A tool to create and show slide presentations.

Live at: [slides.grommet.io](https://slides.grommet.io)

## Reference

### Syntax

Slides are built
using [Markdown syntax](https://www.markdownguide.org/basic-syntax).
Each heading level 1, `#`, starts
a new slide. If the heading is a single word and there is no other content
before the next slide, a background image will be automatically provided.

#### background image

By default, a slide that has just a one word heading and nothing else will
automatically be given a background image associated with that word.

You can set a custom background image by adding a Markdown image,
`![caption](image-url)` on the line just after the `#` line. The default is for the image to cover the whole background. If instead you want to contain the whole image, just append ` contain` after the image Markdown on the same line. For example: `![caption](image-url) contain`.

##### text alignment

You can align the text over the image by including an extra space before or
after the word. So, `# name` will justify name to the left and `# name` will
justify name to the right.

##### footer text

You can add a footer the the lightbox over the image by leaving two blank
lines after the `#` and then having a single line of text before the last
blank line in that slide.

#### background color

By default, a slide without a background image is given a background color
based on the `graph-*` colors in the theme.

You can set a custom background color by specifying a color name via
`!color-name` on the line just after the `#` line.

#### text size

Text sizing is automatically scaled based on the amount of text, to a point.
If you find you need an even smaller text size, you are probably putting too
much content on the slide.

#### footer

If there is no blank line before the next slide `#` and there are two blank
lines before it, the last line of text will be placed in a footer.

### Command shortcuts

- **command-.** or **control-.**: toggles view vs. edit modes
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
