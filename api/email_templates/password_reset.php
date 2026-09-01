<?php
require_once __DIR__ . '/shell.php';

// Correo de "olvidé mi contraseña".

function password_reset_email_subject() {
    return '=?UTF-8?B?' . base64_encode('Restablece tu contraseña · Ticket100') . '?=';
}

function password_reset_email_text($toName, $resetUrl) {
    return "Hola {$toName},\n\n"
        . "Recibimos una solicitud para restablecer tu contraseña en Ticket100. Si fuiste tú, usa este enlace:\n\n"
        . "{$resetUrl}\n\n"
        . "Este enlace vence en 1 hora. Si tú no lo solicitaste, ignora este mensaje y tu contraseña seguirá igual.\n";
}

function password_reset_email_html($toName, $resetUrl) {
    $safeName = htmlspecialchars($toName, ENT_QUOTES, 'UTF-8');

    $rows = email_heading_row(
        'Restablece tu contraseña',
        "Hola <strong style=\"color:#141414;\">{$safeName}</strong>, recibimos una solicitud para restablecer tu contraseña en Ticket100. Si fuiste tú, crea una nueva contraseña con el botón de abajo."
    );
    $rows .= email_button_row($resetUrl, 'Restablecer contraseña');
    $rows .= email_fallback_link_row($resetUrl);
    $rows .= email_footnote_row('Este enlace vence en 1 hora. Si tú no lo solicitaste, ignora este mensaje y tu contraseña seguirá igual.');

    return render_email_shell($rows, 'Restablece tu contraseña');
}
