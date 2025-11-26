<?php
 
function makeInitRequest($arrOrderData)
{
    $a = 'hello';

    $arrPostFields = [
        'order_data' => getEncryptedOrderData($arrOrderData),
        'providerCode' => 'tbitestapi_ro'
    ];
 
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://vmrouatftos01.westeurope.cloudapp.azure.com/LoanApplication/Finalize');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $arrPostFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_VERBOSE, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    $response = curl_exec($ch);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    //var_dump('Curl error: ' . curl_error($ch) . "\n\r");
 
    var_dump($arrPostFields);

    var_dump($response);
    exit;
}
 
function getEncryptedOrderData($arrOrderData)
{
 
    $plaintext = json_encode($arrOrderData);
 
    //var_dump($plaintext);
    $strPublicKey = <<<EOD
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA41/0nOIwjmgor4E3cmuN
fBqylJ781ceKkxUvukvP1uBWdDEV+U8ed2jVzhi/DSyGZZjxCrHT7YjueKOAXknD
PD/Jw7WzIV8xX2k4OJrqqREmbiUE0cjlPH1pfrAUgi6DcLASoJD6gcdqcyV/cYlM
qfXnYIWQpIx2iTtPGpc4XEx5jqH6lePWkv7fCULx/1VeBKeERMjZSvLamm5g7S+h
YsbhQ+kzKy6J6psxzj3u6Suwrnzs7Q8lB4tKAjMFSbWWbpf+EDh+LNiIC0L5br86
Vt2XtiUnKjPx0CBqkZoL7MQ/8QK5iuPSh79hng093hcfhG65HaGwMbqYFeyME4/t
ewIDAQAB
-----END PUBLIC KEY-----
EOD;
 
    $publicKey = openssl_pkey_get_public($strPublicKey);
    $a_key = openssl_pkey_get_details($publicKey);
    // Encrypt the data in small chunks.
    $chunkSize = ceil($a_key['bits'] / 8) - 11;
    $output = '';
    while ($plaintext) {
        $chunk = substr($plaintext, 0, $chunkSize);
        $plaintext = substr($plaintext, $chunkSize);
        $encrypted = '';
        if (!openssl_public_encrypt($chunk, $encrypted, $publicKey)) {
            die('Failed to encrypt data');
        }
        $output .= $encrypted;
    }
    openssl_free_key($publicKey);
    //Encrypted data
    var_dump(base64_encode($output));
    var_dump($plaintext);
    return base64_encode($output);
}
 
$arrOrderData = [
    "store_id" => "tbitestapi_ro",
    "order_id" => "000411",
    "back_ref" => "https://retoolapi.dev/el8C9J/tbiapi",
    "order_total" => "2500",
    "username" => "tbitestapi",
    "password" => "MZWlyiuAIbnyT0UO",
    "customer" => [
        "fname" => "Catalin",
        "lname" => "Test",
        "cnp" => "",
        "email" => "cristi@tbicredit.ro",
        "phone" => "0700000000",
        "billing_address" => "Adresa test",
        "billing_city" => "Sector 3",
        "billing_county" => "Bucuresti",
        "shipping_address" => "Adresa test",
        "shipping_city" => "Sector 3",
        "shipping_county" => "Bucuresti",
        "promo" => 0
    ],
    "items" => [
        [
            "name" => "Ceas smartwatch Polar Vantage V, GPS, Senzor H10 HR, Black",
            "qty" => "1.0000",
            "price" => 2199.99,
            "category" => "8",
            "sku" => "DTZ1MCBBM",
            "ImageLink" => "https://s12emagst.akamaized.net/products/18524/18523000/images/res_dfd401b5d188b0e7d724e26c06ecc634_450x450_15v4.jpg"
        ]
    ]
];
 
header('Content-Type:text/plain');
makeInitRequest($arrOrderData);