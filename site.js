/* Funciones compartidas por todas las páginas: scroll inercial (Lenis), animaciones (AOS),
   cabecera fija, ajustes de cookies (CMP de Google) y acordeones de FAQ. */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Año del pie ---------- */
  if($('year')) $('year').textContent = new Date().getFullYear();

  /* ---------- Fechas de publicación: <time class="pub-date" datetime="AAAA-MM-DDTHH:MM"> se muestra como "21 de octubre de 2026 a las 14:30" ---------- */
  (function(){
    var M = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    document.querySelectorAll('time.pub-date[datetime]').forEach(function(t){
      var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(t.getAttribute('datetime'));
      if(!m) return;
      var s = parseInt(m[3], 10) + ' de ' + M[parseInt(m[2], 10) - 1] + ' de ' + m[1];
      if(m[4]) s += ' a las ' + m[4] + ':' + m[5];
      t.textContent = s;
    });
  })();

  /* ---------- Lenis (scroll con inercia). Se omite con "reducir movimiento" o si no carga ---------- */
  if(window.Lenis && !reduce){
    var lenis = new Lenis({duration:1.1, easing:function(t){ return Math.min(1, 1.001 - Math.pow(2, -10*t)); }, smoothWheel:true});
    window.__lenis = lenis;
    var raf = function(time){ lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- AOS (se re-ejecuta al subir y al bajar) ---------- */
  if(window.AOS && !reduce){
    AOS.init({duration:800, easing:'ease-out-cubic', once:false, mirror:true, offset:80});
    window.addEventListener('load', function(){ AOS.refresh(); });
  } else {
    /* Sin librería o con movimiento reducido: el contenido se muestra siempre */
    document.querySelectorAll('[data-aos]').forEach(function(e){ e.removeAttribute('data-aos'); });
  }

  /* ---------- Cabecera fija: menú móvil, scroll con offset y enlace activo ---------- */
  (function(){
    var hd = document.querySelector('.site-header'), nav = $('siteNav'), tg = $('navToggle');
    window.__navOffset = function(){ return (hd ? hd.offsetHeight : 0) + 12; };
    /* Posición real en el documento ignorando transforms (AOS desplaza las secciones 100px antes de animarlas) */
    function layoutTop(el){ var y = 0; while(el){ y += el.offsetTop; el = el.offsetParent; } return y; }
    window.__scrollToEl = function(el){
      var y = Math.max(0, layoutTop(el) - window.__navOffset());
      if(window.__lenis) window.__lenis.scrollTo(y); else window.scrollTo({top:y, behavior:'smooth'});
    };
    /* Enlaces a una sección de la misma página (#id). Los enlaces a otras páginas siguen su curso normal */
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if(!a) return;
      var id = a.getAttribute('href');
      if(id.length < 2) return;
      var el = document.querySelector(id);
      if(!el) return;
      e.preventDefault();
      window.__scrollToEl(el);
    });
    /* Al llegar desde otra página con #ancla (p. ej. blog.html#precio-por-km), bajar hasta la sección bajo la cabecera */
    window.addEventListener('load', function(){
      if(location.hash.length < 2) return;
      var t = null;
      try{ t = document.querySelector(location.hash); }catch(err){}
      if(t) setTimeout(function(){ window.__scrollToEl(t); }, 150);
    });
    if(!nav || !tg) return;
    function closeNav(){ nav.classList.remove('open'); tg.setAttribute('aria-expanded','false'); tg.setAttribute('aria-label','Abrir menú'); }
    tg.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      tg.setAttribute('aria-expanded', open ? 'true' : 'false'); tg.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    document.querySelectorAll('.site-header a').forEach(function(a){ a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeNav(); });
    /* Resaltado de la sección visible (solo enlaces #id de la propia página) */
    var links = {};
    document.querySelectorAll('.nav a').forEach(function(a){
      var h = a.getAttribute('href');
      if(h && h.charAt(0) === '#') links[h.slice(1)] = a;
    });
    var ids = Object.keys(links);
    if(ids.length && 'IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(!en.isIntersecting) return;
          Object.keys(links).forEach(function(k){ links[k].removeAttribute('aria-current'); });
          var a = links[en.target.id]; if(a) a.setAttribute('aria-current', 'true');
        });
      }, {rootMargin:'-35% 0px -60% 0px'});
      ids.forEach(function(id){ var el = $(id); if(el) io.observe(el); });
    }
  })();

  /* ---------- Configurar cookies: reabre el mensaje de consentimiento de Google (CMP) ---------- */
  (function(){
    var link = $('cookieSettings');
    if(!link) return;
    link.addEventListener('click', function(e){
      e.preventDefault();
      window.googlefc = window.googlefc || {};
      googlefc.callbackQueue = googlefc.callbackQueue || [];
      if(typeof googlefc.showRevocationMessage === 'function'){ googlefc.showRevocationMessage(); }
      else { googlefc.callbackQueue.push({'CONSENT_API_READY': function(){ googlefc.showRevocationMessage(); }}); }
    });
  })();

  /* ---------- Acordeón FAQ (accesible) ---------- */
  document.querySelectorAll('.acc').forEach(function(a, i){
    var b = a.querySelector('button'), p = a.querySelector('.panel');
    b.id = 'faq-b' + i; p.id = 'faq-p' + i;
    b.setAttribute('aria-controls', p.id); p.setAttribute('role', 'region'); p.setAttribute('aria-labelledby', b.id);
  });
  window.addEventListener('resize', function(){
    document.querySelectorAll('.acc button[aria-expanded=true]').forEach(function(b){ var p = b.nextElementSibling; p.style.maxHeight = p.scrollHeight + 'px'; });
  });
  document.querySelectorAll('.acc button').forEach(function(b){
    b.addEventListener('click', function(){
      var open = b.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.acc button').forEach(function(x){
        x.setAttribute('aria-expanded', 'false'); x.nextElementSibling.style.maxHeight = null;
      });
      if(!open){ b.setAttribute('aria-expanded', 'true'); b.nextElementSibling.style.maxHeight = b.nextElementSibling.scrollHeight + 'px'; }
    });
  });
})();
