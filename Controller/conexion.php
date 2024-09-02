<?php
// Archivo de configuración de la base de datos
require 'config.php';
// Establecer la zona horaria a Tegucigalpa
date_default_timezone_set('America/Tegucigalpa');
// Crear una función que devuelve una conexión de base de datos segura
function getDB() {
    // Utilizar variables definidas en el archivo de configuración
    $dbHost = DB_HOST;
    $dbUsername = DB_USERNAME;
    $dbPassword = DB_PASSWORD;
    $dbName = DB_NAME;

    // Crear una conexión a la base de datos usando mysqli
    $conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

    // Verificar la conexión
    if ($conn->connect_error) {
        die("Conexión fallida: " . $conn->connect_error);
    }

    // Establecer la codificación de caracteres a UTF-8 para soportar caracteres especiales
    $conn->set_charset("utf8");

    return $conn;
}

// Utilizar la función para obtener la conexión
//$db = getDB();
?>
