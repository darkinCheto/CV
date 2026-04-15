// Validación simple y envío del formulario de contacto
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contact-form');

    function sendHeightToParent() {
        try {
            var body = document.body, html = document.documentElement;
            var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
            parent.postMessage({ type: 'contentHeight', height: height }, '*');
        } catch (e) {}
    }

    sendHeightToParent();
    window.addEventListener('resize', sendHeightToParent);

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // simple validation
        var name = form.name.value.trim();
        var email = form.email.value.trim();
        var message = form.message.value.trim();
        var valid = true;

        if (!name) { valid = false; form.name.classList.add('is-invalid'); } else { form.name.classList.remove('is-invalid'); }
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { valid = false; form.email.classList.add('is-invalid'); } else { form.email.classList.remove('is-invalid'); }
        if (!message) { valid = false; form.message.classList.add('is-invalid'); } else { form.message.classList.remove('is-invalid'); }

        sendHeightToParent();

        if (!valid) {
            // ajustar altura tras mostrar mensajes
            setTimeout(sendHeightToParent, 250);
            return;
        }

        // Intentar enviar mediante fetch a un endpoint (si lo configuraran)
        var payload = { name: name, email: email, message: message };

        // Aquí se podría reemplazar la URL por el endpoint real del servidor.
        var endpoint = '';

        if (endpoint) {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function (res) {
                if (res.ok) {
                    form.reset();
                    alert('Mensaje enviado. Gracias.');
                    sendHeightToParent();
                } else {
                    throw new Error('error');
                }
            }).catch(function () {
                // fallback a mailto
                fallbackMailto(name, email, message);
            });
        } else {
            // No hay endpoint configurado: usar mailto fallback
            fallbackMailto(name, email, message);
        }
    });

    function fallbackMailto(name, email, message) {
        var subject = encodeURIComponent('Contacto desde web - ' + name);
        var body = encodeURIComponent('Nombre: ' + name + '\nEmail: ' + email + '\n\n' + message);
        // Dirección por defecto: sustituir por el email real de Diana si se desea
        var to = 'dianajs1989@gmail.com';
        var mailto = 'mailto:' + to + '?subject=' + subject + '&body=' + body;

        // Abrir cliente de correo
        window.location.href = mailto;
    }
});

// enviar altura inicial ocasionalmente por si no se disparó en DOMContentLoaded
setTimeout(function(){ try{ parent.postMessage({type:'contentHeight', height: document.body.scrollHeight}, '*'); }catch(e){} }, 500);
// Al cargar el contenido, enviar la altura al padre para que el iframe pueda ajustarse
function sendHeightToParent() {
	try {
		var body = document.body, html = document.documentElement;
		var height = Math.max(
			body.scrollHeight, body.offsetHeight,
			html.clientHeight, html.scrollHeight, html.offsetHeight
		);
		// Enviar la altura en píxeles
		parent.postMessage({ type: 'contentHeight', height: height }, '*');
	} catch (e) {
		// Si no hay parent o hay restricción de CORS, no hacemos nada
	}
}

document.addEventListener('DOMContentLoaded', function () {
	sendHeightToParent();
	// reenviar cuando cambie el tamaño de la ventana interna
	window.addEventListener('resize', function () {
		sendHeightToParent();
	});
	// Si hay cambios dinámicos pequeños, reenviar tras un breve retardo
	setTimeout(sendHeightToParent, 500);
});
