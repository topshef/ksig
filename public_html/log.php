<?php

    //php logging v0.42
    
    require_once('ACL.php');
    require_once('elog.php');

    // ┌─┐┬─┐┬─┐┌─┐┬─┐    ┬  ┌─┐┌─┐  ┌─┐┌─┐┌┬┐┬ ┬
    // ├┤ ├┬┘├┬┘│ │├┬┘    │  │ ││ ┬  ├─┘├─┤ │ ├─┤
    // └─┘┴└─┴└─└─┘┴└─────┴─┘└─┘└─┘  ┴  ┴ ┴ ┴ ┴ ┴
    // error_log path

    // Check environment variable for log path, fall back to php.ini setting if not found.
    $pathlog = getenv('PHP_ERROR_LOG') ?: ini_get('error_log');

    // If no path or it's not writable, use a temp directory fallback.
    if (!$pathlog || !is_writable($pathlog)) 
        $pathlog = sys_get_temp_dir() . '/JY78764.php.fallback.log';

    // Set the error log to the determined or fallback path.
    ini_set('error_log', $pathlog);

    // Check file permissions if the log file exists
    $pathlog_permissions = file_exists($pathlog) ? decoct(fileperms($pathlog) & 0777) : 'N/A'; // "755" or "N/A" if not found


    // ┬  ┌─┐┌─┐  ┌─┐┌─┐┌─┐┌┬┐
    // │  │ ││ ┬  ├─┘│ │└─┐ │ 
    // ┴─┘└─┘└─┘  ┴  └─┘└─┘ ┴ 
    // log raw post eg from js console.log

    $andSimple = isset($_GET['simple']) ? '&simple' : '';

	if (isset($_GET['clear'])) {
		//unlink($pathlog);
		emptyFile($pathlog);
		header("Location: ./log.php?$andSimple");
	}

	if (!file_exists($pathlog)) exit('<pre>empty log');
    
	$log = file_get_contents($pathlog); //
	/*
      todo review
      
      1. fetch from server and archive log in one go (so next fetch just pulls new data)
      2. save new data to client indexedDB or local or session storage
      3. js to update local data with format via regex
      4. js to render page from local data
      
      
      ***old bs
      consider fetch into server or client session and then delete server info. to improve performace?
      grab and delete log in one
      add to session
      render session
      
      or.. push to front-end localstorage
      ..and only format new entries client side
      
      localstorage could contain pairs of records, raw and formatted
      js just updates where not yet formatted. async
      
      expand to make it more db like and add filter options eg cli vs web
      
      also when pulling log from server, add filter options
      elog could potentially also interface with a db instead
    
    */
    
    $log_clean = removeScripts($log);
	function removeScripts($in) {
		//very basic remove script tags for now
		return preg_replace('#<script(.*?)>(.*?)</script>#is', '<mark>script removed</mark>', $in);
	}
	
	if ($log_clean != $log) $log = "<mark>warning: js scripts detected and removed</mark>\n$log_clean";
       	
	if (isset($_GET['raw'])) exit($log_clean);
    
    
// ╦ ╦╔╦╗╔╦╗╦    ┌─┐┬ ┬┌┬┐┌─┐┬ ┬┌┬┐
// ╠═╣ ║ ║║║║    │ ││ │ │ ├─┘│ │ │ 
// ╩ ╩ ╩ ╩ ╩╩═╝  └─┘└─┘ ┴ ┴  └─┘ ┴ 
// HTML output

    if (isset($_GET['clearSession'])) include 'clearSession.php';
    
    $resultSession = session_start();
    $sessionId = session_id();
    
    // $_SESSION['page_hits'] ??= 0;  //php 8 only
    if (!$_SESSION['page_hits']) $_SESSION['page_hits'] = 0;
    $_SESSION['page_hits']++;
    
    $user_agent = $_SERVER['HTTP_USER_AGENT'];
    $device = detectDevice($user_agent);
    

    if ($_SESSION['page_hits'] == 1) elog("$device session started $sessionId $ip $user_agent");

    //elog([$_SESSION, $_SERVER], "session and server info on $device for $sessionId $ip $user_agent");
    

function emptyFile($filepath) {
	$f = @fopen($filepath, "r+");
	if ($f !== false) {
		ftruncate($f, 0);
		fclose($f);
	}
}

function getBaseURL_notneeded() {
	$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
	return "https://{$_SERVER['HTTP_HOST']}/$basePath";	
}


$ip_known = explode(' ', '82.118.227.86 130.185.251.53 130.185.251.77 176.126.78.48');

// Escape dots for regex and join IPs with the pipe symbol (|)
$ip_known_regex = implode('|', array_map(function($ip) {
    return preg_quote($ip, '/');
}, $ip_known));

//exit($ip_known_regex);




//https://www.iconarchive.com/search?q=log&page=1
?>
<!DOCTYPE html>
<html lang="en">
<head>
<title><?php echo $_SERVER['SERVER_NAME'];?> log</title>
<meta name="viewport" content="width=device-width, initial-scale=1.5">

<link rel="shortcut icon" href="log.ico">
<style>

    a { padding: 7px; text-decoration: none; border-radius: 4px;}
    a:hover { font-weight: bold; background-color: white;}

    #banner {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background-color: rgba(230, 255, 230, 0.9); /* light green */
        border-bottom: 1px solid #ccc;
        padding: 10px;
        z-index: 1000; /* Ensure it's above other content */
    }

    #banner.logPause {
        background-color: rgba(255, 230, 230, 0.9); /* Light red background */
    }

    body {
        padding: 5px;
        padding-top: 30px;
        font-family: monospace;
    }
    
    #logContainer {
        white-space: pre;
    }
    
    details:hover summary {
        background-color: #e6f7ff; /* light blue */
        cursor: pointer;
    }
    
    .timestamp {
        /* background-color: #e6f7ff; */
    }
    
    .json-punctuation { color: grey; }
    .json-key { color: #cc0000; /* Red for key names */ }
    .json-key-array { color: #6600ff; }
    .json-value { color: #008000; /* Green */ }
    .json-number-positive { color: #0000ff; }
    .json-number-negative { color: #ff0000; }
    .json-value-null { color: #9CA3AF; /* Gray for null */ }
    .json-value-true { color: #00cc00; /* Green for true */ }
    .json-value-false { color: #d31212; /* Red for false */ }

    .format-ip { color: #66a3ff; }   /*007bff*/
    .ip-known { background-color: #e6ffee;}
    .format-hedera { color: #8B4513;  background-color: #fff3e6; }
    .SUCCESS { background-color: #80ff80; }
    .URL { color: #0000ff; background-color: #e6f2ff; }
    .unixfolder { color: #737373; background-color: #f2f2f2; }
    .unixfilename { color: #333333; background-color: #f2f2f2; }
    
    .logtime { color: #b3b3b3; }
    .scriptname { background-color: #ffff99; }
    
    
    .error { border-left: 10px solid #ff8080;  display: block;  white-space: pre-wrap; margin: 5px 0 5px 10px; padding-left: 5px;}
    .warning { border-left: 3px solid #ffa366;  display: block;  white-space: pre-wrap; margin: 5px 0 5px 10px; padding-left: 5px;}
 
    mark {
        background-color: #ffff99;
        font-weight: bold;
    }
    
    /*text-decoration: underline; */


</style>
<script>
    
    const urlParms = new URLSearchParams(window.location.search)

    let isPaused = urlParms.has('pause')
    const isPlain  = urlParms.has('plain')  // not formatting
    const isSimple = urlParms.has('simple') // decluttered - no time info eg for tablet view
  
  
</script>
</head>
<body>
    <span id='top'></span>
    <span id='banner'>
        <a href='#bottom'>🔽 down</a> <a href='./log.php?clear<?=$andSimple?>'>🗑️ clear</a> 
        <a id='btnPause' href='./log.php?pause<?=$andSimple?>'>⏸️ pause</a> 
        <a id='btnResume' href='./log.php?<?=$andSimple?>'>▶️ resume</a>

        <a id='btnSimple' href='./log.php?simple'>📱simple view</a>
        <a id='btnDetail' href='./log.php'>🖥️ detail view</a>  
        
        | <a id='btnBrowserLog' href='./log.php?pushClientLogtoServer<?=$andSimple?>'>client log</a>  
        <a id='btnClearSession' href='./log.php?clearSession<?=$andSimple?>'>🗑️ session</a>  



        <span class='clutter'><a id='btnFormat' href='./log.php?plain'>remove formatting</a></span>
        <span class='clutter'>error_log=<?=$pathlog?> (<?=$pathlog_permissions?>)</span>
    </span>
    
    <div id='logContainer'><?=$log_clean?></div>
    
    <a href='#top'>🔼 top</a> <span id="elapsed">0</span>
    <span id='bottom'></span>
</body>

<script>

function formatJSON() {
    
    document.getElementById('logContainer').innerHTML = 
    document.getElementById('logContainer').innerHTML.replace(
        /"(\w+)":\s*"([^"]*)"/g,  //json values
        '<span class="json-punctuation">"</span>' +
        '<span class="json-key">$1</span>' +
        '<span class="json-punctuation">": "</span>' +
        '<span class="json-value">$2</span>' +
        '<span class="json-punctuation">"</span>'
    )
    .replace(
        /"(\w+)":\s*(\d*\.?\d+)/g,  //positive numeric values
        // /"(\w+)":\s*(-?\d*\.?\d+)/g, 
        '<span class="json-punctuation">"</span>' +
        '<span class="json-key">$1</span>' +
        '<span class="json-punctuation">": </span>' +
        '<span class="json-number-positive">$2</span>'
    )
    .replace(
        /"(\w+)":\s*(-\d*\.?\d+)/g,  //negative numeric values
        '<span class="json-punctuation">"</span>' +
        '<span class="json-key">$1</span>' +
        '<span class="json-punctuation">": </span>' +
        '<span class="json-number-negative">$2</span>'
    )
    .replace(
        /"(\w+)":\s*(null|true|false)/g,  //other types
        '"<span class="json-key">$1</span>": <span class="json-value-$2">$2</span>'
    )
    .replace(
        /"(\w+)":/g,  //any remaining keys
        '<span class="json-punctuation">"</span>' +
        '<span class="json-key-array">$1</span>' +
        '<span class="json-punctuation">":</span>')

}


function formatAdhoc() {

    document.getElementById('logContainer').innerHTML = 
    document.getElementById('logContainer').innerHTML

     
    .replace(
        /^(\[.*? UTC\])\s+/gm,
        '<span class="timestamp">$1</span> '
    )
    
    .replace(
        /([^\/\s]+\.php)(\sLine\s\d+)/g,
        //"<span class='scriptname'><b>$1$2</b></span>"  // conflicts
        '<mark><b>$1$2</b></mark>'
    )

    .replace(
        /(https?:\/\/[^\s?]+)/g,  // urls
        '<span class="URL">$1</span>'
    )

    .replace(
        /([^\/\s]+\.php)(\s+on\s+line\s+\d+)/g,  // error or warning references
        '<span style="color: red;">$1$2</span>'
    )    
    .replace(
        /(?<=\s)(\/[^\/\s]+(?:\/[^\/\s]+)*\/)([^\/\s]+\.\w+)(?=\s|$)/g,  // ^&*!!! unix paths,thanks GPT!
        '<span class="unixfolder">$1</span><span class="unixfilename">$2</span>'
    )
     
    .replace( 
        ///(&amp;)([^&=]+)(=)/g, 
        ///(&amp;)([^&=]+)(=)(\w+)/g,
        ///(&amp;)([^&=]+)(=)([\w.]+)/g,
        /(&amp;|\?)([^&=?]+)(=)([\w.]+)/g, // format url query parameters

        function(match, p1, p2, p3, p4) {
            // Apply classes to punctuation and URL keys
            var punctuationClass = '<span class="json-punctuation">' + p1 + '</span>'
            var keyClass = '<span class="json-key">' + p2 + '</span>'
            var equalSignClass = '<span class="json-punctuation">' + p3 + '</span>'
            var valueClass = '<span class="json-value">' + p4 + '</span>'
            return punctuationClass + keyClass + equalSignClass + valueClass
        }
     )
     
    .replace(
        /(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)/g,  // Format IP addresses
        '<span class="format-ip">$1</span>'
    )       
    .replace(
        /(?<![\d.])(\d+\.\d+\.\d+)(?![\d.])/g, // Format Hedera entities   
        '<span class="format-hedera">$1</span>'
    )

    .replace(
        /"(\w+)":/g,  // Any remaining keys (existing logic)
        '<span class="json-punctuation">"</span>' +
        '<span class="json-key-array">$1</span>' +
        '<span class="json-punctuation">":</span>'
    )

    .replace(
        /(\bSUCCESS\b)/g,  // the word SUCCESS
        '<span class="SUCCESS">$1</span>'
    )    
    
    /* example
    .replace(
        /(?:130\.185\.251\.77|130\.185\.251\.53)\b/g,
        '<span class="ip-known">$&</span>'
    )
    */

    .replace(
        /(?:<?=$ip_known_regex?>)\b/g,
        '<span class="ip-known">$&</span>'
    )

    .replace(
        /\[\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2} UTC\]/g,
        '<span class="logtime">$&</span>'
    )
    
    .replace(
        /^(.*?PHP Warning.*?)(\r?\n|$)/gm,
        '<span class="warning">$1</span>$2'
    )

    .replace(
        /^(.*?PHP Parse error.*?)(\r?\n|$)/gm,
        '<span class="error">$1</span>$2'
    )

    .replace(
        /^(.*?PHP Fatal error.*?)(\r?\n|$)/gm,
        '<span class="error">$1</span>$2'
    )


}



    document.getElementById('btnFormat').style.display = isPlain ? 'none' : 'inline'
    document.getElementById('btnSimple').style.display = isSimple ? 'none' : 'inline'
    document.getElementById('btnDetail').style.display = isSimple ? 'inline' : 'none'

    // Call the function when the page has loaded
    window.addEventListener('DOMContentLoaded', (event) => {

        if (!isPlain) {
            formatJSON()
            formatAdhoc()
            if (isSimple) declutter()
        }
    
        console.log("page loaded")
     
    })


    function declutter() {  //eg mobile view

       const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has('simple')) {
            const classesToHide = 'timestamp unixfolder format-ip clutter'.split(' ')

            classesToHide.forEach(className => {
                const elements = document.getElementsByClassName(className)
                Array.from(elements).forEach(element => {
                    element.style.display = 'none'
                })
            })
        }
    }


    let refreshInterval

	async function refreshLog() {
        //console.log("refreshLog")
        
		let response = await fetch('./log.php?raw')
		let text = await response.text()
		document.getElementById('logContainer').innerHTML = text
        if (!isPlain) {
            formatJSON()
            formatAdhoc()
            declutter(isSimple)
        }

        if (isPaused) document.getElementById('banner').classList.add('logPause')

        window.scrollTo({
            top: document.body.scrollHeight,
            //behavior: 'smooth' // Optional: for smooth scrolling
          })

        //pause if user interacts
        document.querySelectorAll('#logContainer details').forEach(details => {
            details.addEventListener('toggle', function() {
                if (this.open) {
                    clearInterval(refreshInterval)
                    document.getElementById('btnPause').style.display = 'none'
                    document.getElementById('btnResume').style.display = 'inline'
                    document.getElementById('banner').classList.add('logPause')
                    isPaused = true
                    
                }
            })
        })
	}
    
        
    if (!isPaused) 
        refreshInterval  = setInterval(refreshLog, 1000)
    
    document.getElementById('btnPause').style.display  = isPaused ? 'none' : 'inline'
    document.getElementById('btnResume').style.display = isPaused ? 'inline' : 'none'
    

    refreshLog() // Load content initially
    
</script>
<?php

function detectDevice($userAgent) {
    $userAgent = strtolower($userAgent);

    // Regular expressions for different devices
    $devices = [
        'Windows' => '/windows nt/i',
        'Mac' => '/macintosh|mac os x/i',
        'iPhone' => '/iphone/i',
        'iPad' => '/ipad/i',
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