<?php

    require_once('ACL.php');
     
    // Check environment variable for log path, fall back to php.ini setting if not found.
    $pathlog = getenv('PHP_ERROR_LOG') ?: ini_get('error_log');

    // If no path or it's not writable, use a temp directory fallback.
    if (!$pathlog || !is_writable($pathlog)) 
        $pathlog = sys_get_temp_dir() . '/JY78764.php.fallback.log';

    // Set the error log to the determined or fallback path.
    ini_set('error_log', $pathlog);

    // html-friendly error logging
	function elog($message, $label = null) {

		$backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2);
		$file = $backtrace[0]['file'];
		$line = $backtrace[0]['line'];
        
        if (is_array($message) || is_object($message)) {
        
            $message = json_encode($message, JSON_PRETTY_PRINT);
            $message = preg_replace_callback('/\[\s*([\d,\s]+)\s*\]/', function($matches) {
                $innerContent = preg_replace('/\s+/', '', $matches[1]);
                return "[$innerContent]";
            }, $message);
            
            $message = htmlspecialchars($message, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $open = (!$label || strpos($label, '***') === false) ?  '' : ' open'; 
            
            $message = "\n<details $open><summary>$label</summary>$message</details>";
        } else $message = "$label $message";
        
        $ip = $_SERVER['REMOTE_ADDR'];
        $out = "$ip $file Line $line $message";
                
		return error_log($out);
	}
    
?>