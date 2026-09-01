<?php
// Envoltorio visual compartido por todas las plantillas de correo: franja de
// marca, wordmark "TICKET100" y tarjeta clara con el mismo estilo del sitio.
// Cada plantilla (ver los demás archivos de esta carpeta) solo arma las filas
// <tr> de contenido propias y las pasa aquí para quedar dentro de la tarjeta.

function render_email_shell($contentRowsHtml, $title = 'Ticket100') {
    $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{$safeTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:#F3EFE6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3EFE6; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#FBF9F4; border-radius:24px; border:1px solid #EAE4D6; overflow:hidden;">
          <tr>
            <td style="height:6px; background:linear-gradient(90deg,#C7FF43,#4C6B12); background-color:#4C6B12; line-height:6px; font-size:1px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:40px 40px 8px 40px; text-align:center;">
              <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace; font-weight:700; font-size:20px; letter-spacing:-0.02em; color:#141414;">TICKET<span style="color:#4C6B12;">100</span></span>
            </td>
          </tr>
          {$contentRowsHtml}
        </table>
        <p style="margin:20px 0 0 0; font-size:11px; color:#A39E90;">Ticket100 · Plataforma de rifas</p>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

// Fila de título + párrafo, reutilizable entre plantillas.
function email_heading_row($heading, $paragraphHtml) {
    $safeHeading = htmlspecialchars($heading, ENT_QUOTES, 'UTF-8');
    return <<<HTML
          <tr>
            <td style="padding:24px 40px 0 40px; text-align:center;">
              <h1 style="margin:0; font-size:22px; line-height:1.3; color:#141414; font-weight:800;">{$safeHeading}</h1>
              <p style="margin:14px 0 0 0; font-size:14px; line-height:1.6; color:#6B6559;">{$paragraphHtml}</p>
            </td>
          </tr>
HTML;
}

// Fila de botón CTA, reutilizable entre plantillas.
function email_button_row($url, $label) {
    $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    $safeLabel = htmlspecialchars($label, ENT_QUOTES, 'UTF-8');
    return <<<HTML
          <tr>
            <td style="padding:28px 40px 8px 40px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:14px; background-color:#65a30d; background-image:linear-gradient(135deg,#84cc16,#4d7c0f);">
                    <a href="{$safeUrl}" target="_blank" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:14px;">
                      {$safeLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
HTML;
}

// Fila de enlace de respaldo (por si el botón no se renderiza), reutilizable.
function email_fallback_link_row($url) {
    $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    return <<<HTML
          <tr>
            <td style="padding:16px 40px 0 40px; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#A39E90;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{$safeUrl}" style="color:#4C6B12; word-break:break-all;">{$safeUrl}</a>
              </p>
            </td>
          </tr>
HTML;
}

// Fila de nota al pie (texto pequeño, gris), reutilizable.
function email_footnote_row($noteHtml) {
    return <<<HTML
          <tr>
            <td style="padding:28px 40px 32px 40px;">
              <hr style="border:none; border-top:1px solid #EAE4D6; margin:0 0 16px 0;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#A39E90; text-align:center;">{$noteHtml}</p>
            </td>
          </tr>
HTML;
}
