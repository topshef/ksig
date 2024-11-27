<?php

function getCacheBustedPath($relativePath) {
    $modificationTime = filemtime(__DIR__ . '/' . $relativePath);
    //$modificationTime = gmdate("Ymd_His", $modificationTime); // optional for debugging
    $path = "$relativePath?cb=$modificationTime";
    echo $path;
}

?>

 