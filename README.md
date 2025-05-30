# canvas-batch-download-v2

selecting and batch downloading files/attachments from the modules screen

## implementation

- checkboxes next to each downloadable attachment on the modules page
- select all and download button at the top of the page
- on page load, content.js script:
  - injects html and css
  - fetches download links from within each module item
  - injects download links and pdf filenames into each module item as a data attribute
- on click, download button:
  - iterates through each module item with checkbox:checked
  - downloads each module item individually
- on click, select all button:
  - toggles select/unselect all
  
## problems

- due to cors policy in content.js, we cannot fetch download content for each attachment, meaning we cannot zip and download files
  - this results in individual files being downloaded one by one, clogging up downloads folder
- we can use background.js to download content and then zip but becomes messy
- page is very long, have to scroll for a while to select all the items you want
- download button at the top of page, not very user friendly

## solutions
using popup.js instead of content script solves all of these problems
- can customise the layout to make it more scrollable
- can add filters (e.g pdf, pptx etc.)
- fetch works within popup context, allowing us to zip and download files
- easier to add custom ui
