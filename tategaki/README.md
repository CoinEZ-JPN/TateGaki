# TateGaki - Vertical Writing Extension for VSCode

TateGaki (縦書き) is a VSCode extension that enables vertical writing, primarily designed for Japanese text in .txt files.

![Screenshot](assets/ss.png)

## Features

- Opens the currently active .txt file in an embedded vertical text editor (top to bottom, right to left)
- Syncs with the original .txt file on save
- Automatically saves content when closing the vertical editor
- Works exclusively with .txt files

## Usage

1. Open a `.txt` file in VSCode.
2. Use the command palette (F1 or `Ctrl+Shift+P`) and search for "Open Vertical Editor".
3. Edit your text in the vertical editor.
4. Use Cmd+S (Mac) or Ctrl+S (Windows/Linux) to save changes.
5. Close the vertical editor when done - changes will be automatically saved.

## Requirements

- Visual Studio Code version **1.91.0** or higher

## Known Issues

- Currently only supports `.txt` files.
- May not handle complex text layouts or mixed scripts optimally.

## Release Notes

### 0.0.2

- Added automatic save functionality when closing the vertical editor
- Improved sync between vertical editor and original file (BUG FIX)

### 0.0.1

- Initial release of TateGaki
  - Basic vertical text transformation
  - Sync with original .txt file
  - .txt file restriction

## License

This extension is licensed under the MIT License.

## Support the Project

If you find this extension helpful, consider buying me a coffee:
[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/extensions)