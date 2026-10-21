/* Google Consent Mode v2: todo denegado hasta que el usuario acepte. Debe cargarse en el <head>, antes de cualquier script de Google. */
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('consent', 'default', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied', wait_for_update:500});
gtag('set', 'ads_data_redaction', true);
