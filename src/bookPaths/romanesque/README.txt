BINDING A ROMANESQUE BOOK
Interactive activity: the learner makes each binding decision and the drawing changes.

HOW TO OPEN IT
  From a folder: unpack the zip and double-click index.html. It opens in your browser.
  On a web server: copy the whole folder to the server and link to index.html.
  Nothing is loaded from other websites (no fonts, scripts or tracking).

WHAT IS IN THE FOLDER
  index.html   the page (layout, styling and the small program that stacks the drawings)
  steps.js     all texts, options, and the list of which drawing appears when
               (keep its first two lines; the rest can be edited in any text editor)
  svg/         web copies of the drawings
  img/         drawing 58 as a picture (the SVG is 57 MB)

CHANGING TEXTS OR OPTIONS (steps.js, "steps")
  title, short        heading and the label in the row of stages
  text                paragraphs shown before the options
  question            the line above the options
  options             value = internal name, label = what the learner reads
                      "disabled": "in preparation" greys an option out
                      "when": {...} shows an option only after an earlier choice
  after               paragraphs shown after the options
  figures             small pictures beside the text
  scene / before      which picture is on the sheet after / before the learner chooses

CHANGING WHAT IS DRAWN (steps.js, "scenes")
  A scene is a list of drawings from bottom to top. A drawing with "when" only appears
  for that choice, e.g. {"draw": "39B", "when": {"lining": "patch"}}.
  "view" is the part of the sheet that is shown: [left, top, width, height].

ALIGNMENT OF THE DRAWINGS (steps.js, "drawings")
  "at": [x, y] moves a drawing so that it lines up with the others.
  Book drawings are lined up on drawing 72, boards on drawing 29, the sewing frame
  on reference drawing 12R. To nudge a drawing, change these two numbers.

THE DRAWINGS
  The files in svg/ are copies of the Illustrator exports with three kinds of change:
  1. Illustrator's private editing data and switched-off layers were removed and the
     numbers shortened. Nothing visible changes; the files are much smaller.
  2. Parts were taken out of some drawings so they can be used as overlays:
       81/82/83-sewing-overlay   81, 82, 83 without their own book block
       08/09-holes-only          the holes of 08 and 09, to put on the trimmed block 90
  3. 49 was exported with all its layers hidden; they are switched on.
  Three files are new: 29/30/31b-backing.svg are plain white shapes with the outline of
  the board. The wood texture is see-through, and without them the sewing supports
  would show through the board.
