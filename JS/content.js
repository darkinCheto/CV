$(document).ready(function () {
    $('.toggle-info').on('click', function (e) {
        e.preventDefault();
        let targetId = $(this).data('target');
        let targetBox = $('#' + targetId);

        // Ocultar todos los demás
        $('.info-box').not(targetBox).addClass('d-none');

        // Alternar visibilidad del clicado
        targetBox.toggleClass('d-none');
    });

    // Ocultar si haces clic fuera
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.icon-wrapper').length) {
            $('.info-box').addClass('d-none');
        }
    });
});

// Cargar contenido dinámico en el contenedor principal.
$(document).ready(function () {
    $(".load-content").on("click", function (e) {
        e.preventDefault(); // Evita que el enlace recargue la página

        let file = $(this).data("content"); // obtiene el archivo a cargar
        $("#main-content").fadeOut(200, function () {
            $("#main-content").load(file, function () {
                $("#main-content").fadeIn(200);
            });
        });
    });
});

// Si este archivo se carga dentro de un iframe, notificar la altura al padre
function sendHeightToParentFromContent() {
    try {
        var body = document.body, html = document.documentElement;
        var height = Math.max(
            body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight
        );
        parent.postMessage({ type: 'contentHeight', height: height }, '*');
    } catch (e) {
        // no-op
    }
}

// Enviar altura tras carga y tras cambios de tamaño
document.addEventListener('DOMContentLoaded', function () {
    sendHeightToParentFromContent();
    window.addEventListener('resize', sendHeightToParentFromContent);
    setTimeout(sendHeightToParentFromContent, 300);
});
