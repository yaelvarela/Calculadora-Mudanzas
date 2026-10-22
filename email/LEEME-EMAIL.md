# Correo de confirmación

## Qué hace
Cuando alguien envía el formulario de presupuesto, recibe un correo con el resumen de su solicitud, los pasos siguientes y el aviso de que la cifra es orientativa.

## Archivos
| Archivo | Para qué |
|---|---|
| `email/plantilla-confirmacion.html` | HTML del correo, con variables `{{nombre}}`, `{{ruta}}`... Es lo que se pega en EmailJS |
| `email/vista-previa-confirmacion.html` | El mismo correo con datos de ejemplo, para verlo en el navegador |
| `confirmacion.js` | Envía el correo (EmailJS). Aquí están los 3 identificadores |

## Configuración en EmailJS (gratis, 200 correos al mes)
1. **Email Services:** conecta tu Gmail y copia el **Service ID**.
2. **Email Templates:** crea una plantilla, pega el HTML de `plantilla-confirmacion.html` en el editor de código y rellena:
   - **To Email:** `{{to_email}}`
   - **Subject:** por ejemplo `Hemos recibido tu solicitud, {{nombre}} ✅`
   - **From Name:** `Calculadora de Mudanzas`
   - **Reply To:** tu correo
   Guarda y copia el **Template ID**.
3. **Account → General:** copia la **Public Key**.
4. Pega los tres en `confirmacion.js`.

Si el correo no llega, abre la web, pulsa F12 y mira la consola: `confirmacion.js` escribe el motivo del fallo.
