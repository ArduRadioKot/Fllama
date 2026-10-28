const I18N = {
  en: {
    skip: 'Skip to content',
    'nav.features': 'What it does',
    'nav.how': 'How it runs',
    'nav.faq': 'Questions',
    'nav.download': 'Download',
    'hero.l1': 'Chat stays',
    'hero.l2': 'on this machine.',
    'hero.sub': 'Desktop client for Ollama, LM Studio, Codex, Claude Code and OpenCode. Nothing is sent to us.',
    'hero.download': 'Download Fllama',
    'hero.source': 'Source on GitHub',
    'ui.chat': 'Chat',
    'ui.project': 'Project',
    'ui.thoughts': 'Thoughts',
    'ui.message': 'Message',
    'ui.placeholder': 'Ask the local model',
    'ui.send': 'Send',
    'ui.projectNote': 'The agent may read and edit files in this folder. Chat mode does not.',
    'ui.model': 'Model',
    'demo.user': 'Where does this conversation go?',
    'demo.think': 'Fllama is a local Electron client. The reply comes from a model on this computer. There is no Fllama cloud.',
    'demo.ai': 'It stays here. Fllama does not collect chats. The model you picked answers on this computer.',
    'demo.user2': 'Can it edit files?',
    'demo.ai2': 'Switch to Project and open a folder. Chat will not touch the disk.',
    'demo.reply': 'This demo runs in the page. In the app, the same island talks to a model on your machine.',
    'ghost.ai': 'Only in Project.',
    'features.title': 'What it does',
    'f1.title': 'Five providers, one window',
    'f1.body': 'Ollama and LM Studio stay on the computer. Codex, Claude Code and OpenCode join through the same settings.',
    'f2.title': 'Chat talks. Project works.',
    'f2.body': 'Chat is a thread with a model. Project points at a folder: the agent may list, read and edit files inside it, and nothing above it.',
    'f3.title': 'Answers as Markdown',
    'f3.body': 'Headings, lists, tables, fences and tasks render in the thread. Thoughts stay folded until you open them.',
    'how.title': 'How it runs',
    's1.a': 'Pick a model',
    's1.b': 'already on disk',
    's1.cap': 'Installed models appear in the list. Fllama does not download them unless you ask Ollama to.',
    's2.a': 'Ask from the',
    's2.b': 'chat island',
    's2.cap': 'Type in the same island the thread lives in. The reply streams in. Thoughts fold above it.',
    's3.a': 'Open the folder',
    's3.b': 'the work lives in',
    's3.cap': 'Project mode keeps the agent inside that path. It cannot walk out through .. or a symlink.',
    's4.a': 'Let the agent',
    's4.b': 'edit the files',
    's4.cap': 'It reads, searches and patches inside the folder. OpenCode keeps its own tools; Fllama does not double them.',
    'faq.title': 'Questions',
    'faq.1.q': 'Does Fllama collect any data?',
    'faq.1.a': 'No. Chats and project files stay on the machine. Fllama has no telemetry and no account.',
    'faq.2.q': 'Can I use it at work?',
    'faq.2.a': 'Yes. It is free for personal use and for internal use at a company. Read the GPL v2.0 licence for the exact terms.',
    'faq.3.q': 'What has to be installed?',
    'faq.3.a': 'Fllama itself, plus the provider you want: Ollama or LM Studio for local models, or Codex, Claude Code or OpenCode if you already use those.',
    'faq.4.q': 'Which models can I run?',
    'faq.4.a': 'Any model the chosen provider serves. For Ollama that includes Llama, Mistral, Gemma, Qwen and the rest of the <a href="https://ollama.com/library">Ollama library</a>.',
    'faq.5.q': 'Is the code open?',
    'faq.5.a': 'Yes. It lives on <a href="https://github.com/arduradiokot/fllama">GitHub</a> under GPL v2.0.',
    'faq.6.q': 'What is the difference between Chat and Project?',
    'faq.6.a': 'Chat is a conversation. Project attaches a folder so the agent can read and edit files inside it. OpenCode already has its own tools; Fllama does not stack a second set on top.',
    'dl.title': 'Download Fllama',
    'dl.lead': 'Version 1.0.0 for Windows, macOS and Linux. GPL v2.0, free for home and for work.',
    'dl.win': 'Windows 10 and 11, x64 installer.',
    'dl.mac': 'macOS 11+, Intel and Apple Silicon.',
    'dl.linux': 'AppImage and deb for x64.',
    'dl.btn': 'Download',
    'cta.win': 'Windows',
    'cta.mac': 'macOS',
    'cta.linux': 'Linux',
    'foot.license': 'GPL v2.0',
    'foot.releases': 'Releases'
  },
  ru: {
    skip: 'К содержанию',
    'nav.features': 'Что умеет',
    'nav.how': 'Как работает',
    'nav.faq': 'Вопросы',
    'nav.download': 'Скачать',
    'hero.l1': 'Чат остаётся',
    'hero.l2': 'на этой машине.',
    'hero.sub': 'Десктоп-клиент для Ollama, LM Studio, Codex, Claude Code и OpenCode. Нам ничего не отправляется.',
    'hero.download': 'Скачать Fllama',
    'hero.source': 'Код на GitHub',
    'ui.chat': 'Чат',
    'ui.project': 'Проект',
    'ui.thoughts': 'Мысли',
    'ui.message': 'Сообщение',
    'ui.placeholder': 'Спросите локальную модель',
    'ui.send': 'Отправить',
    'ui.projectNote': 'Агент может читать и править файлы в этой папке. В режиме чата этого нет.',
    'ui.model': 'Модель',
    'demo.user': 'Куда уходит этот разговор?',
    'demo.think': 'Fllama: локальный клиент на Electron. Ответ идёт от модели на этом компьютере. Облака Fllama нет.',
    'demo.ai': 'Он остаётся здесь. Fllama не собирает чаты. Отвечает модель, которую вы выбрали на этом компьютере.',
    'demo.user2': 'Он может править файлы?',
    'demo.ai2': 'Переключитесь в Проект и откройте папку. Чат диск не трогает.',
    'demo.reply': 'Это демо на странице. В приложении тот же остров говорит с моделью на вашей машине.',
    'ghost.ai': 'Только в Проекте.',
    'features.title': 'Что умеет',
    'f1.title': 'Пять провайдеров, одно окно',
    'f1.body': 'Ollama и LM Studio остаются на компьютере. Codex, Claude Code и OpenCode подключаются в тех же настройках.',
    'f2.title': 'Чат говорит. Проект работает.',
    'f2.body': 'Чат: переписка с моделью. Проект указывает на папку: агент может читать и править файлы внутри неё и нигде выше.',
    'f3.title': 'Ответы как Markdown',
    'f3.body': 'Заголовки, списки, таблицы, блоки кода и задачи рисуются в ленте. Мысли свёрнуты, пока их не открыть.',
    'how.title': 'Как работает',
    's1.a': 'Выберите модель',
    's1.b': 'уже на диске',
    's1.cap': 'В списке установленные модели. Fllama сама их не качает, пока вы не попросите Ollama.',
    's2.a': 'Спросите с',
    's2.b': 'острова чата',
    's2.cap': 'Пишите в том же острове, где живёт лента. Ответ идёт потоком. Мысли складываются над ним.',
    's3.a': 'Откройте папку',
    's3.b': 'где лежит работа',
    's3.cap': 'Режим проекта держит агента в этом пути. Выйти через .. или симлинк нельзя.',
    's4.a': 'Пусть агент',
    's4.b': 'правит файлы',
    's4.cap': 'Он читает, ищет и патчит внутри папки. У OpenCode свои инструменты; Fllama их не дублирует.',
    'faq.title': 'Вопросы',
    'faq.1.q': 'Собирает ли Fllama данные?',
    'faq.1.a': 'Нет. Чаты и файлы проекта остаются на машине. Нет телеметрии и нет аккаунта.',
    'faq.2.q': 'Можно ли использовать на работе?',
    'faq.2.a': 'Да. Бесплатно для себя и для внутреннего использования в компании. Точные условия в лицензии GPL v2.0.',
    'faq.3.q': 'Что нужно установить?',
    'faq.3.a': 'Саму Fllama и выбранный провайдер: Ollama или LM Studio для локальных моделей, либо Codex, Claude Code или OpenCode, если они у вас уже есть.',
    'faq.4.q': 'Какие модели можно запускать?',
    'faq.4.a': 'Любые, которые отдаёт выбранный провайдер. Для Ollama это Llama, Mistral, Gemma, Qwen и остальная <a href="https://ollama.com/library">библиотека Ollama</a>.',
    'faq.5.q': 'Код открытый?',
    'faq.5.a': 'Да. Он лежит на <a href="https://github.com/arduradiokot/fllama">GitHub</a> под GPL v2.0.',
    'faq.6.q': 'Чем чат отличается от проекта?',
    'faq.6.a': 'Чат: разговор. Проект прикрепляет папку, чтобы агент мог читать и править файлы внутри неё. У OpenCode свои инструменты; Fllama второй набор сверху не навешивает.',
    'dl.title': 'Скачать Fllama',
    'dl.lead': 'Версия 1.0.0 для Windows, macOS и Linux. GPL v2.0, бесплатно дома и на работе.',
    'dl.win': 'Установщик для Windows 10 и 11, x64.',
    'dl.mac': 'macOS 11+, Intel и Apple Silicon.',
    'dl.linux': 'AppImage и deb для x64.',
    'dl.btn': 'Скачать',
    'cta.win': 'Windows',
    'cta.mac': 'macOS',
    'cta.linux': 'Linux',
    'foot.license': 'GPL v2.0',
    'foot.releases': 'Релизы'
  }
};

const STEPS = [
  {
    cap: 's1.cap',
    label: 'ui.model',
    value: 'gemma3:4b',
    items: ['gemma3:4b', 'qwen3:8b', 'llama3.1:8b']
  },
  {
    cap: 's2.cap',
    label: 'ui.chat',
    value: 'gemma3:4b',
    items: ['Where does this conversation go?', 'It stays here.']
  },
  {
    cap: 's3.cap',
    label: 'ui.project',
    value: '/Users/you/notes',
    items: ['README.md', 'src/main.js', 'locales/en.json']
  },
  {
    cap: 's4.cap',
    label: 'ui.project',
    value: 'agent',
    items: ['read README.md', 'patch src/main.js', 'stay in /Users/you/notes']
  }
];

function applyI18n(lang) {
  const t = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = t[el.getAttribute('data-i18n')];
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const v = t[el.getAttribute('data-i18n-html')];
    if (v) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const v = t[el.getAttribute('data-i18n-placeholder')];
    if (v) el.setAttribute('placeholder', v);
  });
  const toggle = document.getElementById('languageToggle');
  if (toggle) toggle.textContent = lang === 'en' ? 'RU' : 'EN';
  const on = document.querySelector('.how-btn.is-on');
  if (on) setStep(Number(on.getAttribute('data-step')), lang);
}

function setStep(index, lang) {
  const t = I18N[lang || document.documentElement.lang] || I18N.en;
  const step = STEPS[index] || STEPS[0];
  const cap = document.getElementById('step-caption');
  const value = document.getElementById('step-value');
  const label = document.getElementById('step-label');
  const list = document.getElementById('step-list');
  if (cap) cap.textContent = t[step.cap];
  if (value) value.textContent = step.value;
  if (label) label.textContent = t[step.label] || step.label;
  if (list) {
    list.replaceChildren(...step.items.map((item, i) => {
      const li = document.createElement('li');
      if (i === 0) li.className = 'is-on';
      li.textContent = item;
      return li;
    }));
  }
  document.querySelectorAll('.how-btn').forEach((el, i) => {
    const on = i === index;
    el.classList.toggle('is-on', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  let lang = localStorage.getItem('language') || 'en';
  if (lang !== 'en' && lang !== 'ru') lang = 'en';
  applyI18n(lang);

  document.getElementById('languageToggle').addEventListener('click', () => {
    lang = lang === 'en' ? 'ru' : 'en';
    localStorage.setItem('language', lang);
    applyI18n(lang);
  });

  document.querySelectorAll('.ui-mode').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ui-mode').forEach((b) => b.classList.toggle('is-on', b === btn));
      const project = btn.getAttribute('data-mode') === 'project';
      document.getElementById('live-thread').hidden = project;
      document.getElementById('live-form').hidden = project;
      document.getElementById('live-project').hidden = !project;
    });
  });

  document.querySelectorAll('.ui-thought-toggle').forEach((btn) => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('is-open'));
  });

  document.querySelectorAll('.ui-menu button').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b === btn));
    });
  });

  const form = document.getElementById('live-form');
  const input = document.getElementById('live-input');
  const thread = document.getElementById('live-thread');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = (input.value || '').trim();
    if (!text) return;
    const user = document.createElement('div');
    user.className = 'ui-user';
    user.textContent = text;
    const ai = document.createElement('div');
    ai.className = 'ui-ai';
    ai.textContent = (I18N[lang] || I18N.en)['demo.reply'];
    thread.append(user, ai);
    input.value = '';
    thread.scrollTop = thread.scrollHeight;
  });

  document.querySelectorAll('.how-btn').forEach((btn) => {
    btn.addEventListener('click', () => setStep(Number(btn.getAttribute('data-step')), lang));
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.hero-copy h1, .hero-copy .lead, .hero-cta, .feat, .how-grid, .faq details, .dl-row').forEach((el) => io.observe(el));
  }
});
