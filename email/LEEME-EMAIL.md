# Correo de confirmación y newsletter

## Qué hace
- **Correo de confirmación:** cuando alguien envía el formulario de presupuesto, recibe un correo con el resumen de su solicitud, los pasos siguientes y un bloque "Suscríbete a nuestra Newsletter".
- **Ventana emergente de newsletter:** aparece 4 segundos después de entrar en la portada (una sola vez; si se cierra, no vuelve en 30 días). También hay un bloque fijo "Suscríbete a nuestra Newsletter" antes del pie.
- **Enlace del correo:** el botón "Quiero suscribirme" abre la portada con la ventana de suscripción (`/?newsletter=1`).

## Archivos
| Archivo | Para qué |
|---|---|
| `email/plantilla-confirmacion.html` | HTML del correo, con variables `{{nombre}}`, `{{ruta}}`... Es lo que se pega en EmailJS |
| `email/vista-previa-confirmacion.html` | El mismo correo con datos de ejemplo, para verlo en el navegador |
| `confirmacion.js` | Envía el correo (EmailJS). Aquí se pegan los 3 identificadores |
| `suscripcion.js` | Ventana emergente y formularios de suscripción |

## Activar el correo de confirmación (gratis, EmailJS)
Mientras no lo actives, la web funciona igual que antes: el formulario te llega por Web3Forms y el usuario ve el mensaje de gracias en pantalla.

1. Crea una cuenta en https://www.emailjs.com (plan gratuito: 200 correos al mes).
2. **Email Services → Add New Service →** elige Gmail y conecta la cuenta desde la que quieras enviar. Copia el **Service ID**.
3. **Email Templates → Create New Template.**
   - En el contenido, abre el editor de código y pega todo el HTML de `plantilla-confirmacion.html`.
   - **To Email:** `{{to_email}}`
   - **Subject:** `Hemos recibido tu solicitud de presupuesto, {{nombre}}`
   - **From Name:** `Calculadora de Mudanzas`
   - **Reply To:** `yaelvarelaprado@gmail.com`
   - Guarda y copia el **Template ID**.
4. **Account → General:** copia la **Public Key**.
5. Abre `confirmacion.js` y rellena `serviceId`, `templateId` y `publicKey`.
6. Sube los cambios y haz una solicitud de prueba con tu propio correo.

Recomendado: en el panel de EmailJS limita los dominios permitidos a `calculadoramudanzas.es` y fija un tope de envíos si tu plan lo permite, porque la clave pública es visible en el código de la web.

## Newsletter
- Las altas llegan a tu correo como "Nueva suscripción a la newsletter" (Web3Forms, con la misma clave que el formulario de presupuesto). **Es una lista manual:** tienes que copiar los correos a tu herramienta de envío.
- Para una lista de verdad (con baja automática y doble confirmación), crea un formulario en Brevo, MailerLite o Mailchimp y sustituye el `action` de los dos formularios `data-nl-form` de `index.html` por la URL que te den. Los campos pueden requerir otro nombre (`EMAIL`, por ejemplo).
- La newsletter no se activa nunca sola: el usuario debe marcar la casilla. No se le suscribe por pedir presupuesto.

## Cambiar tiempos
En `suscripcion.js`: `DELAY_MS` (espera antes de abrir la ventana) y `HIDE_DAYS` (días sin volver a mostrarla tras cerrarla).
