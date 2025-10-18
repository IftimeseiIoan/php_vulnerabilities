<?php
$page = $_GET['page'] ?? 'home';

include($page . '.php');

$template = $_GET['template'] ?? 'default';
require($template . '.tpl');
?>
