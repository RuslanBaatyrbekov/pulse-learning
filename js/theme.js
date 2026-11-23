/* Pulse · theme
 * Colour themes and avatars.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- themes and avatars ---------- */
var THEMES = [
  ['auto', 'Как в системе'],
  ['ekg', 'ЭКГ-бумага', ['#f2f5f4', '#0a7a74', '#d43f55', '#b9820a']],
  ['op', 'Операционная', ['#eef6f1', '#0f7a55', '#d6455d', '#a87600']],
  ['lab', 'Лаборатория', ['#f3f3fa', '#4b48c8', '#d9406a', '#9a7400']],
  ['night', 'Ночная смена', ['#0c181d', '#3ccdbd', '#ff6f82', '#e9b949']],
  ['monitor', 'Монитор', ['#070d0a', '#3ee07f', '#ff5f6d', '#ffd34d']],
  ['plum', 'Сумерки', ['#120f1a', '#b69cff', '#ff6f91', '#ffcf66']]
];
var AVATARS = [
  '🩺',
  '🫀',
  '🧠',
  '🧬',
  '🔬',
  '🧪',
  '💊',
  '📊',
  '📈',
  '🐍',
  '💡',
  '📚',
  '☕',
  '🎧',
  '🌿',
  '🌸',
  '🌻',
  '🦋',
  '🦉',
  '🦊',
  '🐱',
  '🐼',
  '⭐',
  '🚀'
];
function applyTheme(th) {
  var r = document.documentElement;
  if (!th || th === 'auto') r.removeAttribute('data-theme');
  else r.setAttribute('data-theme', th);
  try {
    localStorage.setItem(TKEY, th || 'auto');
  } catch (e) {}
  try {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', getComputedStyle(r).getPropertyValue('--paper').trim() || '#0c181d');
  } catch (e) {}
}
