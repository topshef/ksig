<?php

    // ╔═╗╔═╗╦  
    // ╠═╣║  ║  
    // ╩ ╩╚═╝╩═╝
    // ACL
	$ip = $_SERVER['REMOTE_ADDR'];
    $ipAllowed = explode(' ', '130.185.251.53 130.185.249.127 194.35.12.127');
	$isAllowed = in_array($ip, $ipAllowed);
	if (!$isAllowed) exit('denied');

?>