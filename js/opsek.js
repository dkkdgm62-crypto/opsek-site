/* OpSek V15. Nur Darstellung: kein Netzwerk, keine Cookies, kein Tracking.
   localStorage nur für das einmalige Ausblenden des Hinweises.
   Texte kommen aus dem JSON-Block #opsek-t in jeder Sprachseite. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, T = {};
  try { T = JSON.parse(d.getElementById('opsek-t').textContent) || {}; } catch (e) { T = {}; }
  root.classList.remove('no-js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var HEX = '0123456789abcdef';
  function rnd(n, set) { set = set || HEX; var o = ''; for (var i = 0; i < n; i++) o += set[(Math.random() * set.length) | 0]; return o; }

  /* ---------- Hinweis: einmal, bis bestätigt oder weggeklickt ---------- */
  (function consent() {
    var el = d.getElementById('hinweis'); if (!el) return;
    var seen = false; try { seen = localStorage.getItem('opsek-hinweis') === '1'; } catch (e) {}
    if (seen) return;
    el.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('go'); }); });
    function close() {
      el.classList.remove('go'); setTimeout(function () { el.hidden = true; }, 480);
      try { localStorage.setItem('opsek-hinweis', '1'); } catch (e) {}
    }
    $('[data-consent-ok]', el).addEventListener('click', close);
  })();

  /* ---------- Hero: Wörter aus der Unschärfe ---------- */
  (function hero() {
    var hero = $('.hero'), h1 = hero && $('[data-split]', hero); if (!h1) return;
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    var i = 0;
    function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(' ')); return; }
            var s = d.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i++); s.textContent = t; frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) { wrap(c); }
      });
    }
    wrap(h1);
    requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('ready'); }); });
  })();

  /* ---------- Geräte-Kennung und Lokalzeit Bern ---------- */
  (function ids() {
    var hx = $$('[data-hex]');
    hx.forEach(function (h) { h.textContent = rnd(+h.getAttribute('data-hex')).toUpperCase(); });
    var hxOn = true;
    if (hx.length && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { hxOn = es[0].isIntersecting; }).observe(hx[0].closest('figure') || hx[0]);
    if (!reduce && hx.length) setInterval(function () { if (!hxOn || d.hidden) return; hx.forEach(function (h) { var t = h.textContent.split(''); t[(Math.random() * t.length) | 0] = HEX[(Math.random() * 16) | 0].toUpperCase(); h.textContent = t.join(''); }); }, 160);
    var c = $('[data-clock]'); if (!c) return;
    function tick() { try { c.textContent = new Date().toLocaleTimeString(T.locale || 'de-CH', { timeZone: 'Europe/Zurich', hour12: false }); } catch (e) { c.textContent = new Date().toTimeString().slice(0, 8); } }
    tick(); setInterval(tick, 1000);
  })();

  /* ---------- Kopfzeile: Fortschritt, Nach-oben, aktiver Menüpunkt ---------- */
  var hdr = $('.hdr'), totop = $('.totop');
  var navLinks = $$('.nav a'), navTargets = navLinks.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
  function onScroll() {
    var y = window.scrollY, max = root.scrollHeight - window.innerHeight;
    hdr.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    $('.progress em').style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    totop.classList.toggle('show', y > window.innerHeight * 0.9);
    var cur = -1; navTargets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }
  totop.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); onScroll();

  /* ---------- Hero: Sicherheits-Stapel ----------
     Grosser Bildschirm: der Hero bleibt stehen, Scrollen führt durch die sieben Schritte.
     Handy und Tablet: Schritte wechseln von selbst, antippen geht jederzeit. */
  (function secureStack() {
    var fig = $('[data-sx]'); if (!fig) return;
    var hero = fig.closest('.hero'), stack = $('[data-sx-stack]', fig);
    var slabs = $$('.sx-slab', fig), cards = $$('.sx-c', fig), dots = $$('.sx-dot', fig), card = $('.sx-card', fig);
    var hint = $('.sx-hint', fig), line = $('[data-sx-line]', fig), ldot = $('[data-sx-dot]', fig);
    var N = slabs.length, cur = -1, pin = false, inView = true, auto = 0, pauseUntil = 0, scr = [];
    var mq = window.matchMedia ? window.matchMedia('(min-width: 1200px) and (min-height: 640px)') : null;

    /* Zeichensalat, der sich zum Klartext auflöst (Signatur, Nachricht) */
    function scramble(el) {
      var target = el.getAttribute('data-sx-scr'), t0 = 0, id = 0;
      function frame(now) {
        if (!t0) t0 = now;
        var k = (now - t0) / 1300, n = Math.floor(clamp(k, 0, 1) * target.length), out = '';
        for (var i = 0; i < target.length; i++) out += i < n || target[i] === ' ' ? target[i] : rnd(1, 'ABCDEF0123456789#%&').toUpperCase();
        el.textContent = out;
        if (k < 1) id = requestAnimationFrame(frame);
        else id = setTimeout(function () { t0 = 0; id = requestAnimationFrame(frame); }, 2300);
      }
      id = requestAnimationFrame(frame);
      return function () { cancelAnimationFrame(id); clearTimeout(id); el.textContent = target; };
    }

    function drawLine() {
      if (!line || cur < 0 || !pin && window.innerWidth < 1200) return;
      var f = fig.getBoundingClientRect(), s = slabs[cur].getBoundingClientRect(), c = card.getBoundingClientRect();
      var x1 = s.right - s.width * 0.12 - f.left, y1 = s.top + s.height * 0.5 - f.top;
      var x2 = c.left - f.left, y2 = clamp(y1, c.top - f.top + 30, c.bottom - f.top - 30);
      var mx = x1 + (x2 - x1) * 0.55;
      line.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + mx.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + mx.toFixed(1) + ' ' + y2.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1));
      ldot.setAttribute('cx', x1.toFixed(1)); ldot.setAttribute('cy', y1.toFixed(1));
    }
    function follow(ms) {
      var end = performance.now() + ms;
      (function f(now) { drawLine(); if (now < end) requestAnimationFrame(f); })(performance.now());
    }

    function set(i) {
      i = clamp(i, 0, N - 1); if (i === cur) return; cur = i;
      fig.setAttribute('data-step', i);
      slabs.forEach(function (s, k) { s.classList.toggle('on', k === i); s.classList.toggle('below', k < i); s.classList.toggle('above', k > i); });
      cards.forEach(function (c, k) { c.hidden = k !== i; });
      dots.forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      scr.forEach(function (stop) { stop(); }); scr = [];
      if (!reduce) $$('[data-sx-scr]', cards[i]).forEach(function (el) { scr.push(scramble(el)); });
      follow(900);
    }

    function fromScroll() {
      if (!pin) return;
      var r = hero.getBoundingClientRect(), span = hero.offsetHeight - window.innerHeight;
      var p = clamp(-r.top / (span || 1), 0, 1);
      set(Math.min(N - 1, Math.floor(p * N)));
      if (stack && fine) stack.style.setProperty('--rz', (-38 + p * 16).toFixed(2) + 'deg');
    }
    function mode() {
      pin = !!(mq && mq.matches) && !reduce;
      if (hero) hero.classList.toggle('sx-pin', pin);
      if (hint) hint.textContent = hint.getAttribute(pin ? 'data-pin' : 'data-tap');
      if (pin) fromScroll();
      follow(300);
    }

    dots.forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-s');
        if (pin) {
          var span = hero.offsetHeight - window.innerHeight;
          window.scrollTo({ top: hero.offsetTop + (i + 0.5) / N * span, behavior: reduce ? 'auto' : 'smooth' });
        } else { set(i); pauseUntil = Date.now() + 15000; }
      });
      b.addEventListener('keydown', function (e) {
        var k = dots.indexOf(b), n = null;
        if (e.key === 'ArrowRight') n = dots[(k + 1) % N]; if (e.key === 'ArrowLeft') n = dots[(k + N - 1) % N];
        if (n) { e.preventDefault(); n.focus(); n.click(); }
      });
    });

    /* Automatisch weiter, nur wenn sichtbar, nicht fixiert und keine reduzierte Bewegung */
    if (!reduce) auto = setInterval(function () {
      if (pin || !inView || d.hidden || Date.now() < pauseUntil) return;
      set((cur + 1) % N);
    }, 4200);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.35 }).observe(fig);

    var tick = false;
    window.addEventListener('scroll', function () { if (pin && !tick) { tick = true; requestAnimationFrame(function () { tick = false; fromScroll(); }); } }, { passive: true });
    window.addEventListener('resize', function () { mode(); follow(200); });
    if (mq && mq.addEventListener) mq.addEventListener('change', mode);
    set(0); mode();
    if (fine && !reduce && stack) fig.addEventListener('mousemove', function (e) {
      var r = fig.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width - 0.5, my = (e.clientY - r.top) / r.height - 0.5;
      stack.style.setProperty('--rx', (58 - my * 6).toFixed(2) + 'deg');
      if (!pin) stack.style.setProperty('--rz', (-38 + mx * 10).toFixed(2) + 'deg');
      follow(120);
    });
  })();

  /* ---------- Erscheinen und Titel-Entschlüsselung ---------- */
  var GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/=+<>';
  function decrypt(el) {
    var text = el.getAttribute('data-text'); var t0 = performance.now(), dur = 900;
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1), n = Math.floor(p * text.length), out = '';
      for (var i = 0; i < text.length; i++) { var ch = text[i]; out += (i < n || ch === ' ' || ch === '.' || ch === ',') ? ch : GLY[(Math.random() * GLY.length) | 0]; }
      el.textContent = out; if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    })(t0);
  }
  var heads = $$('[data-decrypt]');
  heads.forEach(function (h) { h.setAttribute('data-text', h.textContent); h.setAttribute('aria-label', h.textContent); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target.hasAttribute('data-decrypt')) decrypt(e.target); else e.target.classList.add('in');
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    heads.forEach(function (h) { io.observe(h); });
    $$('.rv').forEach(function (r) { io.observe(r); });
  } else { $$('.rv').forEach(function (r) { r.classList.add('in'); }); }

  /* ---------- Schlüssel-Linse: drei Blickwinkel ---------- */
  (function vault() {
    var lp = $('[data-lamp]'), box = lp && $('[data-cipher]', lp); if (!lp) return;
    var bs = $$('.persp [data-v]'), lh = $('[data-lh]', lp), hint = $('[data-hint]', lp), lk = $('[data-lenskey]', lp);
    var view = 'du', key = rnd(4).toUpperCase() + '·' + rnd(4).toUpperCase();
    var TXT = T.vault || {};
    function keyLabel(v) { return v === 'du' ? (T.keyWord || '') + key : (v === 'anbieter' ? (T.noKey || '') : ''); }
    function fill() { box.textContent = rnd(Math.ceil((lp.clientWidth * lp.clientHeight) / 68)); }
    fill(); window.addEventListener('resize', fill);
    function burst() { if (reduce) { fill(); return; } var n = 0; (function f() { fill(); if (++n < 8) setTimeout(f, 40); })(); }
    function set(v) {
      view = v; lp.setAttribute('data-view', v);
      bs.forEach(function (b) { var on = b.getAttribute('data-v') === v; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      lh.textContent = TXT[v].st; lk.textContent = keyLabel(v); hint.innerHTML = TXT[v].hint; burst();
    }
    bs.forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-v')); });
      b.addEventListener('keydown', function (e) {
        var i = bs.indexOf(b), n = null;
        if (e.key === 'ArrowRight') n = bs[(i + 1) % bs.length]; if (e.key === 'ArrowLeft') n = bs[(i + bs.length - 1) % bs.length];
        if (n) { e.preventDefault(); n.focus(); set(n.getAttribute('data-v')); }
      });
    });
    set('du');
    /* Zeichen arbeiten, solange die Linse sichtbar ist */
    if (!reduce) setInterval(function () {
      var r = lp.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
      var t = box.textContent.split(''); for (var k = 0; k < 30; k++) t[(Math.random() * t.length) | 0] = HEX[(Math.random() * 16) | 0]; box.textContent = t.join('');
      if (view === 'du') { var kk = key.split(''); var j = (Math.random() * kk.length) | 0; if (kk[j] !== '·') kk[j] = HEX[(Math.random() * 16) | 0].toUpperCase(); key = kk.join(''); lk.textContent = keyLabel('du'); }
    }, 110);
    /* Linse folgt weich; ruht in der Mitte, wenn die Maus draussen ist */
    var tx = 0.5, ty = 0.47, cx = tx, cy = ty, raf = 0, touched = false;
    function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      lp.style.setProperty('--mx', (cx * 100).toFixed(2) + '%'); lp.style.setProperty('--my', (cy * 100).toFixed(2) + '%');
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0008) ? requestAnimationFrame(loop) : 0;
    }
    function aim(x, y) { var r = lp.getBoundingClientRect(); tx = clamp((x - r.left) / r.width, 0.06, 0.94); ty = clamp((y - r.top) / r.height, 0.12, 0.86); if (reduce) { cx = tx; cy = ty; } if (!raf) raf = requestAnimationFrame(loop); }
    lp.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') { lp.classList.add('active'); aim(e.clientX, e.clientY); }
      else if (e.buttons) { touched = true; aim(e.clientX, e.clientY); }
    });
    lp.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { lp.classList.remove('active'); tx = 0.5; ty = 0.47; if (!raf) raf = requestAnimationFrame(loop); } });
    lp.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { touched = true; aim(e.clientX, e.clientY); } });
    loop();
    /* Touch: Die Linse wandert von selbst ein Stück hin und her, bis der Finger sie übernimmt.
       So ist die Nachricht sofort zu sehen, auch ohne Maus. */
    if (!fine && !reduce) {
      var t0 = performance.now();
      (function sweep(now) {
        if (touched) return;
        var r = lp.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight && view !== 'gesperrt') {
          var t = (now - t0) / 1000;
          tx = 0.5 + Math.sin(t * 0.9) * 0.1; ty = 0.47 + Math.sin(t * 1.3 + 1) * 0.05;
          if (!raf) raf = requestAnimationFrame(loop);
        }
        requestAnimationFrame(sweep);
      })(t0);
    }
  })();

  /* ---------- Schichten: Stapel öffnet sich, aktive Schicht hebt sich ---------- */
  (function layers() {
    var sec = $('#schichten'), stack = $('[data-stack]'), stage = $('.stage'); if (!sec || !stack) return;
    var plates = $$('.plate', stack), arts = $$('.layer', sec);
    var capN = $('[data-layer-n]'), capT = $('[data-layer-t]');
    var lnav = $('[data-lnav]'), chips = lnav ? $$('a[data-ln]', lnav) : [], scene = $('[data-scene]');
    /* Szene passt sich der Bühne an: gleiche Proportionen auf Handy, Tablet und Desktop */
    var FIT_W = 600, FIT_H = 640, SHIFT = 74, CAP = 46;
    function fit() {
      var RAIL = lnav ? 44 : 0;
      var s = Math.min((stage.clientWidth - RAIL) / FIT_W, (stage.clientHeight - CAP) / FIT_H, 1);
      scene.style.setProperty('--sc', s.toFixed(3));
      scene.style.marginLeft = RAIL + 'px';
      scene.style.setProperty('--oy', (SHIFT * s - CAP / 2 + 6).toFixed(1) + 'px');
    }
    fit(); window.addEventListener('resize', fit);
    /* Platten im DOM von unten (01, Chip) nach oben (07). Über der aktiven Schicht: noch nicht gebaut. */
    var cur = -1;
    function setActive(i) {
      if (i === cur) return; cur = i;
      plates.forEach(function (p, k) { p.classList.toggle('on', k === i); p.classList.toggle('ahead', i >= 0 && k > i); p.classList.toggle('below', i >= 0 && k < i); });
      arts.forEach(function (a, k) { a.classList.toggle('on', k === i); });
      stack.classList.toggle('has-on', i >= 0);
      var n = i >= 0 ? ('0' + (i + 1)).slice(-2) : '00';
      if (lnav) lnav.classList.toggle('live', i >= 0);
      chips.forEach(function (a, k) { a.classList.toggle('on', k === i); a.classList.toggle('done', i >= 0 && k < i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      if (i >= 0) { capN.textContent = n + ' / 07'; capT.textContent = $('h3', arts[i]).textContent; }
    }
    if (!('IntersectionObserver' in window)) { stack.style.setProperty('--gap', '34px'); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(arts.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    arts.forEach(function (a) { io.observe(a); });
    if (reduce) { stack.style.setProperty('--gap', '34px'); return; }
    var mx = 0, my = 0, ticking = false;
    function frame() {
      ticking = false;
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh * 0.6 - r.top) / (r.height - vh * 0.4), 0, 1);
      var open = clamp(p * 6, 0, 1) * (1 - clamp((p - 0.94) * 16, 0, 1) * 0.6);
      stack.style.setProperty('--gap', (14 + open * 38).toFixed(1) + 'px');
      stack.style.setProperty('--rz', (-38 + p * 26 + mx * 6).toFixed(2) + 'deg');
      stack.style.setProperty('--rx', (58 - my * 5).toFixed(2) + 'deg');
      if (r.top > vh * 0.75 || r.bottom < vh * 0.25) setActive(-1);
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); frame();
    if (fine) stage.addEventListener('mousemove', function (e) { var r = stage.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; req(); });
  })();

  /* ---------- Profile ausprobieren ---------- */
  (function profiles() {
    var box = $('[data-prof]'); if (!box) return;
    var bs = $$('button', box), st = $('.prof-st', box);
    bs.forEach(function (b) { b.addEventListener('click', function () {
      bs.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      st.textContent = (T.profState || '{p}').replace('{p}', b.getAttribute('data-p'));
    }); });
  })();

  /* ---------- Base und Gold ---------- */
  (function tier() {
    var t = $('[data-tier]'); if (!t) return;
    var bs = $$('[data-set]', t), cta = $('[data-tier-cta]', t), fb = $('[data-for-base]', t), fg = $('[data-for-gold]', t);
    function set(v) {
      t.setAttribute('data-tier', v);
      bs.forEach(function (b) { var on = b.getAttribute('data-set') === v; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      fb.hidden = v !== 'base'; fg.hidden = v !== 'gold';
      cta.textContent = v === 'gold' ? T.ctaGold : T.ctaBase;
      cta.setAttribute('data-contact', v);
    }
    bs.forEach(function (b) { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; });
    bs.forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-set')); });
      b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = bs[(bs.indexOf(b) + 1) % 2]; n.focus(); set(n.getAttribute('data-set')); } });
    });
  })();

  /* ---------- Ablauf: Linie füllt sich ---------- */
  (function steps() {
    var ol = $('[data-steps]'); if (!ol) return;
    var li = $$('li', ol);
    function frame() {
      var r = ol.getBoundingClientRect(), vh = window.innerHeight;
      var p = reduce ? 1 : clamp((vh * 0.75 - r.top) / (r.height + vh * 0.2), 0, 1);
      ol.style.setProperty('--sp', p.toFixed(3));
      li.forEach(function (l, i) { l.classList.toggle('done', p >= (i + 0.2) / li.length); });
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(frame); }, { passive: true }); frame();
  })();


  /* ---------- Was du bekommst: Liste folgt dem Scrollen (Desktop) ---------- */
  (function getList() {
    var items = $$('[data-get]'); if (!items.length) return;
    var mq = window.matchMedia('(min-width: 980px)');
    function f() {
      if (!mq.matches) { items.forEach(function (it) { it.classList.remove('on'); }); return; }
      var vc = window.innerHeight * 0.5, best = -1, bd = 1e9;
      items.forEach(function (it, k) { var r = it.getBoundingClientRect(), dd = Math.abs(r.top + r.height / 2 - vc); if (dd < bd) { bd = dd; best = k; } });
      items.forEach(function (it, k) { it.classList.toggle('on', k === best); });
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(f); }, { passive: true });
    window.addEventListener('resize', f); f();
  })();

  /* ---------- Protokoll-Video ----------
     Lädt kurz vor dem Sichtbarwerden, spielt nur im Blick, kein Autoplay bei reduzierter Bewegung
     oder Datensparmodus. Die Schleife blendet am Ende aus und startet am Poster neu (kein harter Sprung).
     Der Rahmen kippt beim Hereinscrollen sanft in die Waagrechte. */
  (function protocol() {
    var fig = $('[data-protocol]'), v = fig && $('video', fig), btn = fig && $('[data-pr-toggle]', fig), dev = fig && $('.pr-device', fig); if (!v) return;
    var save = navigator.connection && navigator.connection.saveData, loaded = false, userPaused = false, auto = !reduce && !save, fading = false, raf = 0;
    function load() { if (loaded) return; loaded = true; v.preload = 'auto'; $$('source', v).forEach(function (s) { s.src = s.getAttribute('data-src'); }); v.load(); }
    function play() { load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function tickBar() {
      raf = 0;
      if (v.duration) {
        fig.style.setProperty('--pp', (v.currentTime / v.duration).toFixed(4));
        if (!fading && !v.paused && v.duration - v.currentTime < 0.5) restart();
      }
      if (!v.paused) raf = requestAnimationFrame(tickBar);
    }
    function restart() {
      fading = true; fig.classList.add('fade');
      setTimeout(function () {
        v.currentTime = 0; fig.style.setProperty('--pp', 0);
        if (!userPaused) play();
        setTimeout(function () { fig.classList.remove('fade'); fading = false; }, 120);
      }, 470);
    }
    v.addEventListener('ended', function () { if (!fading) restart(); });
    v.addEventListener('play', function () { fig.classList.add('playing'); btn.setAttribute('aria-label', T.pause); if (!raf) raf = requestAnimationFrame(tickBar); });
    v.addEventListener('pause', function () { fig.classList.remove('playing'); btn.setAttribute('aria-label', T.play); });
    btn.setAttribute('aria-label', T.play);
    btn.addEventListener('click', function () { if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); } });
    if (dev && !reduce) {
      var tf = false;
      function tilt() {
        tf = false;
        var r = dev.getBoundingClientRect(), vh = window.innerHeight;
        var p = clamp((vh - r.top) / (r.height * 0.95), 0, 1);
        dev.style.setProperty('--pv', (1 - Math.pow(1 - p, 3)).toFixed(3));
      }
      window.addEventListener('scroll', function () { if (!tf) { tf = true; requestAnimationFrame(tilt); } }, { passive: true });
      window.addEventListener('resize', tilt); tilt();
    }
    if (!('IntersectionObserver' in window)) { load(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) load(); }); }, { rootMargin: '900px 0px' }).observe(fig);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (auto && !userPaused) play(); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.35 }).observe(fig);
    d.addEventListener('visibilitychange', function () { if (d.hidden && !v.paused) v.pause(); });
  })();

  /* ---------- Karte: Netz mit Weiterleitungen, Pakete unterwegs nur als Zeichensalat ----------
     Knoten 0–3 sind die Beispielorte (Bern, Basel, Zürich, Genf), ab 4 Weiterleitungen.
     Pakete starten nur in Bern oder Genf. Lesbar sind sie nur am Start und am Ziel. */
  (function net() {
    var el = $('[data-net]'); if (!el) return;
    var nodes, routes, words;
    try { nodes = JSON.parse(el.getAttribute('data-nodes')); routes = JSON.parse(el.getAttribute('data-routes')); words = JSON.parse(el.getAttribute('data-words')); } catch (e) { return; }
    var g = $('[data-pk]', el), route = $('[data-net-route]', el), hex = $('[data-net-hex]', el);
    var NS = 'http://www.w3.org/2000/svg', relays = {}, names = {}, cities = {};
    $$('.rl', el).forEach(function (r) { relays[r.getAttribute('data-n')] = r; });
    $$('.net-n', el).forEach(function (li) { var c = li.getAttribute('data-c'); names[c] = $('span', li).textContent; cities[c] = li; });
    var live = false, inView = false, raf = 0, last = 0, nextSpawn = 0, pk = [];
    var SPEED = 0.16, PLAIN = 26, TRAIL = 60, MAX = 5;
    function mk(tag, cls) { var e = d.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); return e; }
    function scramble(n) { return rnd(n, '0123456789ABCDEF'); }
    function flash(elm, cls, ms) { elm.classList.remove(cls); void elm.getBoundingClientRect(); elm.classList.add(cls); setTimeout(function () { elm.classList.remove(cls); }, ms); }
    function spawn(now) {
      var r = routes[(Math.random() * routes.length) | 0], pts = r.map(function (i) { return nodes[i]; }), cum = [0];
      for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      var grp = mk('g', 'pk plain'), tr = mk('path', 'pk-tr'), c = mk('circle', 'pk-c'), tx = mk('text', 'pk-t');
      c.setAttribute('r', '3.4'); tx.setAttribute('dx', '7'); tx.setAttribute('dy', '-7');
      grp.appendChild(tr); grp.appendChild(c); grp.appendChild(tx); g.appendChild(grp);
      var w = words[(Math.random() * words.length) | 0];
      pk.push({ r: r, pts: pts, cum: cum, L: cum[cum.length - 1], t0: now, grp: grp, tr: tr, c: c, tx: tx, w: w, seg: 0, done: 0, tick: 0 });
      if (route) route.textContent = names[r[0]] + ' → ' + names[r[r.length - 1]];
      if (cities[r[0]]) flash(cities[r[0]], 'send', 900);
    }
    function at(p, dd) {
      dd = clamp(dd, 0, p.L);
      var i = 1; while (i < p.cum.length - 1 && p.cum[i] < dd) i++;
      var a = p.pts[i - 1], b = p.pts[i], f = (dd - p.cum[i - 1]) / ((p.cum[i] - p.cum[i - 1]) || 1);
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, i];
    }
    function trail(p, d0, d1) {
      var s = at(p, d0), e = at(p, d1), out = 'M' + s[0].toFixed(1) + ' ' + s[1].toFixed(1);
      for (var i = s[2]; i < e[2]; i++) out += 'L' + p.pts[i][0] + ' ' + p.pts[i][1];
      return out + 'L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1);
    }
    function step(now) {
      raf = 0; if (!live) return;
      if (now >= nextSpawn && pk.length < MAX) { spawn(now); nextSpawn = now + 700 + Math.random() * 900; }
      for (var k = pk.length - 1; k >= 0; k--) {
        var p = pk[k], dd = (now - p.t0) * SPEED;
        if (p.done) {
          if (now - p.done > 900) { g.removeChild(p.grp); pk.splice(k, 1); }
          else p.grp.style.opacity = String(1 - (now - p.done) / 900);
          continue;
        }
        var pos = at(p, dd);
        p.c.setAttribute('cx', pos[0].toFixed(1)); p.c.setAttribute('cy', pos[1].toFixed(1));
        p.tx.setAttribute('x', pos[0].toFixed(1)); p.tx.setAttribute('y', pos[1].toFixed(1));
        p.tr.setAttribute('d', trail(p, dd - TRAIL, dd));
        /* Weiterleitung erreicht: kurz aufleuchten */
        if (pos[2] - 1 > p.seg) { p.seg = pos[2] - 1; var rl = relays[p.r[p.seg]]; if (rl) flash(rl, 'hit', 260); }
        var plain = dd < PLAIN || dd > p.L - 1;
        if (plain !== p.grp.classList.contains('plain')) p.grp.classList.toggle('plain', plain);
        if (plain) p.tx.textContent = p.w;
        else if (now - p.tick > 70) { p.tick = now; var s = scramble(Math.max(4, p.w.length)); p.tx.textContent = s; if (hex) hex.textContent = s.slice(0, 4) + ' ' + scramble(4) + ' ' + scramble(4); }
        if (dd >= p.L) { p.done = now; var cz = cities[p.r[p.r.length - 1]]; if (cz) flash(cz, 'recv', 900); }
      }
      raf = requestAnimationFrame(step);
    }
    function on() { if (reduce || live) return; live = true; el.classList.add('live'); el.classList.remove('live-off'); nextSpawn = 0; raf = requestAnimationFrame(step); }
    function off() { live = false; el.classList.remove('live'); el.classList.add('live-off'); if (raf) cancelAnimationFrame(raf); raf = 0; pk.forEach(function (p) { if (p.grp.parentNode) g.removeChild(p.grp); }); pk = []; }
    if (!('IntersectionObserver' in window)) { el.classList.add('drawn'); on(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { inView = e.isIntersecting; if (inView) { el.classList.add('drawn'); on(); } else off(); });
    }, { threshold: 0.2 }).observe(el);
    d.addEventListener('visibilitychange', function () { if (d.hidden) off(); else if (inView) on(); });
  })();

  /* ---------- Vergleich: Filter, nur Unterschiede, Zählringe ---------- */
  (function compare() {
    var box = $('[data-cmp]'); if (!box) return;
    var rows = $$('.cmp-r', box), groups = $$('.cmp-g', box), chips = $$('.cmp-f', box), diff = $('[data-diff]', box);
    var cols = ['and', 'ios', 'gos'], cards = {}, f = 'all', seen = false, shown = {};
    $$('.cmp-sys', box).forEach(function (c) {
      cards[c.getAttribute('data-col')] = c;
      /* Ringe starten leer und füllen sich, sobald der Vergleich sichtbar wird */
      if (!reduce) { c.style.setProperty('--v', 0); $('[data-cnt]', c).textContent = '0'; $('[data-cnt-t]', c).textContent = '0'; }
    });
    function count(el, to) {
      var b = $('[data-cnt]', el), t = $('[data-cnt-t]', el), from = +(b.textContent) || 0;
      if (reduce) { b.textContent = to; t.textContent = to; return; }
      var t0 = performance.now();
      (function step(now) {
        var k = clamp((now - t0) / 900, 0, 1), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        b.textContent = v; t.textContent = v; if (k < 1) requestAnimationFrame(step);
      })(t0);
    }
    function apply() {
      var only = diff && diff.checked, vis = [], n = 0;
      rows.forEach(function (r) {
        var on = (f === 'all' || r.getAttribute('data-cat') === f) && (!only || r.getAttribute('data-diff') === 'true');
        var was = !r.hidden; r.hidden = !on;
        if (on) { vis.push(r); if (!was || !shown[r.rowIndex]) { r.classList.remove('fresh'); void r.offsetWidth; r.style.setProperty('--n', n++); r.classList.add('fresh'); } }
        shown[r.rowIndex] = on;
      });
      groups.forEach(function (g) { var c = g.getAttribute('data-cat'); g.hidden = !vis.some(function (r) { return r.getAttribute('data-cat') === c; }); });
      if (!seen) return;
      cols.forEach(function (c) {
        var yes = vis.filter(function (r) { return $('td.c-' + c, r).getAttribute('data-v') === 'y'; }).length;
        var card = cards[c]; if (!card) return;
        $('[data-tot]', card).textContent = vis.length;
        card.style.setProperty('--v', vis.length ? Math.round(yes / vis.length * 100) : 0);
        count(card, yes);
      });
    }
    chips.forEach(function (b) {
      b.addEventListener('click', function () {
        f = b.getAttribute('data-f');
        chips.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        apply();
      });
    });
    if (diff) diff.addEventListener('change', apply);
    function start() { if (seen) return; seen = true; apply(); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '0px 0px -25% 0px' }).observe(box);
    else start();
    apply();
  })();

  /* ---------- Kontakt-Dialog: Anleitung zuerst, Mail erst auf bewussten Klick ---------- */
  (function contact() {
    var dlg = $('[data-dialog]'); if (!dlg) return;
    var addr = dlg.getAttribute('data-addr');
    var steps = $$('.cd-step', dlg), n = steps.length, cur = 0;
    var back = $('[data-cd-back]', dlg), next = $('[data-cd-next]', dlg), stepEl = $('[data-cd-step]', dlg), ready = $('.cd-ready', dlg);
    var subj = $('[data-cd-subj]', dlg), msg = $('[data-cd-msg]', dlg), send = $('[data-cd-send]', dlg), copy = $('[data-cd-copy]', dlg);
    var opener = null;
    var canModal = typeof dlg.showModal === 'function';
    function show(i) {
      cur = clamp(i, 0, n - 1);
      steps.forEach(function (s, k) { s.hidden = k !== cur; });
      dlg.setAttribute('data-step', String(cur + 1));
      stepEl.textContent = (T.step || '{n}').replace('{n}', cur + 1);
      back.hidden = cur === 0; next.hidden = cur === n - 1;
      if (ready) ready.hidden = cur !== n - 1;
      var body = $('.cd-body', dlg); if (body) body.scrollTop = 0;
    }
    function open(kind, from) {
      if (dlg.open) return;
      opener = from || d.activeElement;
      var k = kind && T.subj && T.subj[kind] ? kind : 'general';
      if (subj) subj.value = k;
      show(0);
      root.classList.add('cd-lock');
      if (canModal) dlg.showModal(); else dlg.setAttribute('open', '');
      var h = $('#cd-title', dlg); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    function done() {
      root.classList.remove('cd-lock');
      if (opener && opener.focus) opener.focus({ preventScroll: true });
      opener = null;
    }
    function close() {
      if (canModal) dlg.close(); else { dlg.removeAttribute('open'); done(); }
    }
    dlg.addEventListener('close', done);
    /* Klick auf den Hintergrund schliesst bewusst NICHT. Nur Schliessen, Abbrechen oder Esc. */
    dlg.addEventListener('click', function (e) { e.stopPropagation(); });
    if (!canModal) dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    $$('[data-cd-close],[data-cd-cancel]', dlg).forEach(function (b) { b.addEventListener('click', close); });
    back.addEventListener('click', function () { show(cur - 1); });
    next.addEventListener('click', function () { show(cur + 1); });
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-contact]'); if (!t) return;
      e.preventDefault(); open(t.getAttribute('data-contact'), t);
    });
    send.addEventListener('click', function () {
      var k = subj ? subj.value : 'general';
      var s = (T.subj && T.subj[k]) || '';
      var url = 'mailto:' + addr + '?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(msg ? msg.value : '');
      window.location.href = url;
    });
    var copyLabel = copy.textContent, copyT = 0, code = $('.cd-addr code', dlg);
    function copied() { copy.textContent = copy.getAttribute('data-copied'); clearTimeout(copyT); copyT = setTimeout(function () { copy.textContent = copyLabel; }, 1800); }
    function selectAddr() {
      /* Ohne Zwischenablage: Adresse markieren, damit sie von Hand kopiert werden kann */
      try { var r = d.createRange(); r.selectNodeContents(code); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (e) {}
    }
    copy.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(copied, selectAddr);
      else selectAddr();
    });
    /* Direkt aufrufbar, z. B. opsek.ch/#schreiben */
    if (location.hash === '#schreiben') open('general');
  })();

  /* ---------- Magnetische Buttons ---------- */
  if (fine && !reduce) $$('[data-magnet]').forEach(function (b) {
    b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate3d(' + ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + 'px,0)'; });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });
})();
