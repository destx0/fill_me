# Form Bot Chrome Extension

A Chrome extension that analyzes web pages to find the deepest DOM element containing ≥80% of all form elements (inputs, selects, textareas) and saves a cleaned version of the HTML.

## Features

-   🔍 **Smart Form Detection**: Analyzes the DOM structure to find the most specific container holding the majority of form elements
-   📊 **Detailed Analysis**: Shows element tag, ID, class, depth, and form element count statistics
-   🎯 **Visual Highlighting**: Temporarily highlights the found element on the page
-   💻 **Developer Console Logging**: Provides detailed console output for debugging
-   🧹 **HTML Cleaning**: Strips unnecessary attributes (styles, scripts, etc.) from the extracted HTML
-   💾 **Auto-Save**: Automatically downloads the cleaned HTML structure as a file
-   🌐 **Real-World Ready**: Optimized for complex websites like job application forms

## How It Works

The extension walks through all DOM elements and:

1. Counts the total number of form elements (`<input>`, `<select>`, `<textarea>`) on the page
2. Focuses on likely form containers to improve performance
3. For each element, counts how many form elements are contained in its subtree
4. Finds elements that contain ≥80% of all form elements
5. Returns the deepest (most specific) element that meets the criteria
6. Strips unnecessary HTML attributes and saves a clean version

## Installation

1. Build the extension:

    ```bash
    pnpm install
    pnpm build
    ```

2. Load the extension in Chrome:
    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" (toggle in top right)
    - Click "Load unpacked" and select the `dist` folder

## Usage

1. Navigate to any webpage with form inputs
2. Click the Form Bot extension icon in the toolbar
3. Click "Analyze Current Page" button
4. View the results in the popup
5. The target element will be highlighted on the page for 3 seconds

## Testing

A test page is included (`test-page.html`) with multiple forms and inputs to test the extension. Open it in your browser and run the analysis.

## Files Structure

-   `src/popup.tsx` - Extension popup UI (React)
-   `src/content.ts` - Content script that analyzes the DOM
-   `src/background.ts` - Background service worker
-   `src/manifest.json` - Extension manifest
-   `test-page.html` - Test page with sample forms

## Example Output

```
Element: <div>
ID: main-form-container
Class: container form-wrapper
Depth: 5
Contains: 18 of 20 inputs (90%)
```

The extension will highlight the found element and log detailed information to both the popup and browser console.

## Technical Details

-   Built with React, TypeScript, and Vite
-   Uses the webextension-polyfill for cross-browser compatibility
-   Implements Chrome Extension Manifest V3
-   Content script injection for DOM analysis
-   Message passing between popup and content script

## Development

To run in development mode:

```bash
pnpm dev
```

This will start the Vite development server and watch for changes.
