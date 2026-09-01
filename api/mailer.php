<?php
// Envío de correo simple vía mail() de PHP (sin dependencias externas, acorde
// al resto del backend). En hosting compartido tipo Hostinger normalmente
// funciona sin configuración adicional siempre que el remitente use el mismo
// dominio del sitio.
//
// Las plantillas visuales (HTML con el estilo del sitio) viven en
// email_templates/ — cada tipo de correo tiene su propio archivo ahí, todos
// comparten el mismo envoltorio de marca (email_templates/shell.php). Este
// archivo solo arma y envía el mensaje multipart/alternative (texto + HTML).

require_once __DIR__ . '/email_templates/verification.php';
require_once __DIR__ . '/email_templates/password_reset.php';

// Envío genérico multipart/alternative (texto plano + HTML) — lo usan todas
// las funciones send_*_email de abajo.
function send_email($toEmail, $subject, $textBody, $htmlBody) {
    $host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
    $fromEmail = 'no-reply@' . $host;
    $boundary = md5(uniqid((string)time(), true));

    $headers = "From: Ticket100 <{$fromEmail}>\r\n"
        . "Reply-To: {$fromEmail}\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

    $message = "--{$boundary}\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $textBody . "\r\n\r\n"
        . "--{$boundary}\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $htmlBody . "\r\n\r\n"
        . "--{$boundary}--";

    return @mail($toEmail, $subject, $message, $headers);
}

function send_verification_email($toEmail, $toName, $verifyUrl) {
    return send_email(
        $toEmail,
        verification_email_subject(),
        verification_email_text($toName, $verifyUrl),
        verification_email_html($toName, $verifyUrl)
    );
}

function send_password_reset_email($toEmail, $toName, $resetUrl) {
    return send_email(
        $toEmail,
        password_reset_email_subject(),
        password_reset_email_text($toName, $resetUrl),
        password_reset_email_html($toName, $resetUrl)
    );
}
