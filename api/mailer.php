<?php
// Envío de correo simple vía mail() de PHP (sin dependencias externas, acorde
// al resto del backend). En hosting compartido tipo Hostinger normalmente
// funciona sin configuración adicional siempre que el remitente use el mismo
// dominio del sitio.

function send_verification_email($toEmail, $toName, $verifyUrl) {
    $host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
    $fromEmail = 'no-reply@' . $host;

    $subject = '=?UTF-8?B?' . base64_encode('Confirma tu correo · Ticket100') . '?=';

    $body = "Hola {$toName},\n\n"
        . "Gracias por registrarte en Ticket100. Confirma tu correo para poder iniciar sesión:\n\n"
        . "{$verifyUrl}\n\n"
        . "Este enlace vence en 24 horas. Si tú no creaste esta cuenta, puedes ignorar este mensaje.\n";

    $headers = "From: Ticket100 <{$fromEmail}>\r\n"
        . "Reply-To: {$fromEmail}\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";

    return @mail($toEmail, $subject, $body, $headers);
}
