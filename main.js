const ru = {
  skip: 'Перейти к содержанию',
  navigation: 'Навигация по сайту',
  navPreview: 'Интерфейс',
  navWorkflow: 'Как работает',
  navDownload: 'Скачать',
  heroTitle: 'Запускайте агентов параллельно.',
  heroBody: 'У каждой задачи свой агент и Git worktree. Переключайтесь между запусками, проверяйте изменения и передавайте задачи в одном окне.',
  getFllama: 'Скачать Fllama',
  seePreview: 'Посмотреть интерфейс',
  previewLabel: 'Интерактивный пример',
  projects: 'Проект',
  demoTasks: 'Примеры задач',
  demoViews: 'Вид задачи',
  searchName: 'Улучшить поиск',
  testsName: 'Добавить тесты парсера',
  runTab: 'Запуск',
  diffTab: 'Изменения',
  runComplete: 'Задача выполнена',
  sampleData: 'Пример проекта',
  caption: 'Тестовая сборка Fllama 2.0 на macOS с примером проекта.',
  screenshotsLabel: 'Другие скриншоты',
  changesCaption: 'Просмотр изменений файлов и Git diff.',
  providersCaption: 'Настройка провайдеров моделей.',
  workspaceAlt: 'Рабочее пространство Fllama с проектом, полем задачи и панелью запуска',
  changesAlt: 'Панель изменений Fllama с файлом и его Git diff',
  providersAlt: 'Настройки провайдеров моделей в Fllama',
  providerTitle: 'Агенты и модели',
  cliList: 'Агенты',
  providerList: 'Провайдеры моделей',
  workflowTitle: 'Отдельная ветка для каждой задачи.',
  workflowIntro: 'Git worktree создаёт рабочую копию из текущего коммита. Агенты в разных копиях могут редактировать файлы параллельно.',
  workflow1Title: 'Откройте проект',
  workflow1Body: 'Выберите локальную папку, а затем агента и модель для задачи.',
  workflow2Title: 'Проверьте изменения',
  workflow2Body: 'Смотрите Git diff, открывайте файлы и следите за действиями агента.',
  workflow3Title: 'Передайте задачу',
  workflow3Body: 'Следующий агент получит переписку и доступ к той же рабочей копии.',
  downloadNotice: 'Опубликованные установщики v1.0.0 содержат чат для Ollama. Выше показан интерфейс нового оркестратора.',
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
  footerFaq: 'Вопросы',
};

const otherLocales = {
  "de": {
    "skip": "Zum Inhalt springen",
    "navigation": "Hauptnavigation",
    "navPreview": "Arbeitsbereich",
    "navWorkflow": "Ablauf",
    "navDownload": "Downloads",
    "heroTitle": "Coding-Agenten parallel ausführen.",
    "heroBody": "Gib jeder Aufgabe einen Agenten und einen Git-Worktree. Wechsle zwischen Ausführungen, prüfe Änderungen und übergib Aufgaben in einem Arbeitsbereich.",
    "getFllama": "Fllama herunterladen",
    "seePreview": "Arbeitsbereich ansehen",
    "previewLabel": "Interaktive Vorschau",
    "projects": "Projekt",
    "demoTasks": "Beispielaufgaben",
    "demoViews": "Aufgabenansicht",
    "searchName": "Suche verbessern",
    "testsName": "Parser-Tests hinzufügen",
    "runTab": "Ausführung",
    "diffTab": "Änderungen",
    "runComplete": "Ausführung abgeschlossen",
    "sampleData": "Beispielprojekt",
    "caption": "Fllama 2.0-Entwicklungsversion unter macOS mit einem Beispielprojekt.",
    "screenshotsLabel": "Weitere Screenshots",
    "changesCaption": "Dateiänderungen und Git-Diffs prüfen.",
    "providersCaption": "Modellanbieter konfigurieren.",
    "workspaceAlt": "Fllama-Arbeitsbereich mit Projekt, Aufgabenfeld und Ausführungsansicht",
    "changesAlt": "Fllama-Änderungsansicht mit Datei und Git-Diff",
    "providersAlt": "Fllama-Einstellungen für Modellanbieter",
    "providerTitle": "Agenten und Modelle",
    "cliList": "Agenten",
    "providerList": "Modellanbieter",
    "workflowTitle": "Ein eigener Branch für jede Aufgabe.",
    "workflowIntro": "Ein Git-Worktree erstellt einen separaten Checkout aus dem aktuellen Commit. So können Agenten gleichzeitig Dateien bearbeiten.",
    "workflow1Title": "Projekt öffnen",
    "workflow1Body": "Wähle einen lokalen Ordner sowie einen Agenten und ein Modell für die Aufgabe.",
    "workflow2Title": "Änderungen prüfen",
    "workflow2Body": "Prüfe den Git-Diff, öffne Dateien und verfolge die Ausführung.",
    "workflow3Title": "Aufgabe übergeben",
    "workflow3Body": "Ein anderer Agent erhält den Verlauf und Zugriff auf denselben Checkout.",
    "downloadNotice": "Die Installationsdateien für v1.0.0 enthalten den Ollama-Chat. Oben siehst du den neuen Agenten-Arbeitsbereich.",
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
    "footerFaq": "FAQ"
  },
  "es": {
    "skip": "Saltar al contenido",
    "navigation": "Navegación principal",
    "navPreview": "Interfaz",
    "navWorkflow": "Flujo de trabajo",
    "navDownload": "Descargas",
    "heroTitle": "Ejecuta agentes de programación en paralelo.",
    "heroBody": "Asigna un agente y un worktree de Git a cada tarea. Cambia entre ejecuciones, revisa cambios y transfiere tareas desde un mismo espacio de trabajo.",
    "getFllama": "Descargar Fllama",
    "seePreview": "Ver la interfaz",
    "previewLabel": "Vista previa interactiva",
    "projects": "Proyecto",
    "demoTasks": "Tareas de ejemplo",
    "demoViews": "Vista de la tarea",
    "searchName": "Mejorar la búsqueda",
    "testsName": "Añadir pruebas del analizador",
    "runTab": "Ejecución",
    "diffTab": "Cambios",
    "runComplete": "Ejecución completada",
    "sampleData": "Proyecto de ejemplo",
    "caption": "Versión de desarrollo de Fllama 2.0 en macOS con un proyecto de ejemplo.",
    "screenshotsLabel": "Más capturas de pantalla",
    "changesCaption": "Revisa los cambios de archivos y los diffs de Git.",
    "providersCaption": "Configura proveedores de modelos.",
    "workspaceAlt": "Espacio de trabajo de Fllama con proyecto, editor de tareas y panel de ejecución",
    "changesAlt": "Panel de cambios de Fllama con un archivo y su diff de Git",
    "providersAlt": "Configuración de proveedores de modelos en Fllama",
    "providerTitle": "Agentes y modelos",
    "cliList": "Agentes",
    "providerList": "Proveedores de modelos",
    "workflowTitle": "Una rama para cada tarea.",
    "workflowIntro": "Un worktree de Git crea una copia independiente a partir del commit actual. Así, los agentes pueden editar archivos a la vez.",
    "workflow1Title": "Abrir un proyecto",
    "workflow1Body": "Elige una carpeta local y selecciona un agente y un modelo para la tarea.",
    "workflow2Title": "Revisar los cambios",
    "workflow2Body": "Consulta el diff de Git, abre archivos y sigue el progreso.",
    "workflow3Title": "Transferir la tarea",
    "workflow3Body": "Otro agente recibe la conversación y acceso a la misma copia de trabajo.",
    "downloadNotice": "Los instaladores de v1.0.0 incluyen el chat para Ollama. Arriba se muestra el nuevo espacio de trabajo para agentes.",
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
    "footerFaq": "Preguntas frecuentes"
  }
};

const all = (selector) => [...document.querySelectorAll(selector)];
const $ = (id) => document.getElementById(id);
const localized = all('[data-t]');
const labels = all('[data-a]');
const english = Object.fromEntries(localized.map((node) => [node.dataset.t, node.textContent]));
const englishLabels = Object.fromEntries(labels.map((node) => [node.dataset.a, node.getAttribute('aria-label')]));
const images = all('[data-alt]');
const englishAlts = Object.fromEntries(images.map((node) => [node.dataset.alt, node.alt]));
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
let locale = 'en';
let feedbackTimeout;

function applyLanguage(next) {
  locale = next;
  const details = localeOptions[locale];
  document.documentElement.lang = locale;
  document.title = 'Fllama: ' + details.title;
  localized.forEach((node) => { node.textContent = dictionaries[locale][node.dataset.t] || english[node.dataset.t]; });
  labels.forEach((node) => { node.setAttribute('aria-label', dictionaries[locale][node.dataset.a] || englishLabels[node.dataset.a]); });
  languageSelect.value = locale;
  languageSelect.setAttribute('aria-label', details.label);
  feedback.hidden = true;
  images.forEach((node) => { node.alt = dictionaries[locale][node.dataset.alt] || englishAlts[node.dataset.alt]; });
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
