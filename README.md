# dialog-js

A simple dialog component made with HTML, CSS and JS.

It does have a backdrop, a close button and a loading spinner, and allows for easy customization.

## Installation

Load styles and script definitions
```html
<head>
    <!-- Other third party libraries -->
    <link rel="stylesheet" href="dialog.css" />
    <!-- Your style overrides -->
</head>
<body>
    <!-- Other third party libraries -->+
    <script src="dialog.js"></script>
</body>
```

Be sure to link `dialog.css` and `dialog.js` after any third-party libraries, and if you want to customize your dialogs, include style-overrides after `dialog.css`.


## How to use

Create a div element with the class `dialog`
```html
<div id="my-dialog" class="dialog">
    <h1>My Dialog</h1>
</div>
```
*Note: Make sure to set a `z-index` property for your dialog, it will be used to position the backdrop and close button*

Use the Dialog class and assign it the dialog element in the constructor along with a configuration object:

```js
// Find the dialog content
const dialogElement = document.querySelector("#my-dialog")

// Wrap the content inside a Dialog object
const myDialog = new Dialog(dialogElement, {
    backdrop: true, // Enable/Disable backdrop (default: true)
    backdropCanClose: true, // Choose if backdrop can close dialog (default: true)
    closeButton: true, // Enable/Disable close button (default: true)
    closeButtonPosition: "right" // Set the top corner position for the close button ("left" or "right", default: right)
    dom: true, // Switch this to false in order to use the string returned by onshow() callback as the dialog html. (default: true)
    onshow: () => {
        // Called after the dialog window opens with the spinner visible
        // If an HTML string is returned and 'dom' is false, it will replace the contents of the dialog box
        return ""
    },
    onload: () => {
        // Called after the content has been loaded and displayed
    },
    onclose: () => {
        // Called before each closing event,
        // return false in order to prevent the dialog from closing
    }
})

// Show the dialog
myDialog.show()

// Close the dialog
myDialog.close()
```