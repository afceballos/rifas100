<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;

if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID inválido']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

$allowed_colors = ['blue', 'violet', 'pink', 'red', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'indigo', 'slate'];
$allowed_styles = ['rounded', 'square', 'circle', 'minimal'];
$allowed_bg_colors = ['default', 'blue', 'violet', 'pink', 'amber', 'emerald', 'teal', 'cyan', 'slate'];

$theme_color = in_array($data['theme_color'] ?? '', $allowed_colors, true) ? $data['theme_color'] : 'blue';
$number_style = in_array($data['number_style'] ?? '', $allowed_styles, true) ? $data['number_style'] : 'rounded';
$bg_color = in_array($data['bg_color'] ?? '', $allowed_bg_colors, true) ? $data['bg_color'] : 'default';

try {
    $stmt = $pdo->prepare("UPDATE raffles SET theme_color = ?, number_style = ?, bg_color = ? WHERE id = ?");
    $stmt->execute([$theme_color, $number_style, $bg_color, $raffle_id]);

    if (!empty($data['remove_image'])) {
        $stmtImg = $pdo->prepare("SELECT background_image FROM raffles WHERE id = ?");
        $stmtImg->execute([$raffle_id]);
        $row = $stmtImg->fetch();
        if ($row && $row['background_image']) {
            $path = __DIR__ . '/../' . ltrim($row['background_image'], '/');
            if (is_file($path)) {
                @unlink($path);
            }
        }
        $stmt2 = $pdo->prepare("UPDATE raffles SET background_image = NULL WHERE id = ?");
        $stmt2->execute([$raffle_id]);
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar el diseño']);
}
