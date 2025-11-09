/*
MIT License

Copyright (c) 2023 Stefano Raneri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * @typedef {Object} DialogConfig
 * @property {boolean} [backdrop=true] Enable/disable backdrop
 * @property {boolean} [backdropCanClose=true] Whether clicking backdrop closes the dialog
 * @property {boolean} [closeButton=true] Whether to show a close button
 * @property {"left"|"right"} [closeButtonPosition="right"] Top corner position of the close button (default: right)
 * @property {boolean} [dom=true] If false, use the string returned by onshow instead of the DOM element
 * @property {() => string|void} [onshow] Called after the dialog box opens.
 * @property {() => void} [onload] Called after the content has been loaded and displayed.
 * @property {() => boolean|void} [onclose] Called before each closure; returns false to cancel the closure.
 */
class Dialog {

    is_open;
    #defaultConfig = {
        backdrop: true,
        backdropCanClose: true,
        closeButton: true,
        closeButtonPosition: "right",
        dom: true
    }

    /**
   * Create and initialize a Dialog.
   * @param {HTMLElement} dialogElement The dialog container element.
   * @param {DialogConfig} [config] Object for configuration options.
   */
    constructor(dialogElement, config) {
        this.dialogContentElement = dialogElement

        this.config = config ?? {}
        this.#initConfig()

        this.dialogContainer = undefined
        this.dialogCloseButton = undefined
        this.dialogSpinner = undefined

        this.is_open = false
        this.#initDialog()
    }

    #initConfig() {
        for (const k in this.#defaultConfig) {
            if (this.config[k] === undefined) {
                this.config[k] = this.#defaultConfig[k]
            }
        }
    }

    #initDialog() {

        if (this.dialogContentElement == null) {
            throw new Error("Dialog content element is null")
        }

        if (false === this.dialogContentElement.classList.contains("dialog")) {
            throw new Error("Dialog content element must have class 'dialog'")
        }

        // Grab z-index of dialog element
        const dialogZIndex = (parseInt(window.getComputedStyle(this.dialogContentElement).zIndex) || 0)

        // Container
        this.dialogContainer = document.createElement("div")
        this.dialogContainer.classList.add("dialog-container")
        this.dialogContainer.style.zIndex = dialogZIndex // Same depth as content

        // Backdrop
        this.dialogBackdrop = document.createElement("div")
        this.dialogBackdrop.classList.add("dialog-backdrop")
        this.dialogBackdrop.style.zIndex = dialogZIndex - 1  // Behind dialog

        // Check if this backdrop is configured to close the dialog on click
        if (this.config.backdropCanClose !== false) {
            this.dialogBackdrop.addEventListener("click", (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.close()
            })
        }

        // Close button
        if (this.config["closeButton"] === true) {
            this.dialogCloseButton = document.createElement("button")
            this.dialogCloseButton.classList.add("dialog-close-button")
            this.dialogCloseButton.style.zIndex = dialogZIndex + 1 // In front dialog

            if (this.config.closeButtonPosition === "right") {
                this.dialogCloseButton.classList.add("right")
            } else if (this.config.closeButtonPosition === "left") {
                this.dialogCloseButton.classList.add("left")
            }

            this.dialogCloseButton.addEventListener("click", (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.close()
            })
        }

        // Loading spinner
        this.dialogSpinner = this.#createSpinner()

        // Construct dialog
        const prevNode = this.dialogContentElement.cloneNode(true)

        if (this.dialogCloseButton != null) {
            this.dialogContainer.appendChild(this.dialogCloseButton)
        }

        this.dialogContainer.appendChild(prevNode)
        this.dialogContainer.appendChild(this.dialogSpinner)

        this.dialogContentElement.replaceWith(this.dialogContainer)
        this.dialogContentElement = prevNode
    }

    #createSpinner() {
        const spinner = document.createElement("div")
        spinner.classList.add("spinner")
        spinner.style.opacity = "0"

        const spinnerContainer = document.createElement("div")
        spinnerContainer.classList.add("spinner-container")

        const spinnerRotator = document.createElement("div")
        spinnerRotator.classList.add("spinner-rotator")

        const spinnerCircle = document.createElement("div")
        spinnerCircle.classList.add("spinner-circle")

        const spinnerLeft = document.createElement("div")
        spinnerLeft.classList.add("spinner-left")
        spinnerLeft.appendChild(spinnerCircle)

        const spinnerRight = document.createElement("div")
        spinnerRight.classList.add("spinner-right")
        spinnerRight.appendChild(spinnerCircle)

        spinnerRotator.appendChild(spinnerLeft)
        spinnerRotator.appendChild(spinnerRight)

        spinnerContainer.appendChild(spinnerRotator)
        spinner.appendChild(spinnerContainer)
        return spinner
    }

    #showSpinner() {
        this.dialogSpinner.style.opacity = "1"
    }

    #hideSpinner() {
        this.dialogSpinner.style.opacity = "0"
    }

    #closeDialog() {
        this.dialogContentElement.removeAttribute("open")
        this.dialogContainer.removeAttribute("open")
        this.dialogBackdrop.remove()

        if (this.config["dom"] !== true) {
            // Clear html if this is not a DOM based dialog
            this.dialogContentElement.innerHTML = ""
        }
    }

    close() {

        if (this.is_open !== true) {
            console.warn("Closing a Dialog while it's already closed")
            return
        }

        // Run onclose callback if exists
        if (typeof this.config["onclose"] === "function") {
            // Check if we should block dialog closing
            if (false === this.config.onclose()) {
                return
            }
        }

        // Close dialog
        this.#closeDialog()
        this.is_open = false
    }

    show() {

        if (this.is_open !== false) {
            console.warn("Opening a Dialog while it's already opened")
            return
        }

        // Show dialog
        this.#showSpinner()

        if (this.config.backdrop !== false) {
            // Insert and configure backdrop
            this.dialogContainer.insertAdjacentElement("beforebegin", this.dialogBackdrop)
        }

        this.dialogContainer.setAttribute("open", "")

        // Set the dialog status as open
        this.is_open = true

        if (typeof this.config["onshow"] === "function") {
            // Run onshow callback if exists
            const result = this.config.onshow()
            if (this.config["dom"] !== true &&
                typeof result === "string") {

                // Check if dialog was closed before loading content
                if (this.is_open !== true) {
                    return
                }

                // Load html into the dialog element
                this.dialogContentElement.innerHTML = result
            }
        }

        // Show dialog content
        this.#hideSpinner()
        this.dialogContentElement.setAttribute("open", "")

        // Run onload callback if exists
        if (typeof this.config["onload"] === "function") {
            this.config.onload()
        }
    }
}