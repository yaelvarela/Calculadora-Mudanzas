/* Newsletter: ventana emergente al entrar en la portada + formularios de suscripción.
   Los formularios (cualquier <form data-nl-form>) se envían con Web3Forms, igual que el de presupuesto:
   cada alta te llega por correo. Para usar un servicio de listas (Brevo, MailerLite, Mailchimp...),
   cambia el atributo action del formulario por la URL de alta que te dé el servicio. */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var KEY = 'nl_state_v1';          /* 'subscribed' o la fecha (ms) en que se cerró el aviso */
  var HIDE_DAYS = 30;               /* días que no vuelve a salir tras cerrarlo */
  var DELAY_MS = 4000;              /* segundos de espera tras entrar */

  function get(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function set(v){ try{ localStorage.setItem(KEY, String(v)); }catch(e){} }

  /* ---------- Formularios de suscripción ---------- */
  document.querySelectorAll('form[data-nl-form]').forEach(function(form){
    var msg = form.querySelector('[data-nl-msg]');
    var box = form.closest('[data-nl-box]') || form.parentNode;
    var ok = box.querySelector('[data-nl-ok]');
    var btn = form.querySelector('button[type=submit]');
    function say(text, cls){ if(msg){ msg.className = 'msg ' + cls; msg.textContent = text; } }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function(el){
        var v = el.checkValidity(); el.classList.toggle('invalid', !v); if(!v) valid = false;
      });
      if(!valid){ say('Escribe un correo válido y acepta recibir la newsletter.', 'err'); return; }
      var original = btn ? btn.textContent : '';
      if(btn){ btn.disabled = true; btn.textContent = 'Enviando...'; }
      fetch(form.action, {method:'POST', body:new FormData(form), headers:{'Accept':'application/json'}})
        .then(function(r){ return r.json().then(function(j){ return r.ok && j.success !== false; }); })
        .then(function(done){
          if(!done) throw new Error();
          set('subscribed');
          form.hidden = true;
          if(ok) ok.hidden = false;
          document.querySelectorAll('[data-nl-later]').forEach(function(b){ b.hidden = true; });
          if(box.closest('#nlPop')) setTimeout(closePop, 4000);
        })
        .catch(function(){ say('No se pudo completar la suscripción. Inténtalo de nuevo en unos minutos.', 'err'); })
        .finally(function(){ if(btn){ btn.disabled = false; btn.textContent = original; } });
    });
    form.querySelectorAll('input').forEach(function(el){
      el.addEventListener('input', function(){ if(el.classList.contains('invalid') && el.checkValidity()) el.classList.remove('invalid'); });
    });
  });

  /* ---------- Ventana emergente ---------- */
  var pop = $('nlPop');
  if(!pop) return;
  var panel = pop.querySelector('.nl-box'), lastFocus = null, timer = null;

  function focusables(){
    return [].slice.call(panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      .filter(function(el){ return el.offsetParent !== null; });
  }
  function openPop(){
    if(!pop.hidden) return;
    lastFocus = document.activeElement;
    pop.hidden = false;
    document.body.classList.add('nl-open');
    if(window.__lenis) window.__lenis.stop();
    requestAnimationFrame(function(){ pop.classList.add('show'); });
    var first = $('nlEmail'); (first || panel).focus({preventScroll:true});
  }
  function closePop(){
    if(pop.hidden) return;
    pop.classList.remove('show');
    document.body.classList.remove('nl-open');
    if(window.__lenis) window.__lenis.start();
    setTimeout(function(){ pop.hidden = true; }, 220);
    if(get() !== 'subscribed') set(Date.now());
    if(lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
  }
  function dismissed(){
    var v = get();
    if(v === 'subscribed') return true;
    var t = parseInt(v, 10);
    return !isNaN(t) && (Date.now() - t) < HIDE_DAYS * 86400000;
  }

  $('nlClose').addEventListener('click', closePop);
  var later = $('nlLater'); if(later) later.addEventListener('click', closePop);
  pop.addEventListener('click', function(e){ if(e.target === pop) closePop(); });
  document.addEventListener('keydown', function(e){
    if(pop.hidden) return;
    if(e.key === 'Escape'){ closePop(); return; }
    if(e.key === 'Tab'){
      var f = focusables(); if(!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if(e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); }
      else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
    }
  });

  /* Mientras el mensaje de consentimiento de Google (CMP) esté en pantalla no se abre la ventana: iría detrás de él
     y el usuario no la vería. Se espera a que desaparezca (máx. 2 min) y se abre unos instantes después. */
  function cmpVisible(){
    var el = document.querySelector('.fc-consent-root, .fc-dialog-container, .fc-choice-dialog');
    /* getClientRects: offsetParent es null en elementos con position:fixed, como el de Google */
    return !!(el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
  }
  function showWhenFree(){
    var tries = 0;
    (function check(){
      if(document.hidden){
        document.addEventListener('visibilitychange', function once(){ if(!document.hidden){ document.removeEventListener('visibilitychange', once); check(); } });
        return;
      }
      if(cmpVisible() && tries++ < 240){ setTimeout(check, 500); return; }
      setTimeout(openPop, tries ? 1500 : 0);
    })();
  }

  /* Enlace del correo de confirmación (?newsletter=1): se abre siempre, aunque se hubiera cerrado antes */
  var forced = /[?&]newsletter=1(&|$)/.test(location.search) && get() !== 'subscribed';
  if(forced){ timer = setTimeout(showWhenFree, 600); return; }
  if(dismissed()) return;
  /* Entrada normal: pequeña espera tras cargar la página */
  timer = setTimeout(showWhenFree, DELAY_MS);
})();
