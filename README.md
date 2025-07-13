# Form Bot Chrome Extension

An AI-powered Chrome extension that automatically fills web forms using intelligent data generation.

## 🚀 Features

-   🤖 **AI-Powered Form Filling**: Automatically fills any web form with contextually appropriate data
-   📝 **Smart Field Detection**: Detects and fills input fields, textareas, dropdowns, checkboxes, and radio buttons
-   🎯 **On-Demand Filling**: Click the floating icon that appears when you focus on form fields
-   🌍 **Context-Aware**: Maintains consistency across related fields (location, phone numbers, etc.)
-   � **Respects Form Constraints**: Skips readonly and disabled fields automatically

## 📦 Installation

### For Chrome (Manifest V2 Support Required)

Since this extension uses Manifest V2, you need to enable legacy extension support in Chrome:

1. **Enable Manifest V2 Extensions** (Required for Chrome 127+):

    Run this PowerShell command as Administrator:

    ```powershell
    Start-Process "chrome.exe" -ArgumentList "--enable-features=ExtensionManifestV2Available"
    ```

2. **Install the Extension**:
    - Download the extension ZIP file
    - Extract the ZIP file to a folder
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode" (toggle in top-right corner)
    - Click "Load unpacked" and select the extracted folder
    - The Form Bot icon should appear in your extensions toolbar

### For Firefox

1. **Install the Extension**:

    - Download the extension ZIP file
    - Open Firefox and go to `about:debugging`
    - Click "This Firefox" in the left sidebar
    - Click "Load Temporary Add-on"
    - Select the ZIP file (or any file in the extracted folder)
    - The extension will be loaded temporarily

    **For Permanent Installation**:

    - The extension needs to be signed by Mozilla for permanent installation
    - Temporary installation is sufficient for testing and personal use

## 🔧 Setup

1. **Get AI API Key**:

    - Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
    - Or configure your preferred AI service

2. **Configure the Extension**:
    - Click the Form Bot icon in your browser toolbar
    - Enter your personal details in the text area
    - The extension will use this information to fill forms contextually

## 🔒 Privacy

-   Your personal information is stored locally in the extension
-   Form data is processed through AI services for intelligent filling
-   No form data is permanently stored or shared
