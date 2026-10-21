/* Google Consent Mode v2: todo denegado hasta que el usuario decida en el mensaje de consentimiento de Google. Debe cargarse en el <head>, antes de cualquier script de Google. */
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('consent', 'default', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied', wait_for_update:500});
gtag('set', 'ads_data_redaction', true);
/* El script de AdSense carga el mensaje de consentimiento (CMP) de Google, que actualiza el Consent Mode según la elección del usuario */
(function(){
  var s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3215678200568191';
  document.head.appendChild(s);
})();
