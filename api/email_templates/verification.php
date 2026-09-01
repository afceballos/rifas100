<?php
require_once __DIR__ . '/shell.php';

// Correo de verificación de correo al registrarse.

function verification_email_subject() {
    return '=?UTF-8?B?' . base64_encode('Confirma tu correo · Ticket100') . '?=';
}

function verification_email_text($toName, $verifyUrl) {
    return "Hola {$toName},\n\n"
        . "Gracias por registrarte en Ticket100. Confirma tu correo para poder iniciar sesión:\n\n"
        . "{$verifyUrl}\n\n"
        . "Este enlace vence en 24 horas. Si tú no creaste esta cuenta, puedes ignorar este mensaje.\n";
}

function verification_email_html($toName, $verifyUrl) {
    $safeName = htmlspecialchars($toName, ENT_QUOTES, 'UTF-8');

    $rows = email_heading_row(
        'Confirma tu correo',
        "Hola <strong style=\"color:#141414;\">{$safeName}</strong>, gracias por registrarte en Ticket100. Confirma tu correo para activar tu cuenta y poder iniciar sesión."
    );
    $rows .= email_button_row($verifyUrl, 'Confirmar mi correo');
    $rows .= email_fallback_link_row($verifyUrl);
    $rows .= email_footnote_row('Este enlace vence en 24 horas. Si tú no creaste esta cuenta, puedes ignorar este mensaje.');

    return render_email_shell($rows, 'Confirma tu correo');
}
