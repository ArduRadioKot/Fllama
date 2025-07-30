// Scroll reveal effect for sections
function revealOnScroll() {
  const reveals = document.querySelectorAll('section');
  const windowHeight = window.innerHeight;
  reveals.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    if (sectionTop < windowHeight - 80) {
      section.classList.add('visible');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  revealOnScroll();
  window.addEventListener('scroll', revealOnScroll);

  // Theme toggle
  const themeBtn = document.getElementById('themeToggle');
  const body = document.body;
  function setTheme(dark) {
    if (dark) {
      body.classList.add('dark-mode');
      themeBtn.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.remove('dark-mode');
      themeBtn.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    }
  }
  // Init theme
  const saved = localStorage.getItem('theme');
  setTheme(saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches));
  themeBtn.addEventListener('click', () => {
    setTheme(!body.classList.contains('dark-mode'));
  });

  // FAQ accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      faqItems.forEach(i => i !== item && i.classList.remove('open'));
      item.classList.toggle('open');
    });
  });
}); 
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация языка (по умолчанию английский)
    let currentLanguage = localStorage.getItem('language') || 'en';
    updateLanguage(currentLanguage);

    // Обработчик переключения языка
    document.getElementById('languageToggle').addEventListener('click', function() {
        currentLanguage = currentLanguage === 'en' ? 'ru' : 'en';
        localStorage.setItem('language', currentLanguage);
        updateLanguage(currentLanguage);
        this.textContent = currentLanguage === 'en' ? 'RU' : 'EN';
    });

    // Функция обновления языка
    function updateLanguage(lang) {
        fetch(`locales/${lang}.json`)
            .then(response => response.json())
            .then(translations => {
                document.querySelectorAll('[data-i18n]').forEach(element => {
                    const key = element.getAttribute('data-i18n');
                    if (translations[key]) {
                        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                            element.value = translations[key];
                        } else {
                            element.innerHTML = translations[key];
                        }
                    }
                });
            })
            .catch(error => console.error('Error loading language file:', error));
    }

    // Инициализация кнопки языка
    document.getElementById('languageToggle').textContent = currentLanguage === 'en' ? 'RU' : 'EN';

    // FAQ аккордеон
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            item.classList.toggle('open');
        });
    });
});