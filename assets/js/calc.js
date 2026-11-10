/* ArJan — калькулятор ориентировочной стоимости (главная страница) */
(function () {
  'use strict';
  var root = document.getElementById('calc');
  if (!root) return;

  var copts = [].slice.call(document.querySelectorAll('.copt'));
  var cw = document.getElementById('cw'), ch = document.getElementById('ch'),
      cwv = document.getElementById('cwv'), chv = document.getElementById('chv'),
      ccount = document.getElementById('ccount'),
      priceEl = document.getElementById('cprice'), areaEl = document.getElementById('carea'),
      wa = document.getElementById('cwa');
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var cbase = 45000, cname = 'Пластиковые окна ПВХ', ccity = 'Алматы';
  var fmt = function (n) { return Math.round(n).toLocaleString('ru-RU'); };

  function fill(el) {
    var p = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.background = 'linear-gradient(90deg,var(--sun) ' + p + '%,var(--mist) ' + p + '%)';
  }

  var aLow = 0, aHigh = 0, raf;
  function setPrice(low, high) {
    if (reduce) { aLow = low; aHigh = high; priceEl.innerHTML = fmt(low) + ' – ' + fmt(high) + ' <span>₸</span>'; return; }
    cancelAnimationFrame(raf);
    var sL = aLow, sH = aHigh, t0 = performance.now(), dur = 450;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      aLow = sL + (low - sL) * e; aHigh = sH + (high - sH) * e;
      priceEl.innerHTML = fmt(aLow) + ' – ' + fmt(aHigh) + ' <span>₸</span>';
      if (p < 1) raf = requestAnimationFrame(tick);
    })(t0);
  }

  function calc() {
    var w = +cw.value, h = +ch.value, count = Math.max(1, parseInt(ccount.value) || 1);
    cwv.textContent = w; chv.textContent = h;
    var area = (w * h) / 10000; if (area < 0.5) area = 0.5;
    var totalArea = area * count, mid = cbase * totalArea;
    var low = Math.round(mid * 0.92 / 1000) * 1000, high = Math.round(mid * 1.25 / 1000) * 1000;
    setPrice(low, high);
    areaEl.textContent = 'Площадь ' + totalArea.toFixed(2) + ' м² · ' + count + ' шт · ' + ccity + '. Цена ориентировочная, точная — после бесплатного замера.';
    var waNum = (window.ARJAN_WA_MAIN || '77088005929');
    wa.href = 'https://wa.me/' + waNum + '?text=' + encodeURIComponent(
      'Здравствуйте! Хочу рассчитать: ' + cname + ', ' + w + '×' + h + ' см, ' + count + ' шт, город ' + ccity + '. Ориентир по сайту: ' + fmt(low) + '–' + fmt(high) + ' ₸.');
  }

  copts.forEach(function (o) {
    o.addEventListener('click', function () {
      copts.forEach(function (x) { x.classList.remove('active'); });
      o.classList.add('active');
      cbase = +o.dataset.base; cname = o.dataset.name; calc();
    });
  });
  document.querySelectorAll('#cseg button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#cseg button').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); ccity = b.textContent; calc();
    });
  });
  document.getElementById('cminus').addEventListener('click', function () { ccount.value = Math.max(1, (parseInt(ccount.value) || 1) - 1); calc(); });
  document.getElementById('cplus').addEventListener('click', function () { ccount.value = Math.min(500, (parseInt(ccount.value) || 1) + 1); calc(); });
  ccount.addEventListener('input', function () { ccount.value = ccount.value.replace(/\D/g, ''); calc(); });
  [cw, ch].forEach(function (el) { el.addEventListener('input', function () { fill(el); calc(); }); });
  fill(cw); fill(ch); calc();
})();
