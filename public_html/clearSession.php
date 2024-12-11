<?php

    require_once('ACL.php');
    
    // Start the session if it's not already started
    if (session_status() == PHP_SESSION_NONE)
        session_start();

    // Clear all session variables
    session_unset();

    // Destroy the session
    session_destroy();

    // Delete the session cookie (optional but recommended for complete session clearing)
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

?>