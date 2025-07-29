# Fllama

**Fllama** — это кроссплатформенный десктопный чат-клиент на Electron для работы с Ollama.

## Возможности

- Современный интерфейс на Electron
- Поддержка Windows, macOS (Intel и Apple Silicon), Linux
- Быстрая установка и запуск
- Поддержка автосборки и автопакетирования для всех платформ

## Скриншот

> _Добавьте сюда скриншот интерфейса, если есть_

## Установка

### Готовые сборки

Скачайте актуальные сборки из папки `dist`:

- **Windows:**  
  `Fllama Setup 1.0.0.exe`
- **macOS (Intel):**  
  `Fllama-1.0.0.dmg`
- **macOS (Apple Silicon):**  
  `Fllama-1.0.0-arm64.dmg`
- **Linux (AppImage):**  
  `Fllama-1.0.0.AppImage`
- **Linux (DEB):**  
  `Fllama_1.0.0_amd64.deb`

### Сборка из исходников

1. Клонируйте репозиторий:
   ```sh
   git clone https://github.com/arduradiokot/fllama.git
   cd fllama
   ```

2. Установите зависимости:
   ```sh
   npm install
   ```

3. Запустите приложение в режиме разработки:
   ```sh
   npm start
   ```

4. Для сборки под нужную платформу используйте:
   - **Windows x64:**  
     `npm run build:win-x64`
   - **macOS x64:**  
     `npm run build:mac-x64`
   - **macOS ARM64 (Apple Silicon):**  
     `npm run build:mac-arm64`
   - **Linux x64:**  
     `npm run build:linux-x64`

## Структура проекта

```
.
├── main.js         # Точка входа Electron
├── preload.js      # Preload-скрипт для Electron
├── renderer.js     # Логика рендерера (UI)
├── index.html      # Основной HTML интерфейс
├── style.css       # Стили приложения
├── build/          # Иконки для разных платформ
├── dist/           # Сборки для разных платформ
├── package.json    # Конфигурация проекта и сборки
└── .gitignore
```

## Конфигурация и сборка

В проекте используется [electron-builder](https://www.electron.build/). Все параметры сборки и платформы описаны в `package.json` в секции `build`.

## Контакты

**Автор:** ArduRadioKot  
**Email:** frogeesoft.team@gmail.com  