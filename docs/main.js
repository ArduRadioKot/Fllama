const ru = {
  skip: 'Перейти к содержанию',
  navigation: 'Навигация по сайту',
  navPreview: 'Интерфейс',
  navWorkflow: 'Как работает',
  navDownload: 'Скачать',
  heroTitle: "Агенты параллельно.",
  heroBody: "Запускайте агентов в отдельных Git worktree, переключайте задачи и проверяйте изменения в одном окне.",
  getFllama: 'Скачать Fllama',
  seePreview: 'Посмотреть интерфейс',
  previewLabel: 'Интерактивный пример',
  projects: 'Проект',
  demoTasks: 'Примеры задач',
  demoViews: 'Вид задачи',
  searchName: "Исправить стриминг",
  testsName: "Добавить Kilo Gateway",
  runTab: 'Запуск',
  diffTab: 'Изменения',
  runComplete: 'Задача выполнена',
  sampleData: 'Пример проекта',
  caption: "Интерактивный пример. Выберите задачу и откройте «Изменения», чтобы увидеть Git diff.",
  providerTitle: 'Агенты и модели',
  cliList: 'Агенты для кода',
  providerList: 'Облачные API',
  screenshotsTitle: 'Как выглядит Fllama',
  screenshotsIntro: 'Скриншоты тестовой сборки Fllama 2.0 на macOS с примером проекта.',
  workspaceAlt: 'В Fllama открыт проект с задачей, полем ввода и панелью запуска',
  workspaceCaption: 'Слева проекты и задачи, в центре поле ввода, справа подробности запуска.',
  changesAlt: 'Панель «Изменения» в Fllama показывает файл и его Git diff',
  changesCaption: 'Вкладка «Изменения» показывает список файлов и Git diff выбранного файла.',
  providersAlt: 'Настройки провайдеров моделей в Fllama',
  providersCaption: 'Параметры подключения локальных серверов и облачных API.',
  providerIntro: 'Выберите установленного агента или подключите провайдера моделей. Настройки агента и модели сохраняются для каждой задачи.',
  cliSetup: 'Установите нужный CLI и войдите в его аккаунт. Для OpenCode можно указать адрес уже запущенного сервера.',
  localTitle: 'Локальные модели',
  localSetup: 'Запустите Ollama или локальный сервер LM Studio. Fllama покажет установленные модели и поможет скачать модели из каталога Ollama, включая Qwen2.5 Coder.',
  apiSetup: 'Введите данные в настройках. Для другого OpenAI-совместимого сервера укажите базовый URL API и при необходимости ID модели.',
  workflowTitle: "Своя ветка для задачи.",
  workflowIntro: 'Git worktree создаёт рабочую копию из текущего коммита. Агенты в разных копиях могут редактировать файлы параллельно.',
  workflow1Title: 'Откройте проект',
  workflow1Body: 'Для работы с worktree откройте корень Git-репозитория. Выберите агента и модель, затем опишите задачу. Для диалога без файлов откройте задачу без проекта.',
  workflowStartTitle: 'Выберите рабочую папку',
  workflowStartBody: 'В режиме Worktree ветка и рабочая копия создаются при первом запуске. В режиме «Папка проекта» агент работает с текущими файлами. Дождитесь завершения запуска, прежде чем начать другую задачу в той же папке.',
  workflow2Title: 'Проверьте изменения',
  workflow2Body: 'Во вкладке «Запуск» видны статус и действия агента. «Файлы» показывает содержимое рабочей копии, а «Изменения» открывает Git diff выбранного файла.',
  workflow3Title: 'Передайте задачу',
  workflow3Body: 'Новая задача получит предыдущий запрос и ответ. Если работа шла в worktree, следующий агент сможет проверить правки в той же ветке и рабочей копии.',
  downloadNotice: 'По ссылкам ниже доступны установщики v1.0.0 с чатом для Ollama. На скриншотах выше показана тестовая сборка Fllama 2.0.',
  macFormat: 'Образ диска',
  installer: 'Установщик',
  allReleases: 'Все релизы',
  sourceTitle: 'Запустить из исходников',
  sourceBody: 'Для запуска версии из репозитория понадобятся Git и Node.js.',
  terminal: 'Терминал',
  copy: 'Копировать',
  browseSource: 'Открыть репозиторий',
  faqTitle: 'Частые вопросы',
  faq1Question: 'Можно ли запускать модели локально?',
  faq1Answer: 'Да. Запустите Ollama или LM Studio и выберите установленную модель. При работе с облачными провайдерами контекст задачи может передаваться их сервисам.',
  faq2Question: 'Что будет с незакоммиченными правками?',
  faq2Answer: 'Они останутся в исходной рабочей копии. Новый worktree создаётся из коммита. Для работы с текущими файлами выберите режим «Папка проекта».',
  faq3Question: 'Как объединить ветки?',
  faq3Answer: 'Проверьте diff в Fllama, затем выполните слияние средствами Git.',
  faq4Question: 'Что будет после удаления задачи?',
  faq4Answer: 'Fllama удалит задачу и её переписку. Git worktree и ветка останутся на диске.',
  faq5Question: 'Какие ключи нужны для запуска?',
  faq5Answer: 'Локальные Ollama и LM Studio могут работать без облачного API-ключа. CLI-агенты используют собственную авторизацию. Для облачных API обычно нужен ключ. В Kilo Gateway можно выбрать модель с суффиксом :free.',
  footerFaq: 'Вопросы',
    "ollamaCaption": "Чат и каталог моделей Ollama в Fllama 1.0.0",
    "ollamaChatAlt": "Ответ модели Ollama в Fllama 1.0.0",
    "ollamaModelsAlt": "Каталог моделей Ollama в Fllama 1.0.0",
};

const otherLocales = {
  "de": {
    "skip": "Zum Inhalt springen",
    "navigation": "Hauptnavigation",
    "navPreview": "Arbeitsbereich",
    "navWorkflow": "Ablauf",
    "navDownload": "Downloads",
    "heroTitle": "Agenten parallel starten.",
    "heroBody": "Starte Agenten in separaten Git-Worktrees. Wechsle zwischen Aufgaben und prüfe ihre Änderungen im selben Arbeitsbereich.",
    "getFllama": "Fllama herunterladen",
    "seePreview": "Arbeitsbereich ansehen",
    "previewLabel": "Interaktive Vorschau",
    "projects": "Projekt",
    "demoTasks": "Beispielaufgaben",
    "demoViews": "Aufgabenansicht",
    "searchName": "Streaming reparieren",
    "testsName": "Kilo Gateway hinzufügen",
    "runTab": "Ausführung",
    "diffTab": "Änderungen",
    "runComplete": "Ausführung abgeschlossen",
    "sampleData": "Beispielprojekt",
    "caption": "Interaktive Vorschau. Wähle eine Aufgabe und öffne „Änderungen“ für den Git-Diff.",
    "providerTitle": "Agenten und Modelle",
    "cliList": "Coding-Agenten",
    "providerList": "API-Anbieter",
    "screenshotsTitle": "Fllama im Einsatz",
    "screenshotsIntro": "Screenshots des Entwicklungsstands von Fllama 2.0 auf macOS mit einem Beispielprojekt.",
    "workspaceAlt": "Fllama mit Projekt, Aufgabeneingabe und Ausführungsdetails",
    "workspaceCaption": "Links stehen Projekte und Aufgaben, in der Mitte die Eingabe und rechts die Ausführungsdetails.",
    "changesAlt": "Fllama zeigt eine geänderte Datei und ihren Git-Diff",
    "changesCaption": "Unter „Änderungen“ findest du die geänderten Dateien und den Git-Diff der ausgewählten Datei.",
    "providersAlt": "Einstellungen für Modellanbieter in Fllama",
    "providersCaption": "Einstellungen für lokale Modellserver und Cloud-APIs.",
    "providerIntro": "Wähle einen installierten Coding-Agenten oder verbinde einen Modellanbieter. Agent und Modell werden pro Aufgabe gespeichert.",
    "cliSetup": "Installiere das gewünschte CLI und melde dich dort an. OpenCode kann auch einen laufenden Server verwenden.",
    "localTitle": "Lokale Modelle",
    "localSetup": "Starte Ollama oder den lokalen Server von LM Studio. Fllama listet installierte Modelle und lädt Modelle wie Qwen2.5 Coder aus dem Ollama-Katalog herunter.",
    "apiSetup": "Hinterlege die Zugangsdaten in den Einstellungen. Für andere OpenAI-kompatible Server gib die API-Basis-URL und bei Bedarf eine Modell-ID an.",
    "workflowTitle": "Ein Branch pro Aufgabe.",
    "workflowIntro": "Ein Git-Worktree erstellt einen separaten Checkout aus dem aktuellen Commit. So können Agenten gleichzeitig Dateien bearbeiten.",
    "workflow1Title": "Projekt öffnen",
    "workflow1Body": "Öffne das Stammverzeichnis des Git-Repositorys für Worktrees. Wähle einen Agenten und ein Modell und beschreibe die Aufgabe. Chats ohne Projektdateien sind ebenfalls möglich.",
    "workflowStartTitle": "Arbeitsordner wählen",
    "workflowStartBody": "Bei der ersten Ausführung mit Worktree entstehen ein Branch und ein neuer Checkout. Im Modus „Projektordner“ bearbeitet der Agent die vorhandenen Dateien. Warte auf das Ende der Ausführung, bevor du eine weitere Aufgabe im selben Ordner startest.",
    "workflow2Title": "Änderungen prüfen",
    "workflow2Body": "Unter „Ausführung“ stehen Status und Aktivitäten. „Dateien“ zeigt den Checkout. Unter „Änderungen“ kannst du den Git-Diff einer Datei öffnen.",
    "workflow3Title": "Aufgabe übergeben",
    "workflow3Body": "Die Folgeaufgabe enthält den vorherigen Prompt und die Antwort. Bei einem Worktree kann der nächste Agent Änderungen im selben Branch und Checkout prüfen.",
    "downloadNotice": "Die verlinkten Installationsdateien für v1.0.0 enthalten den Ollama-Chat. Die Screenshots oben zeigen den Entwicklungsstand von Fllama 2.0.",
    "macFormat": "Disk-Image",
    "installer": "Installationsprogramm",
    "allReleases": "Alle Versionen",
    "sourceTitle": "Aus dem Quellcode starten",
    "sourceBody": "Du brauchst Git und Node.js, um den Stand aus dem Repository zu starten.",
    "terminal": "Terminal",
    "copy": "Kopieren",
    "browseSource": "Repository öffnen",
    "faqTitle": "Häufige Fragen",
    "faq1Question": "Kann ich Modelle lokal ausführen?",
    "faq1Answer": "Ja. Starte Ollama oder LM Studio und wähle ein installiertes Modell. Bei Cloud-Anbietern kann der Aufgabenkontext an deren Dienste gesendet werden.",
    "faq2Question": "Was passiert mit Änderungen ohne Commit?",
    "faq2Answer": "Sie bleiben im ursprünglichen Checkout. Ein neuer Worktree beginnt beim aktuellen Commit. Wähle „Projektordner“, um mit den aktuellen Dateien zu arbeiten.",
    "faq3Question": "Wie führe ich Branches zusammen?",
    "faq3Answer": "Prüfe den Diff in Fllama und führe anschließend den Merge mit Git aus.",
    "faq4Question": "Was passiert beim Löschen einer Aufgabe?",
    "faq4Answer": "Fllama entfernt die Aufgabe und ihre Unterhaltung. Der Git-Worktree und der Branch bleiben auf dem Datenträger.",
    "faq5Question": "Welche API-Schlüssel brauche ich?",
    "faq5Answer": "Lokale Ollama- und LM-Studio-Server können ohne Cloud-Schlüssel laufen. CLI-Agenten verwenden ihre eigene Anmeldung. Cloud-Anbieter benötigen normalerweise einen Schlüssel. Bei Kilo Gateway kannst du ein Modell mit der Endung :free wählen.",
    "footerFaq": "FAQ",
    "ollamaCaption": "Ollama-Chat und Modellkatalog in Fllama 1.0.0",
    "ollamaChatAlt": "Eine Ollama-Antwort in Fllama 1.0.0",
    "ollamaModelsAlt": "Der Ollama-Modellkatalog in Fllama 1.0.0",
  },
  "es": {
    "skip": "Saltar al contenido",
    "navigation": "Navegación principal",
    "navPreview": "Interfaz",
    "navWorkflow": "Flujo de trabajo",
    "navDownload": "Descargas",
    "heroTitle": "Agentes en paralelo.",
    "heroBody": "Ejecuta agentes en worktrees de Git separados. Cambia de tarea y revisa sus cambios en un mismo espacio.",
    "getFllama": "Descargar Fllama",
    "seePreview": "Ver la interfaz",
    "previewLabel": "Vista previa interactiva",
    "projects": "Proyecto",
    "demoTasks": "Tareas de ejemplo",
    "demoViews": "Vista de la tarea",
    "searchName": "Corregir el streaming",
    "testsName": "Añadir Kilo Gateway",
    "runTab": "Ejecución",
    "diffTab": "Cambios",
    "runComplete": "Ejecución completada",
    "sampleData": "Proyecto de ejemplo",
    "caption": "Vista interactiva. Elige una tarea y abre «Cambios» para ver el diff de Git.",
    "providerTitle": "Agentes y modelos",
    "cliList": "Agentes de programación",
    "providerList": "Proveedores de API",
    "screenshotsTitle": "Dentro de Fllama",
    "screenshotsIntro": "Capturas de la versión de desarrollo de Fllama 2.0 en macOS con un proyecto de ejemplo.",
    "workspaceAlt": "Fllama con un proyecto, el editor de tareas y el inspector de ejecución",
    "workspaceCaption": "Los proyectos y las tareas a la izquierda, el editor en el centro y los detalles de ejecución a la derecha.",
    "changesAlt": "El panel Cambios de Fllama muestra un archivo y su diff de Git",
    "changesCaption": "La pestaña Cambios muestra los archivos modificados y el diff de Git del archivo seleccionado.",
    "providersAlt": "Configuración de proveedores de modelos en Fllama",
    "providersCaption": "Configuración para conectar servidores de modelos locales y API en la nube.",
    "providerIntro": "Elige un agente de programación instalado o conecta un proveedor de modelos. Cada tarea conserva su selección.",
    "cliSetup": "Instala la CLI que quieras usar e inicia sesión en ella. OpenCode también puede conectarse a un servidor en ejecución.",
    "localTitle": "Modelos locales",
    "localSetup": "Inicia Ollama o el servidor local de LM Studio. Fllama muestra los modelos instalados y puede descargar modelos del catálogo de Ollama, como Qwen2.5 Coder.",
    "apiSetup": "Configura las credenciales en los ajustes. Para otro servidor compatible con OpenAI, indica la URL base de su API y el ID del modelo cuando sea necesario.",
    "workflowTitle": "Una rama por tarea.",
    "workflowIntro": "Un worktree de Git crea una copia independiente a partir del commit actual. Así, los agentes pueden editar archivos a la vez.",
    "workflow1Title": "Abrir un proyecto",
    "workflow1Body": "Abre la raíz del repositorio Git para usar worktrees. Elige un agente y un modelo y describe la tarea. Para conversar sin archivos, crea una tarea sin proyecto.",
    "workflowStartTitle": "Elegir la carpeta de trabajo",
    "workflowStartBody": "Worktree crea una rama y una copia de trabajo en la primera ejecución. Carpeta del proyecto trabaja sobre los archivos actuales. Espera a que termine la ejecución antes de iniciar otra tarea en la misma carpeta.",
    "workflow2Title": "Revisar los cambios",
    "workflow2Body": "Consulta el estado y la actividad en Ejecución, explora la copia en Archivos y revisa el diff de Git del archivo seleccionado en Cambios.",
    "workflow3Title": "Transferir la tarea",
    "workflow3Body": "La siguiente tarea recibe la petición y la respuesta anteriores. Si se usó un worktree, el siguiente agente puede revisar los cambios en la misma rama y copia de trabajo.",
    "downloadNotice": "Los instaladores enlazados de v1.0.0 incluyen el chat de Ollama. Las capturas de arriba muestran la versión de desarrollo de Fllama 2.0.",
    "macFormat": "Imagen de disco",
    "installer": "Instalador",
    "allReleases": "Todas las versiones",
    "sourceTitle": "Ejecutar desde el código fuente",
    "sourceBody": "Necesitas Git y Node.js para ejecutar la versión del repositorio.",
    "terminal": "Terminal",
    "copy": "Copiar",
    "browseSource": "Abrir el repositorio",
    "faqTitle": "Preguntas frecuentes",
    "faq1Question": "¿Puedo ejecutar modelos de forma local?",
    "faq1Answer": "Sí. Inicia Ollama o LM Studio y elige un modelo instalado. Los proveedores en la nube pueden recibir el contexto de la tarea.",
    "faq2Question": "¿Qué ocurre con los cambios sin commit?",
    "faq2Answer": "Se quedan en la copia de trabajo original. El nuevo worktree parte del commit actual. Selecciona «Carpeta del proyecto» para trabajar con los archivos actuales.",
    "faq3Question": "¿Cómo combino las ramas?",
    "faq3Answer": "Revisa el diff en Fllama y combina las ramas con Git.",
    "faq4Question": "¿Qué sucede al eliminar una tarea?",
    "faq4Answer": "Fllama elimina la tarea y su conversación. El worktree de Git y la rama permanecen en el disco.",
    "faq5Question": "¿Qué claves de API necesito?",
    "faq5Answer": "Los servidores locales Ollama y LM Studio pueden funcionar sin claves de la nube. Los agentes CLI usan su propio inicio de sesión. Los proveedores en la nube suelen requerir una clave. Con Kilo Gateway puedes elegir un modelo con el sufijo :free.",
    "footerFaq": "Preguntas frecuentes",
    "ollamaCaption": "Chat y catálogo de Ollama en Fllama 1.0.0",
    "ollamaChatAlt": "Una respuesta de Ollama en Fllama 1.0.0",
    "ollamaModelsAlt": "El catálogo de Ollama en Fllama 1.0.0",
  }
};

const tasks = {
  search: {
    name: 'searchName', agent: 'Codex CLI', branch: 'fllama/streaming', file: 'src/providers.js',
    prompt: ['Keep Cyrillic text intact when the stream splits a character.', 'Сохрани кириллицу, даже если поток разбивает символ на части.', 'Erhalte kyrillische Zeichen, wenn ein Zeichen auf mehrere Chunks verteilt ist.', 'Conserva los caracteres cirílicos cuando el flujo divida un carácter.'],
    detail: ['The decoder preserves incomplete UTF-8 bytes between chunks.', 'Декодер сохраняет неполные последовательности UTF-8 между частями потока.', 'Der Decoder bewahrt unvollständige UTF-8-Sequenzen zwischen Chunks.', 'El decodificador conserva las secuencias UTF-8 incompletas entre fragmentos.'],
    before: 'buf += chunk.toString()',
    after: 'buf += decoder.write(chunk)',
  },
  tests: {
    name: 'testsName', agent: 'Claude Code CLI', branch: 'fllama/kilo', file: 'src/provider-catalog.js',
    prompt: ['Add Kilo Gateway as a model provider.', 'Подключи Kilo Gateway как провайдера моделей.', 'Füge Kilo Gateway als Modellanbieter hinzu.', 'Añade Kilo Gateway como proveedor de modelos.'],
    detail: ['Kilo Gateway appears in the provider picker.', 'Kilo Gateway появился в списке провайдеров.', 'Kilo Gateway erscheint in der Anbieterauswahl.', 'Kilo Gateway aparece en la lista de proveedores.'],
    before: '',
    after: "kilo: { label: 'Kilo Gateway', … }",
  },
};

const all = (selector) => [...document.querySelectorAll(selector)];
const $ = (id) => document.getElementById(id);
const localized = all('[data-t]');
const labels = all('[data-a]');
const altImages = all('[data-alt]');
const english = Object.fromEntries([
  ...localized.map((node) => [node.dataset.t, node.textContent]),
  ...altImages.map((node) => [node.dataset.alt, node.alt]),
]);
const englishLabels = Object.fromEntries(labels.map((node) => [node.dataset.a, node.getAttribute('aria-label')]));
const taskButtons = all('[data-task]');
const viewButtons = all('[data-view]');
const languageSelect = $('switch-language');
const localeOptions = {
  en: { index: 0, title: 'Workspace for coding agents', label: 'Language', copied: 'Commands copied.', copyFailed: 'Select and copy the commands manually.' },
  ru: { index: 1, title: 'Рабочее пространство для ИИ-агентов', label: 'Язык', copied: 'Команды скопированы.', copyFailed: 'Выделите и скопируйте команды вручную.' },
  de: { index: 2, title: 'Arbeitsbereich für Coding-Agenten', label: 'Sprache', copied: 'Befehle kopiert.', copyFailed: 'Markiere und kopiere die Befehle manuell.' },
  es: { index: 3, title: 'Espacio para agentes de programación', label: 'Idioma', copied: 'Comandos copiados.', copyFailed: 'Selecciona y copia los comandos manualmente.' },
};
const dictionaries = { en: english, ru, ...otherLocales };
const copyButton = $('copy-command');
const feedback = $('copy-feedback');
let taskId = 'search';
let view = 'run';
let locale = 'en';
let feedbackTimeout;

function renderDemo() {
  const task = tasks[taskId];
  const languageIndex = localeOptions[locale].index;
  $('demo-title').textContent = dictionaries[locale][task.name];
  $('demo-branch').textContent = task.branch;
  $('demo-agent').textContent = task.agent;
  $('demo-prompt').textContent = task.prompt[languageIndex];
  $('demo-detail').textContent = task.detail[languageIndex];
  $('demo-file').textContent = task.file;
  $('demo-before').textContent = task.before ? '- ' + task.before : '';
  $('demo-before').hidden = !task.before;
  $('demo-after').textContent = '+ ' + task.after;
  $('demo-diff').hidden = view !== 'diff';
  $('demo-run').hidden = view !== 'run';
  taskButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.task === taskId)));
  viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}

function applyLanguage(next) {
  locale = next;
  const details = localeOptions[locale];
  document.documentElement.lang = locale;
  document.title = 'Fllama: ' + details.title;
  localized.forEach((node) => { node.textContent = dictionaries[locale][node.dataset.t] || english[node.dataset.t]; });
  altImages.forEach((node) => { node.alt = dictionaries[locale][node.dataset.alt] || english[node.dataset.alt]; });
  labels.forEach((node) => { node.setAttribute('aria-label', dictionaries[locale][node.dataset.a] || englishLabels[node.dataset.a]); });
  languageSelect.value = locale;
  languageSelect.setAttribute('aria-label', details.label);
  feedback.hidden = true;
  renderDemo();
}

const queryLanguage = new URLSearchParams(location.search).get('lang');
let savedLanguage;
try { savedLanguage = localStorage.getItem('fllama-site-lang'); } catch {}
function preferredLocale(...values) {
  for (const value of values) {
    const code = value?.toLowerCase().split('-')[0];
    if (Object.hasOwn(localeOptions, code)) return code;
  }
  return 'en';
}
applyLanguage(preferredLocale(queryLanguage, savedLanguage, ...(navigator.languages || [navigator.language])));

languageSelect.hidden = false;
languageSelect.addEventListener('change', () => {
  applyLanguage(languageSelect.value);
  try { localStorage.setItem('fllama-site-lang', locale); } catch {}
  const url = new URL(location.href);
  url.searchParams.set('lang', locale);
  history.replaceState(null, '', url);
});

for (const button of taskButtons) {
  button.disabled = false;
  button.addEventListener('click', () => { taskId = button.dataset.task; renderDemo(); });
}
for (const button of viewButtons) {
  button.disabled = false;
  button.addEventListener('click', () => { view = button.dataset.view; renderDemo(); });
}

if (navigator.clipboard?.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('install-command').textContent);
      feedback.textContent = localeOptions[locale].copied;
    } catch {
      feedback.textContent = localeOptions[locale].copyFailed;
    }
    feedback.hidden = false;
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => { feedback.hidden = true; }, 4000);
  });
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const reveals = document.querySelectorAll([
    '.hero-copy > *', '.showcase', '.screenshots .section-intro > *', '.product-shot', '.providers > *', '.workflow .section-intro > *',
    '.workflow-row', '.download-intro > *', '.install-grid > *', '.release-preview',
    '.faq > h2', '.faq details', '.footer-inner > *',
  ].join(','));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('scene-enter');
      observer.unobserve(entry.target);
    }
  }, { threshold: .12 });
  reveals.forEach((element) => observer.observe(element));
}

for (const button of [...taskButtons, ...viewButtons]) {
  button.addEventListener('click', () => {
    const pane = $(view === 'diff' ? 'demo-diff' : 'demo-run');
    pane.classList.remove('just-changed');
    requestAnimationFrame(() => pane.classList.add('just-changed'));
  });
}
