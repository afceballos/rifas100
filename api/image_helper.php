<?php
// Valida, redimensiona (máx. $maxDimension) y guarda una imagen subida como
// WebP dentro de $uploadDir. Devuelve ['success' => true, 'filename' => ...]
// o ['success' => false, 'error' => ...]; no toca la base de datos.
function process_image_upload($file, $uploadDir, $filenamePrefix, $maxDimension = 1920, $quality = 82) {
    if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'error' => 'No se recibió ninguna imagen'];
    }

    if (!function_exists('imagewebp')) {
        return ['success' => false, 'error' => 'El servidor no tiene soporte para generar imágenes WebP (extensión GD)'];
    }

    $maxBytes = 8 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        return ['success' => false, 'error' => 'La imagen supera el tamaño máximo permitido (8MB)'];
    }

    $tmpPath = $file['tmp_name'];
    $info = @getimagesize($tmpPath);
    if ($info === false) {
        return ['success' => false, 'error' => 'El archivo no es una imagen válida'];
    }

    switch ($info['mime']) {
        case 'image/jpeg':
            $src = @imagecreatefromjpeg($tmpPath);
            break;
        case 'image/png':
            $src = @imagecreatefrompng($tmpPath);
            break;
        case 'image/gif':
            $src = @imagecreatefromgif($tmpPath);
            break;
        case 'image/webp':
            $src = @imagecreatefromwebp($tmpPath);
            break;
        default:
            $src = false;
    }

    if (!$src) {
        return ['success' => false, 'error' => 'Formato de imagen no soportado. Usa JPG, PNG, GIF o WebP'];
    }

    imagepalettetotruecolor($src);
    imagealphablending($src, true);
    imagesavealpha($src, true);

    $width = imagesx($src);
    $height = imagesy($src);

    if ($width > $maxDimension || $height > $maxDimension) {
        $ratio = min($maxDimension / $width, $maxDimension / $height);
        $newWidth = (int)round($width * $ratio);
        $newHeight = (int)round($height * $ratio);

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($src);
        $src = $resized;
    }

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = $filenamePrefix . '_' . uniqid() . '.webp';
    $destPath = $uploadDir . '/' . $filename;

    if (!imagewebp($src, $destPath, $quality)) {
        imagedestroy($src);
        return ['success' => false, 'error' => 'No se pudo generar la imagen WebP'];
    }
    imagedestroy($src);

    return ['success' => true, 'filename' => $filename, 'path' => $destPath];
}
