/* Pulse · notes
 * Cheat sheets.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- cheat sheets ---------- */
var NCAT = 'all',
  NQ = '',
  NOTE = null;
function notes() {
  return (C.notes || []).filter(function (n) {
    return n && n.id;
  });
}
function md(x) {
  return esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
function nHay(n) {
  var b = (n.b || [])
    .map(function (x) {
      return (
        (x.h || '') +
        ' ' +
        (x.head || []).join(' ') +
        ' ' +
        (x.r || [])
          .map(function (r) {
            return r.join(' ');
          })
          .join(' ') +
        ' ' +
        (x.l || []).join(' ') +
        ' ' +
        (x.code || '')
      );
    })
    .join(' ');
  return (n.h + ' ' + n.tip + ' ' + b).replace(/\*\*/g, '').toLowerCase();
}
function nHide(n) {
  return (NCAT !== 'all' && n.cat !== NCAT) || (NQ && nHay(n).indexOf(NQ.toLowerCase()) < 0);
}
function vNotes() {
  var ns = notes(),
    h =
      header() +
      '<section><div class="eyebrow">Шпаргалки</div><h1>Всё под рукой</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">' +
      esc(M.notesSub) +
      '</p></section>';
  if (!ns.length)
    return (
      h +
      '<section class="card"><p class="small" style="margin:0">Шпаргалки ещё не загружены в курс. Владелец курса может обновить его во вкладке «Наблюдение».</p></section>'
    );
  h +=
    '<input class="txt nsearch" id="nq" type="search" autocomplete="off" placeholder="' +
    esc(M.notesHint) +
    '" value="' +
    esc(NQ) +
    '">';
  if (NCATS.length)
    h +=
      '<div class="ncats" role="tablist">' +
      [['all', 'Все']]
        .concat(NCATS)
        .map(function (c) {
          return (
            '<button class="chip' +
            (NCAT === c[0] ? ' on' : '') +
            '" role="tab" aria-selected="' +
            (NCAT === c[0]) +
            '" data-a="ncat" data-v="' +
            c[0] +
            '">' +
            esc(c[1]) +
            '</button>'
          );
        })
        .join('') +
      '</div>';
  h += '<div class="secs nlist">';
  ns.forEach(function (n) {
    h +=
      '<button class="sec nrow" data-a="note" data-v="' +
      esc(n.id) +
      '" data-cat="' +
      esc(n.cat) +
      '" data-q="' +
      esc(nHay(n)) +
      '"' +
      (nHide(n) ? ' hidden' : '') +
      '><span class="ico nico" aria-hidden="true">' +
      esc(n.ico || '📒') +
      '</span><span class="grow"><span class="tt">' +
      esc(n.h) +
      '</span><span class="st">' +
      esc(n.tip) +
      '</span></span><span aria-hidden="true" class="muted chev">›</span></button>';
  });
  h +=
    '</div><p class="small muted nempty"' +
    (ns.some(function (n) {
      return !nHide(n);
    })
      ? ' hidden'
      : '') +
    '>Ничего не нашлось. Попробуй другое слово.</p>';
  return h;
}
/* a table cell that looks like code: brackets, dots, quotes or =, and no Cyrillic */
function isCode(c) {
  return /[()[\]="._|]/.test(c) && !/[а-яё]/i.test(c);
}
function nFilter() {
  document.querySelectorAll('.nrow').forEach(function (b) {
    b.hidden =
      (NCAT !== 'all' && b.dataset.cat !== NCAT) || (NQ && b.dataset.q.indexOf(NQ.toLowerCase()) < 0);
  });
  var e = $('.nempty');
  if (e)
    e.hidden = notes().some(function (n) {
      return !nHide(n);
    });
}
function vNote() {
  var n = notes().filter(function (x) {
    return x.id === NOTE;
  })[0];
  if (!n) return vNotes();
  var cat = NCATS.filter(function (c) {
    return c[0] === n.cat;
  })[0];
  var h =
    header() +
    '<button class="btn small ghost nback" data-a="nback">← Все шпаргалки</button><section class="card note"><div class="eyebrow">' +
    esc(n.ico || '') +
    ' ' +
    esc(cat ? cat[1] : '') +
    '</div><h1>' +
    esc(n.h) +
    '</h1><p class="ntip">' +
    esc(n.tip) +
    '</p></section>';
  (n.b || []).forEach(function (b) {
    h += '<section class="card nblock">' + (b.h ? '<h3>' + md(b.h) + '</h3>' : '');
    if (b.t === 'tab') {
      h +=
        '<div class="ntab' +
        ((b.head || []).length >= 3 ? ' nw' : '') +
        '"><table><thead><tr>' +
        (b.head || [])
          .map(function (c) {
            return '<th>' + md(c) + '</th>';
          })
          .join('') +
        '</tr></thead><tbody>' +
        (b.r || [])
          .map(function (r) {
            return (
              '<tr>' +
              r
                .map(function (c, i) {
                  return i === 0
                    ? '<th scope="row">' + md(c) + '</th>'
                    : '<td' + (isCode(c) ? ' class="m"' : '') + '>' + md(c) + '</td>';
                })
                .join('') +
              '</tr>'
            );
          })
          .join('') +
        '</tbody></table></div>';
    } else if (b.t === 'code') {
      h +=
        '<pre class="code">' +
        esc(b.code) +
        '</pre>' +
        (runnable(b.code)
          ? '<div style="margin-top:8px"><button class="btn small ghost" data-a="tosand" data-src="' +
            esc(b.code) +
            '">Открыть в песочнице</button></div>'
          : '');
    } else
      h +=
        '<ul class="nlst">' +
        (b.l || [])
          .map(function (x) {
            return '<li>' + md(x) + '</li>';
          })
          .join('') +
        '</ul>';
    h += '</section>';
  });
  return h;
}
function openNote(id) {
  S.nt[id] = (S.nt[id] || 0) + 1;
  save();
  if (view !== 'note') {
    BACK = view;
    try {
      history.pushState({ pulsNote: 1 }, '');
    } catch (e) {}
  }
  NOTE = id;
  view = 'note';
  render();
  window.scrollTo(0, 0);
}
function closeNote() {
  NOTE = null;
  view = 'notes';
  render();
  window.scrollTo(0, 0);
}
/* code that can run in the sandbox: Python, no SQL, git, HTTP or package installs */
function runnable(c) {
  return (
    sandOn() &&
    !!c &&
    !/^\s*(SELECT|WITH|GET|git |!pip|\{)/i.test(c) &&
    !/(X_tr|\bX\b|pipe\.|plt\.|requests|read_csv|tabelle|\(a, b|\(x, y)/.test(c)
  );
}
