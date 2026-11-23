/* Pulse · course-meta
 * Course look and texts: defaults for the first course and for courses with `meta`.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* Course look and texts. A course without `meta` gets the look of the first course ("Пульс данных"),
   so courses uploaded earlier look as before. A course with `meta` starts from neutral defaults and overrides any of them. */
var LEGACY = {
  brand: 'Пульс данных',
  avatar: '🩺',
  sandbox: 'python',
  levels: [
    [0, 'Новичок в отделении'],
    [120, 'Сборщик данных'],
    [300, 'Младший аналитик'],
    [550, 'Детектив данных'],
    [900, 'Клинический аналитик'],
    [1400, 'Знаток Python'],
    [2000, 'Хранитель таблиц'],
    [3000, 'Статистик у постели'],
    [4500, 'Строитель моделей'],
    [6500, 'Переводчик стандартов'],
    [9000, 'Знаток регуляторики'],
    [12000, 'Исследователь сигналов'],
    [15000, 'Специалист своего трека'],
    [18000, 'Готова к новой профессии']
  ],
  tags: {
    py: 'Python',
    dom: 'Медицина и ИТ',
    stat: 'Статистика',
    sql: 'SQL',
    ml: 'Машинное обучение',
    reg: 'Регуляторика',
    sig: 'Сигналы',
    car: 'Карьера',
    boss: 'Контрольная'
  },
  tagIcons: {
    py: 'py',
    dom: '🏥',
    stat: 'x̄ σ',
    sql: 'SQL',
    ml: 'ML',
    reg: '§',
    sig: '∿',
    car: 'CV',
    boss: '★'
  },
  noteCats: [
    ['py', 'Python'],
    ['data', 'Данные'],
    ['stat', 'Статистика и ML'],
    ['med', 'Медицина и право'],
    ['job', 'Карьера']
  ],
  tracks: { ds: { name: 'Medical Data Science' }, dh: { name: 'Digital Health' } },
  trackPrompt:
    'Выбери трек на следующие пять недель: Medical Data Science — модели и исследования, Digital Health — продукт, стандарты и качество. Сменить можно в профиле.',
  roadmapTitle: 'Маршрут до смены профессии',
  notesSub:
    'Короткие справки: синтаксис, таблицы, формулы, стандарты. Открывай, когда пишешь код в Colab или читаешь вакансию.',
  notesHint: 'Поиск: groupby, JOIN, p-value, FHIR…',
  termsHint: 'Поиск: Datenschutz, cohort, выборка…',
  codeHint: 'Поиск: список, цикл, JOIN…',
  missionLabel: 'Открыть Google Colab',
  milestones: [
    ['Первая смена', 'Контрольная недели 1', 'b1'],
    ['Практик', 'Сделана практика в Colab', '@mission'],
    ['Табличный ум', 'Пройдена неделя 3', 'b3'],
    ['Первый месяц', 'Все 28 дней', 'b4'],
    ['Проект 1', 'Разведочный анализ', 'b9'],
    ['Проект 2', 'Модель прогноза', 'b15'],
    ['Свой путь', 'Выбран трек', '@track'],
    ['Финал', 'Курс пройден целиком', 'w36_b']
  ],
  tutor:
    'Ты терпеливый наставник. Ученица — медицинский техник из немецкой клиники, начинает учить medical data science с нуля. Объясни по-русски, просто, в 3–5 предложениях, почему правильный ответ именно такой. Приведи один пример из больничной практики. Без приветствий, без разметки.',
  invite: 'Пульс данных — ежедневный курс Medical Data Science',
  tour: 'legacy',
  termsTitle: 'Термины на трёх языках',
  termsSub:
    'Немецкий термин, английский и пояснение — так они стоят в вакансиях. Новые открываются после каждого урока.',
  missionDone: 'Сделала, +30 XP'
};
var NEUTRAL = {
  brand: 'Pulse',
  avatar: '📘',
  sandbox: null,
  levels: [
    [0, 'Новичок'],
    [120, 'Ученик'],
    [300, 'Практик'],
    [550, 'Уверенный'],
    [900, 'Продвинутый'],
    [1400, 'Знаток'],
    [2000, 'Эксперт'],
    [3000, 'Мастер'],
    [4500, 'Наставник'],
    [6500, 'Легенда']
  ],
  tags: { boss: 'Контрольная' },
  tagIcons: { boss: '★' },
  noteCats: [],
  tracks: {},
  trackPrompt: 'Общая часть пройдена. Выбери, как продолжить курс. Сменить можно в профиле.',
  roadmapTitle: 'Дальше по плану',
  notesSub: 'Короткие справки по темам курса: синтаксис, таблицы, примеры.',
  notesHint: 'Поиск по шпаргалкам…',
  termsHint: 'Поиск по терминам…',
  codeHint: 'Поиск по карточкам…',
  missionLabel: 'Открыть задание',
  milestones: [
    ['Практик', 'Сделано практическое задание', '@mission'],
    ['Свой путь', 'Выбран трек', '@track'],
    ['Финал', 'Курс пройден целиком', '@final']
  ],
  tutor:
    'Ты терпеливый наставник. Объясни по-русски, просто, в 3–5 предложениях, почему правильный ответ именно такой. Приведи один короткий практический пример. Без приветствий, без разметки.',
  invite: '',
  tour: 'neutral',
  termsTitle: 'Термины',
  termsSub: 'Термин, его второе название и пояснение. Новые открываются после каждого урока.',
  missionDone: 'Готово, +30 XP'
};
var M = LEGACY,
  LEVELS = M.levels,
  TAGS = M.tags,
  TAG_ICO = M.tagIcons,
  NCATS = M.noteCats;
function applyMeta(c) {
  M = Core.courseMeta(c, LEGACY, NEUTRAL);
  LEVELS = M.levels;
  TAGS = M.tags;
  TAG_ICO = M.tagIcons;
  NCATS = M.noteCats || [];
  try {
    document.title = M.brand;
  } catch (e) {}
}
function sandOn() {
  return M.sandbox === 'python';
}
