/* OpSek V11. Nur Darstellung: kein Netzwerk, keine Cookies, kein Tracking.
   localStorage nur für das einmalige Ausblenden des Hinweises. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
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
    function close(remember) {
      el.classList.remove('go'); setTimeout(function () { el.hidden = true; }, 480);
      if (remember) { try { localStorage.setItem('opsek-hinweis', '1'); } catch (e) {} }
      d.removeEventListener('click', away, true); window.removeEventListener('scroll', awayS);
    }
    $('[data-consent-ok]', el).addEventListener('click', function () { close(true); });
    function away(e) { if (!el.contains(e.target)) close(false); }
    var n = 0; function awayS() { if (++n > 3) close(false); }
    setTimeout(function () { d.addEventListener('click', away, true); window.addEventListener('scroll', awayS, { passive: true }); }, 500);
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
    function tick() { try { c.textContent = new Date().toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour12: false }); } catch (e) { c.textContent = new Date().toTimeString().slice(0, 8); } }
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
    var TXT = {
      du: { st: 'unter der Linse lesbar', key: function () { return 'Schlüssel ' + key; }, hint: '<span class="hint-fine">Fahr mit der Maus darüber.</span><span class="hint-touch">Tipp auf eine Stelle.</span> Unter der Linse liegt dein Schlüssel. Nur damit wird die Nachricht lesbar.' },
      anbieter: { st: 'kein Schlüssel', key: function () { return 'Kein Schlüssel'; }, hint: 'So sieht es der Anbieter des Messengers: Er transportiert die Nachricht, lesen kann er sie nicht.' },
      gesperrt: { st: 'Ruhezustand', key: function () { return ''; }, hint: 'Nach einem Neustart ist der Schlüssel nicht im Speicher. Ohne deine PIN bleibt alles verschlüsselt.' }
    };
    function fill() { box.textContent = rnd(Math.ceil((lp.clientWidth * lp.clientHeight) / 68)); }
    fill(); window.addEventListener('resize', fill);
    function burst() { if (reduce) { fill(); return; } var n = 0; (function f() { fill(); if (++n < 8) setTimeout(f, 40); })(); }
    function set(v) {
      view = v; lp.setAttribute('data-view', v);
      bs.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-v') === v ? 'true' : 'false'); });
      lh.textContent = TXT[v].st; lk.textContent = TXT[v].key(); hint.innerHTML = TXT[v].hint; burst();
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
      if (view === 'du') { var kk = key.split(''); var j = (Math.random() * kk.length) | 0; if (kk[j] !== '·') kk[j] = HEX[(Math.random() * 16) | 0].toUpperCase(); key = kk.join(''); lk.textContent = TXT.du.key(); }
    }, 110);
    /* Linse folgt weich; ruht in der Mitte, wenn die Maus draussen ist */
    var tx = 0.5, ty = 0.55, cx = tx, cy = ty, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      lp.style.setProperty('--mx', (cx * 100).toFixed(2) + '%'); lp.style.setProperty('--my', (cy * 100).toFixed(2) + '%');
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0008) ? requestAnimationFrame(loop) : 0;
    }
    function aim(x, y) { var r = lp.getBoundingClientRect(); tx = clamp((x - r.left) / r.width, 0.06, 0.94); ty = clamp((y - r.top) / r.height, 0.12, 0.86); if (reduce) { cx = tx; cy = ty; } if (!raf) raf = requestAnimationFrame(loop); }
    lp.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { lp.classList.add('active'); aim(e.clientX, e.clientY); } });
    lp.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { lp.classList.remove('active'); tx = 0.5; ty = 0.55; if (!raf) raf = requestAnimationFrame(loop); } });
    lp.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') aim(e.clientX, e.clientY); });
    loop();
  })();

  /* ---------- Schichten: Stapel öffnet sich, aktive Schicht hebt sich ---------- */
  (function layers() {
    var sec = $('#schichten'), stack = $('[data-stack]'), stage = $('.stage'); if (!sec || !stack) return;
    var plates = $$('.plate', stack), arts = $$('.layer', sec), depth = $('[data-depth]'), depthBox = $('.depth');
    var capN = $('[data-layer-n]'), capT = $('[data-layer-t]');
    /* Platten-Reihenfolge im DOM: oben (01) zuerst. */
    var cur = -1;
    function setActive(i) {
      if (i === cur) return; cur = i;
      plates.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      arts.forEach(function (a, k) { a.classList.toggle('on', k === i); });
      stack.classList.toggle('has-on', i >= 0);
      var n = i >= 0 ? ('0' + (i + 1)).slice(-2) : '00';
      if (depth) depth.textContent = n;
      if (depthBox) depthBox.classList.toggle('live', i >= 0);
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
      st.textContent = b.getAttribute('data-p') + ' aktiv · andere Profile beendet, ihre Schlüssel aus dem Speicher';
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
      cta.textContent = v === 'gold' ? 'Gold anfragen' : 'Base anfragen';
      cta.href = cta.href.replace(/subject=[^&]*/, 'subject=' + encodeURIComponent('Interesse an OpSek ' + (v === 'gold' ? 'Gold' : 'Base')));
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


  /* ---------- Protokoll-Video: lädt erst bei Sichtbarkeit, spielt nur im Blick ----------
     Kein Autoplay bei reduzierter Bewegung oder Datensparmodus; dann Startknopf. */
  (function protocol() {
    var fig = $('[data-protocol]'), v = fig && $('video', fig), btn = fig && $('[data-pr-toggle]', fig); if (!v) return;
    var save = navigator.connection && navigator.connection.saveData, loaded = false, userPaused = false, auto = !reduce && !save;
    function load() { if (loaded) return; loaded = true; $$('source', v).forEach(function (s) { s.src = s.getAttribute('data-src'); }); v.load(); }
    function play() { load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    v.addEventListener('play', function () { fig.classList.add('playing'); btn.setAttribute('aria-label', 'Video anhalten'); });
    v.addEventListener('pause', function () { fig.classList.remove('playing'); btn.setAttribute('aria-label', 'Video abspielen'); });
    btn.setAttribute('aria-label', 'Video abspielen');
    btn.addEventListener('click', function () { if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); } });
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (auto && !userPaused) play(); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.35 }).observe(fig);
    d.addEventListener('visibilitychange', function () { if (d.hidden && !v.paused) v.pause(); });
  })();

  /* ---------- Magnetische Buttons ---------- */
  if (fine && !reduce) $$('[data-magnet]').forEach(function (b) {
    b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate3d(' + ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + 'px,0)'; });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });
})();
