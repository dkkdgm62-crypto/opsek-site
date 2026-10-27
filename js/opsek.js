/* OpSek V12. Nur Darstellung: kein Netzwerk, keine Cookies, kein Tracking.
   localStorage nur für das einmalige Ausblenden des Hinweises.
   Texte kommen aus window.OPSEK_T (steht in jeder Sprachseite). */
(function () {
  'use strict';
  var d = document, root = d.documentElement, T = window.OPSEK_T || {};
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
    if (!reduce) setInterval(function () { hx.forEach(function (h) { var t = h.textContent.split(''); t[(Math.random() * t.length) | 0] = HEX[(Math.random() * 16) | 0].toUpperCase(); h.textContent = t.join(''); }); }, 160);
    var c = $('[data-clock]'); if (!c) return;
    function tick() { try { c.textContent = new Date().toLocaleTimeString(T.locale || 'de-CH', { timeZone: 'Europe/Zurich', hour12: false }); } catch (e) { c.textContent = new Date().toTimeString().slice(0, 8); } }
    tick(); setInterval(tick, 1000);
  })();

  /* ---------- Kopfzeile: Fortschritt, Nach-oben, aktiver Menüpunkt ---------- */
  var hdr = $('.hdr'), totop = $('.totop'), heroEl = $('.hero'), heroFrame = $('.hv-frame');
  var navLinks = $$('.nav a'), navTargets = navLinks.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
  function onScroll() {
    var y = window.scrollY, max = root.scrollHeight - window.innerHeight;
    hdr.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    $('.progress em').style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    totop.classList.toggle('show', y > window.innerHeight * 0.9);
    if (heroFrame && !reduce) heroFrame.style.setProperty('--hp', clamp(y / (heroEl.offsetHeight || 1), 0, 1).toFixed(3));
    var cur = -1; navTargets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }
  totop.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); onScroll();

  /* ---------- Lupe über dem Hero-Bild ----------
     Zeigt eine echte, vergrösserte Kopie des Bildes (gleiches Zuschneiden, gleiche Maske), dadurch deckungsgleich.
     Gesteuert nur über Zeigerposition, nicht über enter/leave. */
  (function loupe() {
    var f = heroFrame, img = f && $('img', f), host = f && f.parentNode; if (!img || reduce || !fine) return;
    var l = d.createElement('div'); l.className = 'loupe'; l.setAttribute('aria-hidden', 'true');
    l.innerHTML = '<div class="lp-view"><div class="lp-inner"></div></div><i class="ring"></i><i class="ring2"></i><i class="cross"></i><span class="lp-tag">2×</span>';
    host.appendChild(l);
    var inner = $('.lp-inner', l), clone = img.cloneNode(false);
    clone.removeAttribute('srcset'); clone.removeAttribute('sizes'); clone.removeAttribute('fetchpriority');
    clone.src = img.src; clone.alt = ''; clone.loading = 'lazy';
    inner.appendChild(clone);
    var Z = 2, on = false, raf = 0, px = 0, py = 0;
    function render() {
      raf = 0;
      var fr = f.getBoundingClientRect(), hr = host.getBoundingClientRect();
      var x = px - fr.left, y = py - fr.top, inside = x >= 0 && y >= 0 && x <= fr.width && y <= fr.height;
      if (inside !== on) { on = inside; l.classList.toggle('on', on); f.classList.toggle('zoom', on); }
      if (!on) return;
      var R = l.offsetWidth / 2, m = R * 0.45; x = clamp(x, m, fr.width - m); y = clamp(y, m, fr.height - m);
      l.style.transform = 'translate3d(' + (fr.left - hr.left + x - R).toFixed(1) + 'px,' + (fr.top - hr.top + y - R).toFixed(1) + 'px,0)';
      inner.style.width = fr.width + 'px'; inner.style.height = fr.height + 'px';
      inner.style.setProperty('--hp', getComputedStyle(f).getPropertyValue('--hp') || 0);
      inner.style.transform = 'translate3d(' + (R - x * Z).toFixed(1) + 'px,' + (R - y * Z).toFixed(1) + 'px,0) scale(' + Z + ')';
    }
    function req(e) { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(render); }
    d.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') req(e); }, { passive: true });
    window.addEventListener('scroll', function () { if (on) { if (!raf) raf = requestAnimationFrame(render); } }, { passive: true });
    d.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { on = false; l.classList.remove('on'); f.classList.remove('zoom'); } });
    var scan = $('.hv-scan', f); if (scan) scan.style.setProperty('--h', f.offsetHeight + 'px');
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
      bs.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-v') === v ? 'true' : 'false'); });
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
    var plates = $$('.plate', stack), arts = $$('.layer', sec), depth = $('[data-depth]');
    var capN = $('[data-layer-n]'), capT = $('[data-layer-t]');
    var lnav = $('[data-lnav]'), chips = $$('a[data-ln]', lnav), depthT = $('[data-depth-t]'), scene = $('[data-scene]');
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
    /* Platten-Reihenfolge im DOM: oben (01) zuerst. */
    var cur = -1;
    function setActive(i) {
      if (i === cur) return; cur = i;
      plates.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      arts.forEach(function (a, k) { a.classList.toggle('on', k === i); });
      stack.classList.toggle('has-on', i >= 0);
      var n = i >= 0 ? ('0' + (i + 1)).slice(-2) : '00';
      if (depth) depth.textContent = n;
      lnav.classList.toggle('live', i >= 0);
      chips.forEach(function (a, k) { a.classList.toggle('on', k === i); a.classList.toggle('done', i >= 0 && k < i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      if (depthT) depthT.textContent = i >= 0 ? $('h3', arts[i]).textContent : '';
      if (i >= 0) { capN.textContent = n + ' / 07'; capT.textContent = $('h3', arts[i]).textContent; }
    }
    if (reduce || !('IntersectionObserver' in window)) { stack.style.setProperty('--gap', '34px'); setActive(0); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(arts.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    arts.forEach(function (a) { io.observe(a); });
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
      bs.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-set') === v ? 'true' : 'false'); });
      fb.hidden = v !== 'base'; fg.hidden = v !== 'gold';
      cta.textContent = v === 'gold' ? T.ctaGold : T.ctaBase;
      cta.setAttribute('data-contact', v);
    }
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

  /* ---------- Karte: verschlüsselte Wege zwischen Beispielorten ---------- */
  (function net() {
    var el = $('[data-net]'); if (!el) return;
    var route = $('[data-net-route]', el), hex = $('[data-net-hex]', el);
    var names = $$('.net-n span', el).map(function (n) { return n.textContent; });
    var pairs = [[2, 0], [2, 1], [2, 3], [3, 0], [3, 1]];
    var k = 0, timer = 0;
    function tick() {
      var p = pairs[k++ % pairs.length];
      if (route) route.textContent = names[p[0]] + ' \u2192 ' + names[p[1]];
      if (hex) hex.textContent = rnd(4).toUpperCase() + ' ' + rnd(4).toUpperCase() + ' ' + rnd(4).toUpperCase();
    }
    function on() { el.classList.add('live'); el.classList.remove('live-off'); if (!reduce && !timer) timer = setInterval(tick, 2600); }
    function off() { el.classList.remove('live'); el.classList.add('live-off'); clearInterval(timer); timer = 0; }
    /* Knoten im Markup: 0 Basel, 1 Zürich, 2 Bern, 3 Genf. Wege starten nur in Bern oder Genf. */
    if (!('IntersectionObserver' in window)) { el.classList.add('drawn'); if (!reduce) on(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { el.classList.add('drawn'); on(); } else off();
      });
    }, { threshold: 0.25 }).observe(el);
    d.addEventListener('visibilitychange', function () { if (d.hidden) off(); });
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
      if (ready) ready.style.visibility = cur === n - 1 ? 'visible' : 'hidden';
      var body = $('.cd-body', dlg); if (body) body.scrollTop = 0;
    }
    function open(kind) {
      opener = d.activeElement;
      var k = kind && T.subj && T.subj[kind] ? kind : 'general';
      if (subj) subj.value = k;
      show(0);
      root.classList.add('cd-lock');
      if (canModal) dlg.showModal(); else dlg.setAttribute('open', '');
      var h = $('#cd-title', dlg); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    function close() {
      if (canModal) dlg.close(); else dlg.removeAttribute('open');
    }
    dlg.addEventListener('close', function () {
      root.classList.remove('cd-lock');
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });
    /* Klick auf den Hintergrund schliesst bewusst NICHT. Nur Schliessen, Abbrechen oder Esc. */
    dlg.addEventListener('click', function (e) { e.stopPropagation(); });
    if (!canModal) dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    $$('[data-cd-close],[data-cd-cancel]', dlg).forEach(function (b) { b.addEventListener('click', close); });
    back.addEventListener('click', function () { show(cur - 1); });
    next.addEventListener('click', function () { show(cur + 1); });
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-contact]'); if (!t) return;
      e.preventDefault(); open(t.getAttribute('data-contact'));
    });
    send.addEventListener('click', function () {
      var k = subj ? subj.value : 'general';
      var s = (T.subj && T.subj[k]) || '';
      var url = 'mailto:' + addr + '?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(msg ? msg.value : '');
      window.location.href = url;
    });
    copy.addEventListener('click', function () {
      var old = copy.textContent, ok = function () { copy.textContent = copy.getAttribute('data-copied'); setTimeout(function () { copy.textContent = old; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(ok, function () {});
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
