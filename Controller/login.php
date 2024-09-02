<?php
session_start();

require 'conexion.php';

// Habilitar la visualización de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Obtener la conexión a la base de datos
    $conn = getDB();
    if (!$conn) {
        die(json_encode([
            'session_valid' => false,
            'message' => 'No se pudo conectar a la base de datos'
        ]));
    }

    // Preparar la consulta SQL
    $stmt = $conn->prepare("SELECT id_usuario, nombre, contraseña, token, tipo_usuario, estado FROM usuario WHERE nombre = ?");
    if (!$stmt) {
        die(json_encode([
            'session_valid' => false,
            'message' => 'Error en la preparación de la consulta: ' . $conn->error
        ]));
    }

    // Vincular parámetros y ejecutar la consulta
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    // Verificar si se encontró el usuario
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if ($user['estado'] == 0) {
            echo json_encode([
                'session_valid' => false,
                'message' => 'El usuario está desactivado'
            ]);
        } elseif (password_verify($password, $user['contraseña'])) {
            $_SESSION['loggedin'] = true;
            $_SESSION['id_usuario'] = $user['id_usuario'];
            $_SESSION['username'] = $user['nombre'];
            $_SESSION['token'] = $user['token'];  // Almacenar el token en la sesión

            // Generar un token aleatorio de 64 caracteres
            $token = bin2hex(random_bytes(64));  // 32 bytes * 2 caracteres por byte = 64 caracteres

            // Actualizar el token en la base de datos
            $updateStmt = $conn->prepare("UPDATE usuario SET token = ? WHERE id_usuario = ?");
            if (!$updateStmt) {
                die(json_encode([
                    'session_valid' => false,
                    'message' => 'Error en la actualización del token: ' . $conn->error
                ]));
            }

            $updateStmt->bind_param("si", $token, $user['id_usuario']);
            $updateStmt->execute();
            $updateStmt->close();

            // Enviar confirmación al cliente
            echo json_encode([
                'session_valid' => true,
                'username' => $user['nombre'],
                'token' => $token,
                'userType' => $user['tipo_usuario']
            ]);
        } else {
            echo json_encode([
                'session_valid' => false,
                'message' => 'Contraseña incorrecta'
            ]);
        }
    } else {
        echo json_encode([
            'session_valid' => false,
            'message' => 'No existe el usuario'
        ]);
    }
    $stmt->close();
    $conn->close();
}
?>
