<?php

    //dev use only remote log for mobile device testing

    require_once('ACL.php');
    require_once('elog.php');
    
    // Get the raw POST data
    $data = file_get_contents('php://input');
    
    $obj = json_decode($data);
    $isJson = json_last_error() === JSON_ERROR_NONE;

    $remoteAgent = $_SERVER['HTTP_USER_AGENT'];
    $device = detectDevice($remoteAgent);
    if ($isJson && $data) elog("$device says $data");
    else elog($obj, "$device returned json");


    function detectDevice($userAgent) {
        $userAgent = strtolower($userAgent);

        // Regular expressions for different devices
        $devices = [
            'Windows' => '/windows nt/i',
            'iPad' => '/ipad/i',
            'Mac' => '/macintosh|mac os x/i',
            'iPhone' => '/iphone/i',
            'Android' => '/android/i',
            'BlackBerry' => '/blackberry/i',
            'Windows Phone' => '/windows phone/i',
            'Linux' => '/linux/i'
        ];

        // Check each device regex against the user agent string
        foreach ($devices as $device => $pattern)
            if (preg_match($pattern, $userAgent)) return $device;

        // If no match, return Unknown
        return 'Unknown';
    }


?>
see <a href='log.php'>remote log</a>