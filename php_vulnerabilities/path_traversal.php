<?php
$filename = $_GET['file'] ?? '';

$content = file_get_contents($filename);
echo $content;

$path = $_GET['path'] ?? '';
$files = scandir($path);
foreach ($files as $file) {
    echo $file . "<br>";
}
?>
