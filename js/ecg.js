/* Pulse · ecg
 * ECG-style streak strip and activity heat map.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- ECG strip ---------- */
function stripSvg(st) {
  st = st || S;
  var n = 14,
    w = 560 / n,
    y = 46,
    p = 'M0 ' + y,
    lab = '',
    t = new Date();
  for (var i = 0; i < n; i++) {
    var d = addDays(t, i - (n - 1)),
      k = ds(d),
      x = i * w;
    if (st.days[k] !== undefined) {
      var h = Math.min(36, 16 + (st.days[k] || 0) / 5);
      p +=
        ' L' +
        (x + w * 0.2) +
        ' ' +
        y +
        ' Q' +
        (x + w * 0.28) +
        ' ' +
        (y - 6) +
        ' ' +
        (x + w * 0.36) +
        ' ' +
        y +
        ' L' +
        (x + w * 0.44) +
        ' ' +
        (y + 5) +
        ' L' +
        (x + w * 0.52) +
        ' ' +
        (y - h) +
        ' L' +
        (x + w * 0.6) +
        ' ' +
        (y + 9) +
        ' L' +
        (x + w * 0.66) +
        ' ' +
        y +
        ' Q' +
        (x + w * 0.78) +
        ' ' +
        (y - 9) +
        ' ' +
        (x + w * 0.9) +
        ' ' +
        y +
        ' L' +
        (x + w) +
        ' ' +
        y;
    } else if (st.frozen && st.frozen[k]) {
      p +=
        ' L' +
        (x + w * 0.4) +
        ' ' +
        y +
        ' Q' +
        (x + w * 0.5) +
        ' ' +
        (y - 5) +
        ' ' +
        (x + w * 0.6) +
        ' ' +
        y +
        ' L' +
        (x + w) +
        ' ' +
        y;
    } else p += ' L' + (x + w) + ' ' + y;
    lab += '<text x="' + (x + w / 2) + '" y="70" text-anchor="middle">' + d.getDate() + '</text>';
  }
  return (
    '<svg class="strip" viewBox="0 0 560 76" preserveAspectRatio="none" role="img" aria-label="Активность за 14 дней"><line class="today" x1="' +
    (560 - w) +
    '" y1="4" x2="' +
    (560 - w) +
    '" y2="60"/><path d="' +
    p +
    '"/>' +
    lab +
    '</svg>'
  );
}
function heat(st) {
  st = st || S;
  var cells = '',
    t = new Date(),
    start = addDays(t, -(((t.getDay() + 6) % 7) + 28));
  for (var i = 0; i < 35; i++) {
    var d = addDays(start, i),
      k = ds(d);
    cells +=
      '<i class="' +
      (st.days[k] !== undefined ? 'a' : st.frozen && st.frozen[k] ? 'f' : '') +
      (k === today() ? ' t' : '') +
      '" title="' +
      k +
      '"></i>';
  }
  return '<div class="heat">' + cells + '</div>';
}
