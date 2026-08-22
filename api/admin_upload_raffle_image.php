<?php
require_once 'auth.php';
require_once 'db.php';
require_once 'image_helper.php';
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

assert_raffle_ownership($pdo, $raffle_id);

$result = process_image_upload($_FILES['image'] ?? null, __DIR__ . '/../uploads/raffles', $prefix . '_' . $raffle_id);
if (!$result['success']) {
    echo json_encode($result);
    exit;
}

$publicPath = '/uploads/raffles/' . $result['filename'];

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
    @unlink($result['path']);
    echo json_encode(['success' => false, 'error' => 'Error al guardar la imagen']);
}
