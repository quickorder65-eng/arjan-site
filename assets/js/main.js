/* ==========================================================================
   ArJan — общая логика сайта (навигация, WhatsApp, филиалы, карта,
   FAQ, формы, карусель первого экрана, видео-модалка, reveal-анимации)
   ========================================================================== */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* отправить цель в Яндекс.Метрику, если счётчик подключён (см. site-data.js) */
  function ymGoal(name) {
    var id = window.ARJAN_YM_ID;
    if (id && window.ym) { try { window.ym(id, 'reachGoal', name); } catch (e) {} }
  }

  var ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.58 7-13A7 7 0 0 0 5 9c0 5.42 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.11 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.63 2.65a2 2 0 0 1-.45 2.11L8.09 9.67a16 16 0 0 0 6 6l1.19-1.19a2 2 0 0 1 2.11-.45c.86.3 1.75.51 2.65.63A2 2 0 0 1 22 16.92Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.706zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2.4 1.9 4 4.4 4.2v3c-1.6.1-3-.4-4.4-1.3v6.4a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3.1a2.8 2.8 0 1 0 2 2.7V3h3Z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 20l-6 2V6l6-2 6 2 6-2v16l-6 2-6-2Zm0 0V4m6 18V6"/></svg>'
  };

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------- header / mobile menu ---------- */
  function initHeader() {
    var burger = document.getElementById('burger');
    var mm = document.getElementById('mobileMenu');
    if (burger && mm) {
      burger.addEventListener('click', function () {
        var open = mm.classList.toggle('open');
        burger.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });
      mm.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          mm.classList.remove('open');
          burger.setAttribute('aria-expanded', false);
          document.body.style.overflow = '';
        });
      });
    }
    var hdr = document.querySelector('header.nav');
    if (hdr) {
      var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 10); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    // highlight current nav link
    var path = location.pathname.replace(/index\.html$/, '') || '/';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (a) {
      try {
        var url = new URL(a.href, location.href);
        if (url.pathname === location.pathname) a.classList.add('active');
      } catch (e) {}
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    document.querySelectorAll('.qa button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qa = btn.parentElement, ans = qa.querySelector('.ans');
        var open = qa.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
        ans.style.maxHeight = open ? ans.scrollHeight + 'px' : null;
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    if (reduceMotion) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, d = +el.dataset.rd || 0;
        io.unobserve(el);
        setTimeout(function () {
          el.classList.add('in');
          setTimeout(function () { el.classList.remove('reveal', 'in'); }, 750);
        }, d);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.shead,.calc,.ctaband,.cform,.partners,.map-block,.text-block').forEach(function (el) {
      el.classList.add('reveal'); io.observe(el);
    });
    ['.path', '.prod', '.case', '.proof-card', '.geo .city', '.qa', '.branch-card', '.step', '.pf-card', '.pshot'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        el.classList.add('reveal'); el.dataset.rd = Math.min(i, 6) * 70; io.observe(el);
      });
    });
  }

  /* ---------- number count-up (hero stats, production proof cards) ---------- */
  function initCounters() {
    var els = [].slice.call(document.querySelectorAll('.stat .num, .proof-card .n'));
    if (!els.length) return;

    function animate(el) {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      var node = el.firstChild;
      if (!node || node.nodeType !== 3) return;
      var raw = node.textContent.replace(/\s/g, '');
      var target = parseInt(raw, 10);
      if (!target && target !== 0) return;
      if (reduceMotion) { node.textContent = target.toLocaleString('ru-RU'); return; }
      var t0 = performance.now(), dur = 1200;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(target * e).toLocaleString('ru-RU');
        if (p < 1) requestAnimationFrame(tick);
        else node.textContent = target.toLocaleString('ru-RU');
      })(t0);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
      });
    }, { threshold: .4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero product carousel ---------- */
  function initHeroCarousel() {
    var root = document.querySelector('[data-hero-carousel]');
    if (!root) return;
    var slides = [].slice.call(root.querySelectorAll('.hero-slide'));
    var dots = [].slice.call(root.querySelectorAll('.hero-dot'));
    if (slides.length < 2) return;
    var idx = slides.findIndex(function (s) { return s.classList.contains('active'); });
    if (idx < 0) idx = 0;
    var timer = null;

    function show(i) {
      slides[idx].classList.remove('active');
      dots[idx] && dots[idx].classList.remove('active');
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      dots[idx] && dots[idx].classList.add('active');
    }
    function next() { show(idx + 1); }
    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(next, 4000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { show(i); start(); });
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    // swipe
    var touchX = null;
    root.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
      touchX = null; start();
    }, { passive: true });

    start();
  }

  /* ---------- video modal ---------- */
  function initVideoModal() {
    var backdrop = document.getElementById('videoModal');
    if (!backdrop) return;
    var frame = backdrop.querySelector('.video-modal-frame');
    var closeBtn = backdrop.querySelector('.video-modal-close');
    var lastFocused = null;

    function open(src, title) {
      lastFocused = document.activeElement;
      frame.innerHTML = '<video controls autoplay playsinline preload="none" src="' + src + '" aria-label="' + (title || 'Видео производства ArJan') + '"></video>';
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      backdrop.classList.remove('open');
      frame.innerHTML = '';
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }
    document.querySelectorAll('[data-video-trigger]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var vid = (window.ARJAN_VIDEOS || [])[0];
        var custom = btn.getAttribute('data-video-src');
        open(custom || (vid && vid.src), btn.getAttribute('data-video-title'));
      });
    });
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && backdrop.classList.contains('open')) close(); });
  }

  /* ---------- inline gif-style player (autoplay, muted, loop — starts when scrolled into view) ---------- */
  function initInlinePlayers() {
    document.querySelectorAll('[data-inline-video]').forEach(function (wrap) {
      var video = null;
      function ensureVideo() {
        if (video) return video;
        var src = wrap.getAttribute('data-src');
        var poster = wrap.getAttribute('data-poster');
        var v = document.createElement('video');
        v.src = src; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.poster = poster;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.style.width = '100%'; v.style.height = '100%'; v.style.objectFit = 'cover';
        wrap.innerHTML = '';
        wrap.appendChild(v);
        video = v;
        return v;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var v = ensureVideo();
            var playPromise = v.play();
            if (playPromise && playPromise.catch) playPromise.catch(function () {});
          } else if (video) {
            video.pause();
          }
        });
      }, { threshold: .35 });
      io.observe(wrap);
    });
  }

  /* ---------- social links ---------- */
  function renderSocial() {
    var list = window.ARJAN_SOCIAL || [];
    document.querySelectorAll('[data-social-list]').forEach(function (container) {
      var html = '';
      list.forEach(function (s) {
        if (!s.url) return;
        html += '<a href="' + s.url + '" target="_blank" rel="noopener" aria-label="' + s.name + '">' + (ICONS[s.id] || '') + '</a>';
      });
      container.innerHTML = html;
    });
  }

  /* ---------- WhatsApp drawer ---------- */
  function initWaDrawer() {
    var floatBtn = document.querySelector('.wa-float');
    var drawer = document.getElementById('waDrawer');
    var backdrop = document.getElementById('waDrawerBackdrop');
    if (!floatBtn || !drawer) return;
    var listEl = drawer.querySelector('[data-wa-branches]');
    var openBtn = drawer.querySelector('#waOpenBtn');
    var closeBtn = drawer.querySelector('.wa-close');

    var branches = window.ARJAN_BRANCHES || [];
    var current = (branches[0] && branches[0].whatsapp) || window.ARJAN_WA_MAIN || '77088005929';

    if (listEl) {
      listEl.innerHTML = branches.map(function (b, i) {
        return (
          '<button type="button" class="wa-branch-opt' + (i === 0 ? ' active' : '') + '" data-wa="' + b.whatsapp + '" aria-pressed="' + (i === 0) + '">' +
            '<svg class="wbo-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.58 7-13A7 7 0 0 0 5 9c0 5.42 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>' +
            '<span class="wbo-txt"><span class="wbo-city">' + b.city + '</span><span class="wbo-phone">' + b.phoneDisplay + '</span></span>' +
            '<span class="wbo-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6"><path d="M5 13l4 4L19 7"/></svg></span>' +
          '</button>'
        );
      }).join('');
      listEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.wa-branch-opt');
        if (!btn) return;
        listEl.querySelectorAll('.wa-branch-opt').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        current = btn.dataset.wa;
        updateHref();
      });
    }
    function updateHref() {
      var wa = current || window.ARJAN_WA_MAIN || '77088005929';
      openBtn.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Здравствуйте! Хочу узнать подробнее про окна и двери ArJan.');
    }
    updateHref();

    function openDrawer() {
      drawer.classList.add('open');
      backdrop && backdrop.classList.add('open');
      floatBtn.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      backdrop && backdrop.classList.remove('open');
      floatBtn.setAttribute('aria-expanded', 'false');
    }
    floatBtn.addEventListener('click', function (e) {
      e.preventDefault();
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    closeBtn && closeBtn.addEventListener('click', closeDrawer);
    backdrop && backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
  }

  /* ---------- branch cards + map ---------- */
  function branchCardHtml(b, i) {
    var badge = b.confirmed
      ? ''
      : '<div class="bc-note">Уточняется — свяжитесь по общему номеру</div>';
    return (
      '<div class="branch-card' + (i === 0 ? ' active' : '') + '" data-branch="' + b.id + '" data-map="' + encodeURIComponent(b.mapQuery) + '" tabindex="0" role="button" aria-pressed="' + (i === 0) + '">' +
        '<div class="bc-city">' + ICONS.pin + '<span>' + b.city + '</span></div>' +
        '<div class="bc-role">' + b.role + '</div>' +
        '<div class="bc-row">' + ICONS.pin + '<span>' + b.address + '</span></div>' +
        '<div class="bc-row">' + ICONS.phone + '<span><a href="tel:' + b.phone + '">' + b.phoneDisplay + '</a></span></div>' +
        '<div class="bc-row">' + ICONS.clock + '<span>' + b.hours + '</span></div>' +
        badge +
        '<div class="bc-actions">' +
          '<a class="btn btn--sun btn--sm" href="tel:' + b.phone + '">Позвонить</a>' +
          '<a class="btn btn--wa btn--sm" href="https://wa.me/' + b.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="btn btn--ghost btn--sm js-open-map" href="' + (b.mapUrl || ('https://www.google.com/maps?q=' + encodeURIComponent(b.mapQuery))) + '" target="_blank" rel="noopener">Открыть на карте</a>' +
        '</div>' +
      '</div>'
    );
  }

  function initBranches() {
    var listEl = document.querySelector('[data-branches-list]');
    var branches = window.ARJAN_BRANCHES || [];
    if (listEl) {
      listEl.innerHTML = branches.map(branchCardHtml).join('');
    }

    // deferred map
    var mapFrameWrap = document.querySelector('[data-map-frame]');
    var mapLoaded = false;
    function loadMap(query) {
      if (!mapFrameWrap) return;
      var q = query || (branches[0] && branches[0].mapQuery) || 'Алматы';
      mapFrameWrap.innerHTML = '<iframe src="https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed" loading="eager" referrerpolicy="no-referrer-when-downgrade" title="Карта филиалов ArJan"></iframe>';
      mapLoaded = true;
    }
    if (mapFrameWrap) {
      loadMap();
    }

    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var card = e.target.closest('.branch-card');
        if (!card || e.target.closest('a')) return;
        listEl.querySelectorAll('.branch-card').forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        card.classList.add('active');
        card.setAttribute('aria-pressed', 'true');
        loadMap(decodeURIComponent(card.dataset.map));
      });
      listEl.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('branch-card')) {
          e.preventDefault(); e.target.click();
        }
      });
    }
  }

  /* ---------- KZ phone mask ---------- */
  function attachPhoneMask(input) {
    input.addEventListener('input', function () {
      var digits = input.value.replace(/\D/g, '').replace(/^7/, '').replace(/^8/, '').slice(0, 10);
      var out = '+7';
      if (digits.length > 0) out += ' (' + digits.slice(0, 3);
      if (digits.length >= 3) out += ') ' + digits.slice(3, 6);
      if (digits.length >= 6) out += '-' + digits.slice(6, 8);
      if (digits.length >= 8) out += '-' + digits.slice(8, 10);
      input.value = out;
    });
    input.addEventListener('focus', function () { if (!input.value) input.value = '+7 ('; });
  }

  /* ---------- forms: validation + fake submit ---------- */
  function initForms() {
    document.querySelectorAll('form.cform').forEach(function (form) {
      var phoneInput = form.querySelector('input[type="tel"]');
      if (phoneInput) attachPhoneMask(phoneInput);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;
        form.querySelectorAll('[required]').forEach(function (field) {
          var row = field.closest('.frow') || field.parentElement;
          var bad = false;
          if (field.type === 'checkbox') bad = !field.checked;
          else if (field.type === 'tel') bad = field.value.replace(/\D/g, '').length < 11;
          else bad = !field.value.trim();
          field.classList.toggle('invalid', bad);
          if (row) row.classList.toggle('has-error', bad);
          if (bad) valid = false;
        });
        var msg = form.querySelector('.form-msg');
        if (!valid) {
          if (msg) { msg.textContent = 'Проверьте, пожалуйста, заполненные поля — есть обязательные пустые.'; msg.className = 'form-msg err'; }
          return;
        }
        var btn = form.querySelector('button[type="submit"], .js-submit');
        if (btn && btn.disabled) return;
        if (btn) { btn.disabled = true; btn.dataset.origText = btn.textContent; btn.textContent = 'Отправляем…'; }
        setTimeout(function () {
          if (msg) { msg.textContent = 'Заявка отправлена! Менеджер свяжется с вами в ближайшее время.'; msg.className = 'form-msg ok'; }
          ymGoal('form_submit');
          form.reset();
          if (btn) { btn.textContent = 'Заявка отправлена ✓'; }
          setTimeout(function () {
            if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origText; }
          }, 3500);
        }, 700);
      });
    });
  }

  /* ---------- Яндекс.Метрика ---------- */
  function initAnalytics() {
    var id = window.ARJAN_YM_ID;
    if (!id) return; // счётчик не настроен — ничего не грузим, сайт работает как обычно

    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

    window.ym(id, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });

    /* цели — ключевые действия, которые считаем заявкой/интересом */
    document.querySelectorAll('.wa-float').forEach(function (b) {
      b.addEventListener('click', function () { ymGoal('whatsapp_open'); });
    });
    var waOpenBtn = document.getElementById('waOpenBtn');
    if (waOpenBtn) waOpenBtn.addEventListener('click', function () { ymGoal('whatsapp_click'); });
    var cwa = document.getElementById('cwa');
    if (cwa) cwa.addEventListener('click', function () { ymGoal('calc_whatsapp_click'); });
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener('click', function () { ymGoal('phone_click'); });
    });
    var calcRoot = document.getElementById('calc');
    if (calcRoot) {
      var calcFired = false;
      calcRoot.addEventListener('click', function () {
        if (!calcFired) { calcFired = true; ymGoal('calc_interact'); }
      });
    }
  }

  ready(function () {
    initHeader();
    initFaq();
    initHeroCarousel();
    initVideoModal();
    initInlinePlayers();
    renderSocial();
    initWaDrawer();
    initBranches();
    initForms();
    initReveal();
    initCounters();
    initAnalytics();
  });
})();
