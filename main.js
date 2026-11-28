const ru = {
  "skip": "Перейти к содержанию",
  "navigation": "Навигация по сайту",
  "navPreview": "Интерфейс",
  "navWorkflow": "Как работает",
  "navIntegrations": "Интеграции",
  "navDownload": "Скачать",
  "heroTitle": "Запускайте агентов параллельно.",
  "heroBody": "У каждой задачи свой агент и Git worktree. Переключайтесь между запусками, проверяйте изменения и передавайте задачи в одном окне.",
  "getFllama": "Скачать Fllama",
  "seePreview": "Как работают задачи",
  "workspaceAlt": "Рабочее пространство Fllama с проектом, полем задачи и панелью запуска",
  "caption": "Тестовая сборка Fllama 2.0 на macOS с примером проекта.",
  "workflowTitle": "От задачи до Git diff",
  "workflowIntro": "Запускайте задачи параллельно и проверяйте изменения в отдельных рабочих копиях. Fllama также может работать прямо в папке проекта.",
  "workflow1Title": "Откройте проект",
  "workflow1Body": "Для работы с worktree откройте корень Git-репозитория. Выберите агента и модель, затем опишите задачу. Для диалога без файлов откройте задачу без проекта.",
  "workflowStartTitle": "Выберите рабочую папку",
  "workflowStartBody": "В режиме Worktree ветка и рабочая копия создаются при первом запуске. В режиме «Папка проекта» агент работает с текущими файлами. Дождитесь завершения запуска, прежде чем начать другую задачу в той же папке.",
  "workflow2Title": "Проверьте изменения",
  "workflow2Body": "Во вкладке «Запуск» видны статус и действия агента. «Файлы» показывает содержимое рабочей копии, а «Изменения» открывает Git diff выбранного файла.",
  "workflow3Title": "Передайте задачу",
  "workflow3Body": "Новая задача получит предыдущий запрос и ответ. Если работа шла в worktree, следующий агент сможет проверить правки в той же ветке и рабочей копии.",
  "screenshotsTitle": "Изменения и настройки моделей",
  "screenshotsIntro": "Откройте скриншот macOS, чтобы увидеть интерфейс в полном размере.",
  "changesAlt": "Панель изменений Fllama с файлом и его Git diff",
  "changesCaption": "Просмотр изменений файлов и Git diff.",
  "providersAlt": "Настройки провайдеров моделей в Fllama",
  "providersCaption": "Настройка провайдеров моделей.",
  "teamTitle": "Координируйте команду агентов",
  "teamIntro": "Командный режим Fllama 2.0 подходит для задач, которые можно разделить на независимые части. Откройте Git-репозиторий хотя бы с одним коммитом, выберите координатора и добавьте до трёх исполнителей.",
  "coordinatorTitle": "Координатор",
  "coordinatorBody": "Распределяет подзадачи, ждёт завершения работы и подводит итоги.",
  "workersTitle": "Исполнители",
  "workersBody": "Каждый исполнитель начинает с одного и того же коммита в отдельной рабочей копии. Для каждого можно выбрать модель.",
  "teamReviewTitle": "Проверка",
  "teamReviewBody": "В разделе «Команда» видны статусы и переписка исполнителей. В разделе «Ветки» можно проверить изменения перед слиянием в Git.",
  "providerTitle": "Агенты и модели",
  "providerIntro": "В Fllama 2.0 для каждой задачи можно выбрать агента, локальную модель или провайдера API.",
  "cliList": "Агенты для кода",
  "cliSetup": "Установите нужный CLI, войдите в аккаунт или настройте провайдера. Для OpenCode можно указать адрес запущенного сервера.",
  "localTitle": "Локальные модели",
  "localSetup": "Запустите Ollama или локальный сервер LM Studio. Fllama покажет установленные модели и поможет скачать модели из каталога Ollama, включая Qwen2.5 Coder.",
  "providerList": "Облачные API",
  "apiSetup": "Введите данные в настройках. Для другого OpenAI-совместимого сервера укажите базовый URL API и при необходимости ID модели.",
  "downloadNotice": "Ниже доступны установщики чата Ollama 1.0.0. Чтобы попробовать Fllama 2.0 со скриншотов выше, запустите текущую версию из исходников на GitHub.",
  "releaseTitle": "Скачать Fllama 1.0.0",
  "releaseSetup": "Запустите Ollama перед открытием приложения. Скачайте модель из каталога или выберите уже установленную.",
  "macFormat": "Образ диска",
  "installer": "Установщик",
  "allReleases": "Все релизы",
  "sourceTitle": "Запустить из исходников",
  "sourceBody": "Установите Git и Node.js, затем выполните эти команды. Подключите нужного агента или провайдера моделей в настройках.",
  "terminal": "Терминал",
  "copy": "Копировать",
  "browseSource": "Открыть репозиторий",
  "ollamaChatAlt": "Ответ модели Ollama в Fllama 1.0.0",
  "ollamaModelsAlt": "Каталог моделей Ollama в Fllama 1.0.0",
  "ollamaCaption": "Чат и каталог моделей Ollama в Fllama 1.0.0",
  "faqTitle": "Частые вопросы",
  "faq1Question": "Можно ли запускать модели локально?",
  "faq1Answer": "Да. Запустите Ollama или LM Studio и выберите установленную модель. При работе с облачными провайдерами контекст задачи может передаваться их сервисам.",
  "faq2Question": "Что будет с незакоммиченными правками?",
  "faq2Answer": "Они останутся в исходной рабочей копии. Новый worktree создаётся из коммита. Для работы с текущими файлами выберите режим «Папка проекта».",
  "faq3Question": "Как объединить ветки?",
  "faq3Answer": "Проверьте diff в Fllama, затем выполните слияние средствами Git.",
  "faq4Question": "Что будет после удаления задачи?",
  "faq4Answer": "Fllama удалит задачу и её переписку. Git worktree и ветка останутся на диске.",
  "faq5Question": "Какие ключи нужны для запуска?",
  "faq5Answer": "Локальные серверы Ollama и LM Studio могут работать без ключа облачного API. У CLI-агентов свой способ входа. Облачным провайдерам обычно нужен ключ API. Проверьте настройки провайдера перед запуском задачи.",
  "footerFaq": "Вопросы"
};

const otherLocales = {
  "de": {
    "skip": "Zum Inhalt springen",
    "navigation": "Hauptnavigation",
    "navPreview": "Arbeitsbereich",
    "navWorkflow": "Ablauf",
    "navIntegrations": "Integrationen",
    "navDownload": "Downloads",
    "heroTitle": "Coding-Agenten parallel ausführen.",
    "heroBody": "Gib jeder Aufgabe einen Agenten und einen Git-Worktree. Wechsle zwischen Ausführungen, prüfe Änderungen und übergib Aufgaben in einem Arbeitsbereich.",
    "getFllama": "Fllama herunterladen",
    "seePreview": "Aufgabenablauf ansehen",
    "workspaceAlt": "Fllama-Arbeitsbereich mit Projekt, Aufgabenfeld und Ausführungsansicht",
    "caption": "Fllama 2.0-Entwicklungsversion unter macOS mit einem Beispielprojekt.",
    "workflowTitle": "Von der Aufgabe zum Git-Diff",
    "workflowIntro": "Führe Aufgaben parallel aus und prüfe Änderungen in separaten Checkouts. Fllama kann auch direkt im Projektordner arbeiten.",
    "workflow1Title": "Projekt öffnen",
    "workflow1Body": "Öffne das Stammverzeichnis des Git-Repositorys für Worktrees. Wähle einen Agenten und ein Modell und beschreibe die Aufgabe. Chats ohne Projektdateien sind ebenfalls möglich.",
    "workflowStartTitle": "Arbeitsordner wählen",
    "workflowStartBody": "Bei der ersten Ausführung mit Worktree entstehen ein Branch und ein neuer Checkout. Im Modus „Projektordner“ bearbeitet der Agent die vorhandenen Dateien. Warte auf das Ende der Ausführung, bevor du eine weitere Aufgabe im selben Ordner startest.",
    "workflow2Title": "Änderungen prüfen",
    "workflow2Body": "Unter „Ausführung“ stehen Status und Aktivitäten. „Dateien“ zeigt den Checkout. Unter „Änderungen“ kannst du den Git-Diff einer Datei öffnen.",
    "workflow3Title": "Aufgabe übergeben",
    "workflow3Body": "Die Folgeaufgabe enthält den vorherigen Prompt und die Antwort. Bei einem Worktree kann der nächste Agent Änderungen im selben Branch und Checkout prüfen.",
    "screenshotsTitle": "Änderungen und Modelleinstellungen",
    "screenshotsIntro": "Öffne einen macOS-Screenshot, um die Oberfläche in voller Größe zu sehen.",
    "changesAlt": "Fllama-Änderungsansicht mit Datei und Git-Diff",
    "changesCaption": "Dateiänderungen und Git-Diffs prüfen.",
    "providersAlt": "Fllama-Einstellungen für Modellanbieter",
    "providersCaption": "Modellanbieter konfigurieren.",
    "teamTitle": "Ein Agententeam koordinieren",
    "teamIntro": "Nutze den Teammodus in Fllama 2.0 für Aufgaben, die sich in unabhängige Teile zerlegen lassen. Öffne ein Git-Repository mit mindestens einem Commit, wähle einen Koordinator und füge bis zu drei Worker hinzu.",
    "coordinatorTitle": "Koordinator",
    "coordinatorBody": "Verteilt Teilaufgaben, wartet auf die Worker und fasst ihre Ergebnisse zusammen.",
    "workersTitle": "Worker",
    "workersBody": "Alle Worker starten beim selben Commit in separaten Worktrees. Wähle für jeden Worker ein Modell.",
    "teamReviewTitle": "Prüfung",
    "teamReviewBody": "Unter „Team“ siehst du Status und Unterhaltungen der Worker. Unter „Branches“ prüfst du Änderungen vor dem Merge mit Git.",
    "providerTitle": "Agenten und Modelle",
    "providerIntro": "Wähle in Fllama 2.0 für jede Aufgabe einen Coding-Agenten, ein lokales Modell oder einen API-Anbieter.",
    "cliList": "Coding-Agenten",
    "cliSetup": "Installiere die CLI und melde dich an oder richte ihren Anbieter ein. OpenCode kann einen laufenden Server verwenden.",
    "localTitle": "Lokale Modelle",
    "localSetup": "Starte Ollama oder den lokalen Server von LM Studio. Fllama listet installierte Modelle und lädt Modelle wie Qwen2.5 Coder aus dem Ollama-Katalog herunter.",
    "providerList": "API-Anbieter",
    "apiSetup": "Hinterlege die Zugangsdaten in den Einstellungen. Für andere OpenAI-kompatible Server gib die API-Basis-URL und bei Bedarf eine Modell-ID an.",
    "downloadNotice": "Unten findest du die Installationsdateien für den Ollama-Chat 1.0.0. Starte den aktuellen Quellcode von GitHub, um den oben gezeigten Arbeitsbereich von Fllama 2.0 auszuprobieren.",
    "releaseTitle": "Fllama 1.0.0 herunterladen",
    "releaseSetup": "Starte Ollama, bevor du Fllama öffnest. Lade ein Modell aus dem Katalog oder wähle ein installiertes Modell.",
    "macFormat": "Disk-Image",
    "installer": "Installationsprogramm",
    "allReleases": "Alle Versionen",
    "sourceTitle": "Aus dem Quellcode starten",
    "sourceBody": "Installiere Git und Node.js und führe diese Befehle aus. Verbinde deinen Agenten oder Modellanbieter in den Einstellungen.",
    "terminal": "Terminal",
    "copy": "Kopieren",
    "browseSource": "Repository öffnen",
    "ollamaChatAlt": "Eine Ollama-Antwort in Fllama 1.0.0",
    "ollamaModelsAlt": "Der Ollama-Modellkatalog in Fllama 1.0.0",
    "ollamaCaption": "Ollama-Chat und Modellkatalog in Fllama 1.0.0",
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
    "faq5Answer": "Lokale Ollama- und LM-Studio-Server können ohne Cloud-API-Schlüssel laufen. CLI-Agenten nutzen ihre eigene Anmeldung. Cloud-Anbieter benötigen meist einen API-Schlüssel. Prüfe die Anbietereinstellungen vor dem Start.",
    "footerFaq": "FAQ"
  },
  "es": {
    "skip": "Saltar al contenido",
    "navigation": "Navegación principal",
    "navPreview": "Interfaz",
    "navWorkflow": "Flujo de trabajo",
    "navIntegrations": "Integraciones",
    "navDownload": "Descargas",
    "heroTitle": "Ejecuta agentes de programación en paralelo.",
    "heroBody": "Asigna un agente y un worktree de Git a cada tarea. Cambia entre ejecuciones, revisa cambios y transfiere tareas desde un mismo espacio de trabajo.",
    "getFllama": "Descargar Fllama",
    "seePreview": "Ver cómo se ejecutan las tareas",
    "workspaceAlt": "Espacio de trabajo de Fllama con proyecto, editor de tareas y panel de ejecución",
    "caption": "Versión de desarrollo de Fllama 2.0 en macOS con un proyecto de ejemplo.",
    "workflowTitle": "De la tarea al diff de Git",
    "workflowIntro": "Ejecuta tareas en paralelo y revisa los cambios en copias separadas. Fllama también puede trabajar en la carpeta del proyecto.",
    "workflow1Title": "Abrir un proyecto",
    "workflow1Body": "Abre la raíz del repositorio Git para usar worktrees. Elige un agente y un modelo y describe la tarea. Para conversar sin archivos, crea una tarea sin proyecto.",
    "workflowStartTitle": "Elegir la carpeta de trabajo",
    "workflowStartBody": "Worktree crea una rama y una copia de trabajo en la primera ejecución. Carpeta del proyecto trabaja sobre los archivos actuales. Espera a que termine la ejecución antes de iniciar otra tarea en la misma carpeta.",
    "workflow2Title": "Revisar los cambios",
    "workflow2Body": "Consulta el estado y la actividad en Ejecución, explora la copia en Archivos y revisa el diff de Git del archivo seleccionado en Cambios.",
    "workflow3Title": "Transferir la tarea",
    "workflow3Body": "La siguiente tarea recibe la petición y la respuesta anteriores. Si se usó un worktree, el siguiente agente puede revisar los cambios en la misma rama y copia de trabajo.",
    "screenshotsTitle": "Cambios y ajustes de modelos",
    "screenshotsIntro": "Abre una captura de macOS para ver la interfaz a tamaño completo.",
    "changesAlt": "Panel de cambios de Fllama con un archivo y su diff de Git",
    "changesCaption": "Revisa los cambios de archivos y los diffs de Git.",
    "providersAlt": "Configuración de proveedores de modelos en Fllama",
    "providersCaption": "Configura proveedores de modelos.",
    "teamTitle": "Coordina un equipo de agentes",
    "teamIntro": "Usa el modo Equipo de Fllama 2.0 para tareas divisibles en partes independientes. Abre un repositorio Git con al menos un commit, elige un coordinador y añade hasta tres agentes de trabajo.",
    "coordinatorTitle": "Coordinador",
    "coordinatorBody": "Asigna las subtareas, espera a que terminen los agentes y resume sus resultados.",
    "workersTitle": "Agentes de trabajo",
    "workersBody": "Cada agente parte del mismo commit en un worktree separado. Puedes elegir un modelo para cada agente.",
    "teamReviewTitle": "Revisión",
    "teamReviewBody": "En Equipo puedes ver el estado y las conversaciones de los agentes. Revisa los cambios en Ramas antes de fusionarlos con Git.",
    "providerTitle": "Agentes y modelos",
    "providerIntro": "En Fllama 2.0 puedes elegir un agente, un modelo local o un proveedor de API para cada tarea.",
    "cliList": "Agentes de programación",
    "cliSetup": "Instala la CLI e inicia sesión o configura su proveedor. OpenCode también puede usar un servidor en ejecución.",
    "localTitle": "Modelos locales",
    "localSetup": "Inicia Ollama o el servidor local de LM Studio. Fllama muestra los modelos instalados y puede descargar modelos del catálogo de Ollama, como Qwen2.5 Coder.",
    "providerList": "Proveedores de API",
    "apiSetup": "Configura las credenciales en los ajustes. Para otro servidor compatible con OpenAI, indica la URL base de su API y el ID del modelo cuando sea necesario.",
    "downloadNotice": "Los instaladores de abajo corresponden al chat de Ollama 1.0.0. Para probar Fllama 2.0, tal como se muestra arriba, ejecuta el código fuente actual de GitHub.",
    "releaseTitle": "Descargar Fllama 1.0.0",
    "releaseSetup": "Inicia Ollama antes de abrir la aplicación. Descarga un modelo del catálogo o selecciona uno que ya tengas instalado.",
    "macFormat": "Imagen de disco",
    "installer": "Instalador",
    "allReleases": "Todas las versiones",
    "sourceTitle": "Ejecutar desde el código fuente",
    "sourceBody": "Instala Git y Node.js y ejecuta estos comandos. Conecta tu agente o proveedor de modelos en Configuración.",
    "terminal": "Terminal",
    "copy": "Copiar",
    "browseSource": "Abrir el repositorio",
    "ollamaChatAlt": "Una respuesta de Ollama en Fllama 1.0.0",
    "ollamaModelsAlt": "El catálogo de Ollama en Fllama 1.0.0",
    "ollamaCaption": "Chat y catálogo de Ollama en Fllama 1.0.0",
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
    "faq5Answer": "Los servidores locales de Ollama y LM Studio pueden funcionar sin clave de API en la nube. Los agentes CLI tienen su propio inicio de sesión. Los proveedores en la nube suelen requerir una clave de API. Revisa sus ajustes antes de iniciar una tarea.",
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
  en: { title: 'Workspace for coding agents', label: 'Language', copied: 'Commands copied.', copyFailed: 'Select and copy the commands manually.' },
  ru: { title: 'Рабочее пространство для ИИ-агентов', label: 'Язык', copied: 'Команды скопированы.', copyFailed: 'Выделите и скопируйте команды вручную.' },
  de: { title: 'Arbeitsbereich für Coding-Agenten', label: 'Sprache', copied: 'Befehle kopiert.', copyFailed: 'Markiere und kopiere die Befehle manuell.' },
  es: { title: 'Espacio para agentes de programación', label: 'Idioma', copied: 'Comandos copiados.', copyFailed: 'Selecciona y copia los comandos manualmente.' },
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
