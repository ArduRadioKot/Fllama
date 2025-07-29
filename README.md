[README_EN](README) | [README_RU](READMERU)
# Fllama

**Fllama** is a cross-platform desktop chat client built with Electron for working with Ollama.

## Features

- Modern Electron-based interface
- Ollama support
- Windows, macOS (Intel & Apple Silicon), Linux support
- Fast setup and launch

## Technologies

- **Electron** — framework for building desktop applications.
- **Node.js** — for running Electron and managing dependencies.
- **HTML5** — user interface markup.
- **CSS3** — styling and responsive design.
- **JavaScript** — application logic, interaction with Electron and Ollama API.
- **Ollama API** — integration with the local Ollama server for working with language models.

## Requirements

Fllama requires Ollama to be installed on your system.

- **Windows**: Download the installer from the [official Ollama website](https://ollama.com/download/windows) and follow the instructions.
- **macOS**: Download the .dmg from the [official Ollama website](https://ollama.com/download/mac) and move Ollama to the Applications folder.
- **Linux**: Run in terminal:
  ```sh
  curl -fsSL https://ollama.com/install.sh | sh
  ```

Check installation:
```sh
ollama --version
```

## Installation

### Pre-built releases

Download the latest version from [GitHub Releases](https://github.com/ollama/fllama/releases).

### Build from source

1. Clone the repository:
   ```sh
   git clone https://github.com/arduradiokot/fllama.git
   cd fllama
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the app in development mode:
   ```sh
   npm start
   ```
4. To build for your platform:
   - **Windows x64:**  `npm run build:win-x64`
   - **macOS x64:**  `npm run build:mac-x64`
   - **macOS ARM64 (Apple Silicon):**  `npm run build:mac-arm64`
   - **Linux x64:**  `npm run build:linux-x64`

## Project Structure

```
.
├── main.js         # Electron entry point
├── preload.js      # Electron preload script
├── renderer.js     # Renderer (UI) logic
├── index.html      # Main HTML interface
├── style.css       # Application styles
├── build/          # Platform icons
├── dist/           # Platform builds
├── package.json    # Project and build configuration
└── .gitignore
```

## License

This project is licensed under the GNU GPL v2.0. See the [LICENSE]([[LICENSE) file for details.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository and create a new branch for your feature or fix.
2. Write clear commit messages.
3. Open a Pull Request with a description of your changes.

Please follow common code style and contribution guidelines. 