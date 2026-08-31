/* ArJan — портфолио: рендер карточек, фильтры и лайтбокс */
(function () {
  'use strict';
  var DATA = window.ARJAN_PORTFOLIO || [];
  var grid = document.querySelector('[data-pf-grid]');
  var filters = document.querySelector('[data-pf-filters]');
  if (!grid) return;

  var CAT_LABEL = { jk: 'Жилой комплекс', product: 'Продукция', production: 'Производство' };
  var countIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M21 15l-5-4-4 3-3-2-5 4"/></svg>';

  function cardHtml(item, i) {
    var cover = item.images[0];
    return (
      '<button type="button" class="pf-card" data-idx="' + i + '" data-cat="' + item.category + '">' +
        '<div class="pf-ph">' +
          '<img src="' + cover.thumb + '" alt="' + cover.alt + '" loading="lazy" width="480" height="360">' +
          '<span class="pf-tag">' + CAT_LABEL[item.category] + '</span>' +
          (item.images.length > 1 ? '<span class="pf-count">' + countIcon + item.images.length + '</span>' : '') +
        '</div>' +
        '<div class="body">' +
          '<h3>' + item.title + '</h3>' +
          '<div class="pf-meta">' + [item.city, item.developer].filter(Boolean).join(' · ') + '</div>' +
          '<div class="pf-note">' + (item.note || 'Объект с использованием оконных и дверных профилей ArJan.') + '</div>' +
        '</div>' +
      '</button>'
    );
  }

  function render(filter) {
    var items = DATA.filter(function (d) { return filter === 'all' || d.category === filter; });
    grid.innerHTML = items.map(function (d) { return cardHtml(d, DATA.indexOf(d)); }).join('');
  }
  render('all');

  if (filters) {
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.pf-filter');
      if (!btn) return;
      filters.querySelectorAll('.pf-filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      render(btn.dataset.filter);
    });
  }

  /* ---- lightbox ---- */
  var lb = document.getElementById('pfLightbox');
  if (!lb) return;
  var stage = lb.querySelector('.lightbox-stage');
  var caption = lb.querySelector('.lightbox-caption');
  var closeBtn = lb.querySelector('.lightbox-close');
  var prevBtn = lb.querySelector('.lightbox-prev');
  var nextBtn = lb.querySelector('.lightbox-next');
  var curItem = null, curIdx = 0, lastFocused = null;

  function paint() {
    var img = curItem.images[curIdx];
    stage.innerHTML = '<img src="' + img.full + '" alt="' + img.alt + '">';
    caption.textContent = curItem.title + ' — ' + (curIdx + 1) + ' / ' + curItem.images.length + ' — ' + img.alt;
  }
  function openLightbox(item) {
    curItem = item; curIdx = 0;
    lastFocused = document.activeElement;
    var multi = item.images.length > 1;
    prevBtn.style.display = nextBtn.style.display = multi ? 'flex' : 'none';
    paint();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeLightbox() {
    lb.classList.remove('open');
    stage.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }
  function step(dir) {
    curIdx = (curIdx + dir + curItem.images.length) % curItem.images.length;
    paint();
  }

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.pf-card');
    if (!card) return;
    openLightbox(DATA[+card.dataset.idx]);
  });
  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  var touchX = null;
  stage.parentElement.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  stage.parentElement.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });
})();
