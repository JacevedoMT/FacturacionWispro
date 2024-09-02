<?php
require_once('vendor/autoload.php');

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// Configurar el cliente HTTP
$client = new Client();

// Obtener los datos del formulario
$data = json_decode(file_get_contents('php://input'), true);

try {
    // Realizar la solicitud a la API
    $response = $client->request('POST', 'https://www.cloud.wispro.co/api/v1/invoicing/payments', [
        'headers' => [
            'Authorization' => '4d62069f-6e03-457d-90ee-8a26edd2fccf',
            'Accept' => 'application/json',
            'Content-Type' => 'application/json'
        ],
        'json' => $data
    ]);

    // Obtener el cuerpo de la respuesta
    $responseBody = $response->getBody();
    echo $responseBody;

} catch (RequestException $e) {
    // Manejo de errores
    if ($e->hasResponse()) {
        $errorResponse = $e->getResponse()->getBody()->getContents();
        echo $errorResponse;
    } else {
        echo json_encode(['error' => 'Request failed']);
    }
}
?>
