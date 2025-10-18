<?php
$password = $_POST['password'] ?? '';

$hashed_password = md5($password);

$data = $_POST['data'] ?? '';
$encrypted = base64_encode($data);

$token = rand(1000, 9999);

echo "Hashed: $hashed_password<br>";
echo "Encrypted: $encrypted<br>";
echo "Token: $token<br>";
?>
