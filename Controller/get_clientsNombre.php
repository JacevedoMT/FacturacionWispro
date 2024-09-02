<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://www.cloud.wispro.co/api/v1/clients', [
  'headers' => [
    'Authorization' => '5367aa2c-c117-4447-a657-00ca13894275',
    'accept' => 'application/json',
  ],
]);

echo $response->getBody();

?>

<?php
require_once('vendor/autoload.php');

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

$client = new Client();

try {
    $response = $client->request('GET', 'https://www.cloud.wispro.co/api/v1/clients', [
        'headers' => [
            'Authorization' => '4d62069f-6e03-457d-90ee-8a26edd2fccf',
            'Accept' => 'application/json',
        ],
    ]);

    $body = $response->getBody();
    header('Content-Type: application/json');
    echo $body;

} catch (RequestException $e) {
    if ($e->hasResponse()) {
        $errorResponse = $e->getResponse()->getBody()->getContents();
        echo $errorResponse;
    } else {
        echo json_encode(['error' => 'Request failed']);
    }
}
?>
