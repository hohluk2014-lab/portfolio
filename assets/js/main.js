/* ==========================================================================
   ЛОГИКА САЙТА
   --------------------------------------------------------------------------
   Без библиотек и сборки: только браузерный JS. Всё содержимое берётся
   из assets/js/content.js, поэтому трогать этот файл почти никогда не нужно.
   ========================================================================== */
(function () {
  'use strict';

  var data = window.PORTFOLIO || { filters: [], photos: [], films: [] };
  var photos = Array.isArray(data.photos) ? data.photos : [];
  var films = Array.isArray(data.films) ? data.films : [];
  var filters = Array.isArray(data.filters) && data.filters.length ? data.filters : [{ id: 'all', label: 'Все' }];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------ */
  /* Галерея                                                            */
  /* ------------------------------------------------------------------ */
  var grid = $('#grid');
  var filtersBox = $('#filters');
  var countBox = $('#works-count');
  var currentFilter = 'all';
  var visiblePhotos = []; // фотографии, которые сейчас в сетке — для лайтбокса

  function cardMarkup(item, index) {
    var ratio = item.w && item.h ? item.w + ' / ' + item.h : '3 / 4';
    var meta = [item.meta, item.year].filter(Boolean).join(' · ');

    return '' +
      '<article class="card" data-tags="' + (item.tags || []).join(' ') + '">' +
        '<button class="card__btn" type="button" data-photo="' + index + '" ' +
          'aria-label="' + escapeAttr(item.title) + (meta ? ', ' + escapeAttr(meta) : '') + '. Открыть фотографию">' +
          '<div class="card__media" style="aspect-ratio:' + ratio + '">' +
            '<img src="' + escapeAttr(item.src) + '" alt="' + escapeAttr(item.alt || item.title || '') + '" ' +
              'width="' + (item.w || 1200) + '" height="' + (item.h || 1600) + '" ' +
              'loading="lazy" decoding="async">' +
          '</div>' +
          '<div class="card__meta">' +
            '<span>' +
              '<span class="card__title">' + escapeHtml(item.title || 'Без названия') + '</span>' +
              (item.meta ? '<span class="card__sub">' + escapeHtml(item.meta) + '</span>' : '') +
            '</span>' +
            (item.year ? '<span class="card__year">' + escapeHtml(String(item.year)) + '</span>' : '') +
          '</div>' +
        '</button>' +
      '</article>';
  }

  function renderGallery() {
    if (!grid) return;

    if (!photos.length) {
      grid.innerHTML = '<p class="works__empty">Работы пока не добавлены. Укажите файлы в assets/js/content.js.</p>';
      return;
    }

    grid.innerHTML = photos.map(cardMarkup).join('');

    $$('.card', grid).forEach(function (card, i) {
      card.style.animationDelay = (reduceMotion ? 0 : Math.min(i, 9) * 45) + 'ms';
    });

    applyFilter(currentFilter);
  }

  function renderFilters() {
    if (!filtersBox) return;

    filtersBox.innerHTML = filters.map(function (f) {
      return '<button class="filter' + (f.id === currentFilter ? ' is-active' : '') + '" ' +
        'type="button" data-filter="' + escapeAttr(f.id) + '" aria-pressed="' + (f.id === currentFilter) + '">' +
        escapeHtml(f.label) + '</button>';
    }).join('');
  }

  function applyFilter(id) {
    currentFilter = id;
    visiblePhotos = [];

    $$('.card', grid).forEach(function (card) {
      var tags = (card.getAttribute('data-tags') || '').split(/\s+/);
      var match = id === 'all' || tags.indexOf(id) !== -1;
      card.hidden = !match;
      if (match) {
        var btn = $('.card__btn', card);
        visiblePhotos.push(Number(btn.getAttribute('data-photo')));
      }
    });

    $$('.filter', filtersBox).forEach(function (btn) {
      var on = btn.getAttribute('data-filter') === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on);
    });

    if (countBox) {
      countBox.textContent = visiblePhotos.length === photos.length
        ? 'Всего ' + photos.length + ' кадров'
        : 'Показано ' + visiblePhotos.length + ' из ' + photos.length;
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escapeAttr(str) { return escapeHtml(str); }

  /* ------------------------------------------------------------------ */
  /* Лайтбокс                                                           */
  /* ------------------------------------------------------------------ */
  var lb = $('#lightbox');
  var lbImg = $('#lb-img');
  var lbCaption = $('#lb-caption');
  var lbCounter = $('#lb-counter');
  var lbIndex = 0;
  var lastFocused = null;

  function openLightbox(photoIndex) {
    var pos = visiblePhotos.indexOf(photoIndex);
    if (pos === -1 || !lb) return;

    lbIndex = pos;
    lastFocused = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('is-locked');
    updateLightbox();
    $('#lb-close').focus({ preventScroll: true });
    preloadNeighbours();
  }

  function updateLightbox() {
    var item = photos[visiblePhotos[lbIndex]];
    if (!item) return;

    lbImg.src = item.src;
    lbImg.alt = item.alt || item.title || '';
    lbImg.style.animation = 'none';
    // перезапуск анимации появления
    void lbImg.offsetWidth;
    lbImg.style.animation = '';

    var meta = [item.meta, item.year].filter(Boolean).join(' · ');
    lbCaption.innerHTML = '<strong>' + escapeHtml(item.title || '') + '</strong>' +
      (meta ? ' — ' + escapeHtml(meta) : '');

    lbCounter.textContent = pad(lbIndex + 1) + ' / ' + pad(visiblePhotos.length);
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function stepLightbox(dir) {
    if (!visiblePhotos.length) return;
    lbIndex = (lbIndex + dir + visiblePhotos.length) % visiblePhotos.length;
    updateLightbox();
    preloadNeighbours();
  }

  function preloadNeighbours() {
    [1, -1].forEach(function (d) {
      var item = photos[visiblePhotos[(lbIndex + d + visiblePhotos.length) % visiblePhotos.length]];
      if (!item || !item.src) return;
      var img = new Image();
      img.src = item.src;
    });
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.classList.remove('is-locked');
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------ */
  /* Видео                                                              */
  /* ------------------------------------------------------------------ */
  var vm = $('#video-modal');
  var vmFrame = $('#vm-frame');
  var vmTitle = $('#vm-title');
  var vmNote = $('#vm-note');

  function mediaUrl(path) {
    return String(path).split('/').map(function (part) {
      return encodeURIComponent(part);
    }).join('/');
  }

  function rutubeEmbed(url) {
    if (!url) return '';
    var trimmed = String(url).trim();
    if (!/^https?:/i.test(trimmed)) return '';

    try {
      var u = new URL(trimmed);
      var match = u.pathname.match(/\/(?:video|play\/embed)\/([A-Za-z0-9]+)/);
      if (!match) return '';
      var privateHash = u.searchParams.get('p');
      return 'https://rutube.ru/play/embed/' + match[1] + '/' + (privateHash ? '?p=' + encodeURIComponent(privateHash) : '');
    } catch (e) {
      return '';
    }
  }

  function openFilm(index) {
    var film = films[index];
    if (!film || !vm) return;

    lastFocused = document.activeElement;
    vm.hidden = false;
    document.body.classList.add('is-locked');
    vmTitle.textContent = film.title || 'Видео';
    vmFrame.innerHTML = '';
    vmNote.textContent = '';

    var embed = film.src ? '' : rutubeEmbed(film.rutube);

    if (film.src) {
      var video = document.createElement('video');
      video.src = mediaUrl(film.src);
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto';
      if (film.poster) video.poster = film.poster;
      video.setAttribute('controlslist', 'nodownload');
      vmFrame.appendChild(video);
      video.play().catch(function () {});
      vmNote.textContent = [film.meta, film.duration].filter(Boolean).join(' · ');
    } else if (embed) {
      var iframe = document.createElement('iframe');
      iframe.src = embed + (embed.indexOf('?') === -1 ? '?autoplay=1' : '&autoplay=1');
      iframe.title = film.title || 'Видео';
      iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      vmFrame.appendChild(iframe);
      vmNote.textContent = 'Плеер RUTUBE';
    } else {
      var poster = document.createElement('div');
      poster.className = 'vm-poster';
      if (film.poster) poster.style.backgroundImage = 'url("' + film.poster.replace(/"/g, '%22') + '")';
      poster.innerHTML =
        '<div class="vm-poster__text">' +
          '<strong>Здесь будет плеер RUTUBE</strong>' +
          '<span>Ссылка на ролик «' + escapeHtml(film.title || '') + '» ещё не добавлена. ' +
          'Впишите её в поле <code>rutube</code> в файле assets/js/content.js</span>' +
        '</div>';
      vmFrame.appendChild(poster);
      vmNote.textContent = 'Заглушка: ' + (film.duration ? film.duration + ' · ' : '') + 'ссылка на RUTUBE не задана';
    }

    $('#vm-close').focus({ preventScroll: true });
  }

  function closeFilm() {
    if (!vm || vm.hidden) return;
    vm.hidden = true;
    vmFrame.innerHTML = ''; // останавливает воспроизведение
    document.body.classList.remove('is-locked');
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  }

  function renderFilms() {
    var list = $('#films-list');
    if (!list) return;

    if (!films.length) {
      list.innerHTML = '<p class="works__empty">Видео пока не добавлено.</p>';
      return;
    }

    list.innerHTML = films.map(function (film, i) {
      var badges = [];
      if (film.badge) badges.push('<span class="film__badge">' + escapeHtml(film.badge) + '</span>');

      return '' +
        '<article class="film reveal' + (i === 0 ? ' film--lead' : '') + '">' +
          '<button class="film__btn" type="button" data-film-open="' + i + '" ' +
            'aria-label="Смотреть «' + escapeAttr(film.title || 'видео') + '»">' +
            (film.poster
              ? '<img src="' + escapeAttr(film.poster) + '" alt="" loading="lazy" decoding="async">'
              : (film.src
                ? '<video src="' + escapeAttr(mediaUrl(film.src)) + '" muted preload="metadata" playsinline></video>'
                : '')) +
            '<span class="film__shade"></span>' +
            badges.join('') +
            '<span class="film__play" aria-hidden="true"></span>' +
            (film.duration ? '<span class="film__duration">' + escapeHtml(film.duration) + '</span>' : '') +
          '</button>' +
          '<div class="film__text">' +
            '<div>' +
              '<div class="film__title">' + escapeHtml(film.title || '') + '</div>' +
              (film.meta ? '<div class="film__meta">' + escapeHtml(film.meta) + '</div>' : '') +
            '</div>' +
            (film.year ? '<span class="card__year">' + escapeHtml(String(film.year)) + '</span>' : '') +
          '</div>' +
        '</article>';
    }).join('');
  }

  /* ------------------------------------------------------------------ */
  /* Шапка, меню                                                        */
  /* ------------------------------------------------------------------ */
  var header = $('#header');
  var burger = $('#burger');
  var mobileMenu = $('#mobile-menu');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }

  function setMenu(open) {
    if (!mobileMenu || !burger) return;
    mobileMenu.hidden = !open;
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('is-locked', open);
  }

  /* ------------------------------------------------------------------ */
  /* Первый экран: смена кадров                                         */
  /* ------------------------------------------------------------------ */
  var slides = $$('.hero__slide');
  var slideIndex = 0;

  function nextSlide() {
    if (slides.length < 2 || document.hidden) return;
    slides[slideIndex].classList.remove('is-active');
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add('is-active');
  }

  /* ------------------------------------------------------------------ */
  /* Появление при скролле и счётчики                                   */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = Number(el.getAttribute('data-count')) || 0;
        var start = performance.now();
        var duration = 1200;

        function tick(now) {
          var p = Math.min(1, (now - start) / duration);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ */
  /* Активный пункт меню                                                */
  /* ------------------------------------------------------------------ */
  function initNavSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.nav__link');
    var sections = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.style.color = a.getAttribute('href') === '#' + entry.target.id ? 'var(--ink)' : '';
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------ */
  /* Курсор-подпись                                                     */
  /* ------------------------------------------------------------------ */
  function initCursorLabel() {
    var label = $('#cursor-label');
    if (!label || !finePointer) return;

    var active = false;

    document.addEventListener('pointermove', function (e) {
      label.style.setProperty('--x', e.clientX + 'px');
      label.style.setProperty('--y', e.clientY + 'px');
    }, { passive: true });

    function show(el, text) {
      active = true;
      label.textContent = text;
      label.classList.add('is-visible');
    }

    function hide() {
      active = false;
      label.classList.remove('is-visible');
    }

    grid.addEventListener('pointerover', function (e) {
      var card = e.target.closest('.card');
      if (card) show(card, 'смотреть');
    });
    grid.addEventListener('pointerout', function (e) {
      if (e.target.closest('.card')) hide();
    });

    var filmsBox = $('#films-list');
    if (filmsBox) {
      filmsBox.addEventListener('pointerover', function (e) {
        if (e.target.closest('.film__btn')) show(e.target, 'смотреть фильм');
      });
      filmsBox.addEventListener('pointerout', function (e) {
        if (e.target.closest('.film__btn')) hide();
      });
    }

    window.addEventListener('scroll', hide, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Обработчики                                                        */
  /* ------------------------------------------------------------------ */
  function bind() {
    if (filtersBox) {
      filtersBox.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter');
        if (!btn) return;
        applyFilter(btn.getAttribute('data-filter'));
      });
    }

    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('.card__btn');
        if (btn) openLightbox(Number(btn.getAttribute('data-photo')));
      });
    }

    var filmsList = $('#films-list');
    if (filmsList) {
      filmsList.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-film-open]');
        if (btn) openFilm(Number(btn.getAttribute('data-film-open')));
      });
    }

    $$('[data-film-open]').forEach(function (btn) {
      if (btn.closest('#films-list')) return;
      btn.addEventListener('click', function () {
        openFilm(Number(btn.getAttribute('data-film-open')));
      });
    });

    if (lb) {
      $('#lb-close').addEventListener('click', closeLightbox);
      $('#lb-prev').addEventListener('click', function () { stepLightbox(-1); });
      $('#lb-next').addEventListener('click', function () { stepLightbox(1); });

      lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLightbox();
      });

      var startX = null;
      lb.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
      }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 55) stepLightbox(dx > 0 ? -1 : 1);
        startX = null;
      }, { passive: true });
    }

    if (vm) {
      $('#vm-close').addEventListener('click', closeFilm);
      vm.addEventListener('click', function (e) {
        if (e.target === vm || e.target.classList.contains('video-modal__stage')) closeFilm();
      });
    }

    document.addEventListener('keydown', function (e) {
      var lightboxOpen = lb && !lb.hidden;
      var filmOpen = vm && !vm.hidden;

      if (e.key === 'Escape') {
        if (lightboxOpen) closeLightbox();
        if (filmOpen) closeFilm();
        if (mobileMenu && !mobileMenu.hidden) setMenu(false);
      }

      if (lightboxOpen) {
        if (e.key === 'ArrowLeft') stepLightbox(-1);
        if (e.key === 'ArrowRight') stepLightbox(1);
      }

      if ((lightboxOpen || filmOpen) && e.key === 'Tab') {
        var dialog = lightboxOpen ? lb : vm;
        var focusables = $$('button, [href], iframe', dialog).filter(function (el) {
          return !el.disabled && el.offsetParent !== null;
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    if (burger) {
      burger.addEventListener('click', function () {
        setMenu(mobileMenu.hidden);
      });
    }

    if (mobileMenu) {
      $$('a', mobileMenu).forEach(function (a) {
        a.addEventListener('click', function () { setMenu(false); });
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080 && mobileMenu && !mobileMenu.hidden) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Запуск                                                             */
  /* ------------------------------------------------------------------ */
  function init() {
    renderFilters();
    renderGallery();
    renderFilms();
    initReveal();
    initCounters();
    initNavSpy();
    initCursorLabel();
    bind();
    onScroll();

    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    if (slides.length > 1 && !reduceMotion) {
      setInterval(nextSlide, 7000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
