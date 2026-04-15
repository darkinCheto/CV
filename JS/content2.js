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
