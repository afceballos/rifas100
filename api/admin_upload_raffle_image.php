<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$raffle_id = isset($_POST['raffle_id']) ? (int)$_POST['raffle_id'] : 0;
$target = isset($_POST['target']) && $_POST['target'] === 'organizer' ? 'organizer' : 'background';
$column = $target === 'organizer' ? 'organizer_photo' : 'background_image';
$prefix = $target === 'organizer' ? 'organizer' : 'raffle';

if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de sorteo inválido']);
    exit;
}

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'No se recibió ninguna imagen']);
    exit;
}

if (!function_exists('imagewebp')) {
    echo json_encode(['success' => false, 'error' => 'El servidor no tiene soporte para generar imágenes WebP (extensión GD)']);
    exit;
}

$tmpPath = $_FILES['image']['tmp_name'];

$maxBytes = 8 * 1024 * 1024;
if ($_FILES['image']['size'] > $maxBytes) {
    echo json_encode(['success' => false, 'error' => 'La imagen supera el tamaño máximo permitido (8MB)']);
    exit;
}

$info = @getimagesize($tmpPath);
if ($info === false) {
    echo json_encode(['success' => false, 'error' => 'El archivo no es una imagen válida']);
    exit;
}

$mime = $info['mime'];
switch ($mime) {
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
    echo json_encode(['success' => false, 'error' => 'Formato de imagen no soportado. Usa JPG, PNG, GIF o WebP']);
    exit;
}

imagepalettetotruecolor($src);
imagealphablending($src, true);
imagesavealpha($src, true);

$width = imagesx($src);
$height = imagesy($src);
$maxDimension = 1920;

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

$uploadDir = __DIR__ . '/../uploads/raffles';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$filename = $prefix . '_' . $raffle_id . '_' . uniqid() . '.webp';
$destPath = $uploadDir . '/' . $filename;

if (!imagewebp($src, $destPath, 82)) {
    imagedestroy($src);
    echo json_encode(['success' => false, 'error' => 'No se pudo generar la imagen WebP']);
    exit;
}
imagedestroy($src);

$publicPath = '/uploads/raffles/' . $filename;

try {
    $stmt = $pdo->prepare("SELECT $column FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);
    $row = $stmt->fetch();

    $stmt2 = $pdo->prepare("UPDATE raffles SET $column = ? WHERE id = ?");
    $stmt2->execute([$publicPath, $raffle_id]);

    if ($row && $row[$column] && $row[$column] !== $publicPath) {
        $oldPath = __DIR__ . '/../' . ltrim($row[$column], '/');
        if (is_file($oldPath)) {
            @unlink($oldPath);
        }
    }

    echo json_encode(['success' => true, $column => $publicPath]);
} catch (Exception $e) {
    @unlink($destPath);
    echo json_encode(['success' => false, 'error' => 'Error al guardar la imagen']);
}
