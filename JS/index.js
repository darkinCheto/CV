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

// boton para mostrar y ocultar iframes.
$(document).ready(function () {
    $(".show-section").on("click", function (e) {
        e.preventDefault();

        // Oculta todos los iframes
        $(".content-frame").addClass("d-none");

        // Muestra solo el iframe seleccionado
        let target = $(this).data("target");
        $("#" + target).removeClass("d-none");
    });
});

// Cargar páginas dentro del iframe #main-content en lugar de usar AJAX
$(document).ready(function () {
    $(".load-content").on("click", function (e) {
        e.preventDefault();
        let file = $(this).data("content");
        let $iframe = $("#main-content");

    // Establece el src del iframe. about:blank si no hay archivo definido.
    $iframe.attr('src', file || 'about:blank');

    // Mientras carga, darle una altura provisional para evitar saltos
    $iframe.css({ height: '600px', overflow: 'hidden' });

    // Actualizar el título dentro del div "Acerca de mí" según el contenido seleccionado
        try {
            var $aboutTitle = $('.about-header h3');
            if (file && file.toString().toLowerCase().indexOf('content2.html') !== -1) {
                $aboutTitle.text('Carta de Presentación');
                $aboutTitle.addClass('text-warning');
                // ocultar el texto que está debajo del título "Acerca de mí"
                $('.about-header .about-header-text').addClass('d-none');
            } else if (file && file.toString().toLowerCase().indexOf('content.html') !== -1) {
                $aboutTitle.text('Acerca de mí');
                $aboutTitle.addClass('text-warning');
                // mostrar el texto que está debajo del título
                $('.about-header .about-header-text').removeClass('d-none');
            } else if (file && file.toString().toLowerCase().indexOf('content3.html') !== -1) {
                // Mostrar 'Contacto' con icono y ocultar el texto debajo, igual que content2 behaviour
                var icon = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.2" class="text-warning me-2" viewBox="0 0 24 24">\n                    <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13" />\n                    <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L15 22l-4-9-9-4 20-7z" />\n                </svg>';
                $aboutTitle.html(icon + 'Contacto');
                $aboutTitle.addClass('text-warning');
                $('.about-header .about-header-text').addClass('d-none');
            } else if (file && file.toString().toLowerCase().indexOf('content4.html') !== -1) {
                // Mostrar 'Descargar CV' y ocultar el texto debajo
                $aboutTitle.text('Descargar CV');
                $aboutTitle.addClass('text-warning');
                $('.about-header .about-header-text').addClass('d-none');
            } else if (file && file.toString().toLowerCase().indexOf('content5.html') !== -1) {
                // Mostrar 'Proyectos' y ocultar el texto debajo
                $aboutTitle.text('Proyectos');
                $aboutTitle.addClass('text-warning');
                $('.about-header .about-header-text').addClass('d-none');
            }else {
                // Default: mantener Acerca de mí
                $aboutTitle.text('Acerca de mí');
                $aboutTitle.addClass('text-warning');
                $('.about-header .about-header-text').removeClass('d-none');
            }
        } catch (err) {
            // Si no se encuentra el elemento, ignorar
        }
        // Intentar ajustar la altura inmediatamente si el iframe es same-origin
        $iframe.off('load.iframeResize').on('load.iframeResize', function () {
            // Dar foco al iframe para accesibilidad
            this.contentWindow && this.contentWindow.focus && this.contentWindow.focus();

            try {
                let doc = this.contentDocument || this.contentWindow.document;
                // calcular altura total del contenido
                let height = Math.max(
                    doc.body.scrollHeight, doc.documentElement.scrollHeight,
                    doc.body.offsetHeight, doc.documentElement.offsetHeight
                );
                height = Math.max(height, 200); // tope mínimo razonable
                // Establecer altura exacta (no min-height) para que el padre controle el scroll
                // Aplicar sólo si la diferencia es significativa para evitar repeticiones
                var $if = $(this);
                var current = parseInt($if.css('height'), 10) || 0;
                var diff = Math.abs(current - height);
                if (diff > 8) { // tolerancia de 8px
                    $if.css({ height: height + 'px', overflow: 'hidden' });
                }
                else {
                    // Si la diferencia es pequeña, reintentar tras breve retardo (hasta 2 reintentos)
                    var tries = $if.data('resize-tries') || 0;
                    if (tries < 2) {
                        $if.data('resize-tries', tries + 1);
                        setTimeout(function () {
                            try {
                                let d2 = (document === doc) ? doc : (this.contentDocument || this.contentWindow.document);
                                let h2 = Math.max(d2.body.scrollHeight, d2.documentElement.scrollHeight, d2.body.offsetHeight, d2.documentElement.offsetHeight);
                                h2 = Math.max(h2, 200);
                                if (Math.abs(parseInt($if.css('height'), 10) - h2) > 8) {
                                    $if.css({ height: h2 + 'px', overflow: 'hidden' });
                                }
                            } catch (e) {
                                // ignore
                            }
                        }.bind(this), 220);
                    }
                }
            } catch (err) {
                // Si es cross-origin, confiar en postMessage desde la página cargada.
                // Mantener la altura provisional hasta recibir postMessage
            }
        });
    });
});

// Escuchar mensajes postMessage desde iframes hijos para ajustar la altura del iframe principal
window.addEventListener('message', function (e) {
    try {
        var data = e.data || {};
        if (data && data.type === 'contentHeight' && data.height) {
            var h = parseInt(data.height, 10) || 400;
                // usar height exacto (sin sumar padding extra que puede provocar bucles)
                h = Math.max(h, 200);
                var $iframe = $('#main-content');
                if ($iframe.length) {
                    // evitar re-aplicar la misma altura para detener bucles de resize
                    var current = parseInt($iframe.css('height'), 10) || 0;
                    if (current !== h) {
                        $iframe.css({ height: h + 'px', overflow: 'hidden' });
                    }
                }
        }
    } catch (err) {
        // Ignorar mensajes mal formados
    }
}, false);

