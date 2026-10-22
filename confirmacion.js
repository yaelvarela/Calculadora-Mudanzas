/* Correo de confirmación al usuario cuando solicita un presupuesto.
   Usa EmailJS (plan gratuito: 200 correos al mes). Mientras CONFIG esté vacío no se envía nada
   y la web funciona exactamente igual que antes (el formulario sigue llegando a tu correo por Web3Forms).
   Pasos para activarlo: email/LEEME-EMAIL.md */
(function(){
  'use strict';

  var CONFIG = {
    serviceId: 'service_g1d4okl',    /* EmailJS > Email Services > Service ID */
    templateId: 'template_r77jywo',  /* EmailJS > Email Templates > Template ID */
    publicKey: 'KoK6MThSV5rZzsee1'   /* EmailJS > Account > General > Public Key (es pública por diseño) */
  };

  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function fechaLarga(iso){
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? parseInt(m[3], 10) + ' de ' + MESES[parseInt(m[2], 10) - 1] + ' de ' + m[1] : (iso || 'Por concretar');
  }
  /* "Origen: Madrid | Destino: Valencia | Vivienda: Piso 1-2 hab. | Distancia aprox.: 378 km | Extras: ninguno" -> objeto */
  function parseDetalles(s){
    var o = {};
    String(s || '').split(' | ').forEach(function(p){ var i = p.indexOf(': '); if(i > 0) o[p.slice(0, i)] = p.slice(i + 2); });
    return o;
  }

  /* data: {email, nombre, detalles, precio, fecha}. Devuelve una promesa con true (enviado) o false (no enviado). */
  window.sendConfirmationEmail = function(data){
    return new Promise(function(resolve){
      if(!CONFIG.serviceId || !CONFIG.templateId || !CONFIG.publicKey || !window.emailjs || !data || !data.email) return resolve(false);
      var d = parseDetalles(data.detalles);
      var params = {
        to_email: data.email,
        nombre: (data.nombre || '').trim().split(/\s+/)[0] || 'hola',
        ruta: (d.Origen && d.Destino) ? d.Origen + ' → ' + d.Destino : 'Por confirmar',
        vivienda: d.Vivienda || 'Por confirmar',
        extras: d.Extras || 'Ninguno',
        precio_estimado: data.precio || 'Por confirmar',
        fecha_mudanza: fechaLarga(data.fecha),
        site_url: location.origin,
        year: new Date().getFullYear()
      };
      try{
        emailjs.send(CONFIG.serviceId, CONFIG.templateId, params, {publicKey: CONFIG.publicKey})
          .then(function(){ resolve(true); }, function(err){
            /* Aviso en la consola del navegador (F12) para poder diagnosticar: p. ej. "The recipients address is empty" */
            if(window.console) console.warn('EmailJS no pudo enviar la confirmación:', (err && (err.text || err.message)) || err);
            resolve(false);
          });
      }catch(e){ resolve(false); }
    });
  };
})();
