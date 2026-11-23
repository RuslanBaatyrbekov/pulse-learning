/* Pulse · glossary
 * Glossary: terms and code concept cards.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- glossary ---------- */
var GT = 'terms',
  GQ = '';
function allTerms() {
  var out = [];
  ALL.forEach(function (l) {
    (l.terms || []).forEach(function (t) {
      out.push({ t: t, open: !!S.done[l.id], day: l.idx + 1 });
    });
  });
  return out;
}
function concepts() {
  return (C.concepts || []).map(function (k) {
    var L = LBY[k.after];
    return {
      k: k,
      open: !!S.done[k.after],
      day: L && L.idx != null && ALL[L.idx] === L ? L.idx + 1 : null,
      lt: L ? L.title : ''
    };
  });
}
function strip(x) {
  return String(x).replace(/<[^>]+>/g, '');
}
function gHay(x) {
  return x.k
    ? (x.k.h + ' ' + x.k.en + ' ' + x.k.de + ' ' + x.k.s + ' ' + strip(x.k.t) + ' ' + x.k.code).toLowerCase()
    : x.t.join(' ').toLowerCase();
}
function vGloss() {
  var ts = allTerms(),
    op = ts.filter(function (x) {
      return x.open;
    }),
    ks = concepts(),
    kop = ks.filter(function (x) {
      return x.open;
    });
  var h =
    header() +
    '<section><div class="eyebrow">Словарь</div><h1>' +
    (GT === 'terms' ? esc(M.termsTitle) : 'Программирование') +
    '</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">' +
    (GT === 'terms'
      ? esc(M.termsSub)
      : 'Главные понятия кода: что это, пример, что он выведет и типичная ошибка. Нажми на карточку, чтобы раскрыть.') +
    '</p></section>';
  h +=
    '<div class="seg" role="tablist"><button role="tab" data-a="gtab" data-v="terms" aria-selected="' +
    (GT === 'terms') +
    '">Термины <span class="num muted">' +
    op.length +
    '</span></button><button role="tab" data-a="gtab" data-v="code" aria-selected="' +
    (GT === 'code') +
    '">Программирование <span class="num muted">' +
    kop.length +
    '</span></button></div>';
  h +=
    '<input class="txt nsearch" id="gq" type="search" autocomplete="off" placeholder="' +
    esc(GT === 'terms' ? M.termsHint : M.codeHint) +
    '" value="' +
    esc(GQ) +
    '">';
  if (GT === 'terms') {
    if (!op.length) h += '<div class="card">Пройди первый урок, и здесь появятся первые термины.</div>';
    h +=
      '<div class="terms">' +
      op
        .map(function (x) {
          return (
            '<div class="term gitem" data-q="' +
            esc(gHay(x)) +
            '"><b lang="de">' +
            esc(x.t[0]) +
            '</b><span lang="en">' +
            esc(x.t[1]) +
            '</span><em>' +
            esc(x.t[2]) +
            '</em><span class="tday">день ' +
            x.day +
            '</span></div>'
          );
        })
        .join('') +
      '</div>';
    if (op.length < ts.length)
      h += '<p class="small muted">Ещё закрыто: ' + (ts.length - op.length) + '.</p>';
  } else {
    if (!ks.length)
      h +=
        '<div class="card">Карточки ещё не загружены в курс. Владелец курса может обновить его во вкладке «Наблюдение».</div>';
    else if (!kop.length)
      h +=
        '<div class="card">Первая карточка — «' +
        esc(ks[0].k.h) +
        '» — откроется после урока «' +
        esc(ks[0].lt) +
        '».</div>';
    h +=
      '<div class="cxs">' +
      kop
        .map(function (x) {
          var k = x.k;
          return (
            '<details class="cx gitem" data-q="' +
            esc(gHay(x)) +
            '" data-id="' +
            esc(k.id) +
            '"><summary><span class="grow"><b>' +
            esc(k.h) +
            '</b><span class="cxl"><span lang="en">' +
            esc(k.en) +
            '</span> · <span lang="de">' +
            esc(k.de) +
            '</span></span><span class="cxs1">' +
            esc(k.s) +
            '</span></span><span class="chev" aria-hidden="true">›</span></summary>' +
            '<div class="cxb"><p>' +
            k.t +
            '</p><div class="eyebrow">Пример</div><pre class="code">' +
            esc(k.code) +
            '</pre>' +
            (k.out ? '<div class="eyebrow">Результат</div><pre class="out">' + esc(k.out) + '</pre>' : '') +
            (k.tip ? '<p class="cxtip"><b>Частая ошибка.</b> ' + k.tip + '</p>' : '') +
            '<div class="row">' +
            (runnable(k.code)
              ? '<button class="btn small ghost" data-a="tosand" data-src="' +
                esc(k.code) +
                '">Попробовать в песочнице</button>'
              : '') +
            (x.day ? '<span class="small muted">Урок: день ' + x.day + ' · ' + esc(x.lt) + '</span>' : '') +
            '</div></div></details>'
          );
        })
        .join('') +
      '</div>';
    var nx = ks.filter(function (x) {
      return !x.open;
    });
    if (nx.length)
      h +=
        '<p class="small muted">Ещё закрыто: ' +
        nx.length +
        '.' +
        (nx[0].day ? ' Следующая — «' + esc(nx[0].k.h) + '», после дня ' + nx[0].day + '.' : '') +
        '</p>';
  }
  h += '<p class="small muted gempty" hidden>Ничего не нашлось.</p>';
  return h;
}
function gFilter() {
  var q = GQ.toLowerCase(),
    any = false;
  document.querySelectorAll('.gitem').forEach(function (el) {
    var hid = !!q && el.dataset.q.indexOf(q) < 0;
    el.hidden = hid;
    if (!hid) any = true;
  });
  var e = $('.gempty');
  if (e) e.hidden = any || !q;
}
