<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KSIG</title>
    <?php require_once("cacheBusting.php"); ?><!-- cacheBusting.php -->
    <link rel="stylesheet" href="<?php echo getCacheBustedPath('assets/css/style.css'); ?>">
    <link rel="icon" id="favicon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='purple'/></svg>">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
    <meta http-equiv="Pragma" content="no-cache"/>
    <meta http-equiv="Expires" content="0"/>
    
</head>

<body>
    <div class="container">

        <section>Scan transaction</section>

            <div class="row-buttons">            
                <button id="btnScanTx" data-tooltip="Scan a transaction before signing it">
                    <img src="assets/img/iconScanQR.png" alt="Scan">
                </button>
            </div>
            
            <textarea  type="text" id="bodyBytesHex" placeholder="transaction body bytes in hex" rows="7">
            </textarea>

            <mark>
                <p id='bodyBytesChecksum'></p>
            </mark>
            
        <section>Scan seeds</section>
           <div id="seedInputButtons" class="row-buttons">
                <button id="btnScanSeedNFC" data-tooltip="Scan seed from NFC tag">
                    <img src="assets/img/iconScanSeedNFC.svg" alt="Scan NFC">
                </button>
                <button id="btnScanSeedQR" data-tooltip="Scan seed from QR code">
                    <img src="assets/img/iconScanQR.png" alt="Scan QR">
                </button>
                <button id="btnEnterSeedManual" data-tooltip="Enter seed manually">
                    <img src="assets/img/iconEnterSeedManual.png" alt="Enter Manually">
                </button>
            </div>          
            <div class='row'>
                <input id="isHashSeed" type="checkbox" checked  data-tooltip="Untick to read plain keys, or tick to hash each seed input">
                <label for="isHashSeed">Hash seeds</label>
            </div>
            
            <div class='row'>
                <p><span id='seedCounter'>0</span> scans completed</p>&nbsp&nbsp
                <button id="btnClearSeed">Clear</button>
            </div>       
     
            <p id='seedList'></p>

            <p>Public key ends in...</p>
            <mark><h1 id="publicKeyEnding"></h1></mark>
            <p id='publicKey'></p>
            <img src='assets/img/key.jpg' width="150px">
            <details>            
                <summary>View private key</summary>
                <textarea  type="text" id="seed" placeholder="Paste your private key here or scan seed(s)" rows="2" cols="100"></textarea>
            </details>
            
        <section>Sign transaction</section>

            <button id="btnSignTx" data-tooltip="Sign the above transaction">
            <img src="assets/img/iconSignTx.png" alt="Sign"></button>
       
       
    </div>

    <!-- QR modal -->
    <div id="qr_scanner" class="modal">   
        <span id="preview-close">&times;</span>
        <video id='preview'></video>
    </div>
        
    <script src="assets/js/jquery-3.6.0.min.js"></script>
    <script src="assets/js/instascan.min.js"></script> 
    <script src="assets/js/qrcode.min.js"></script>
    <script src="assets/js/nacl-fast.min.js"></script>    

    <script src="assets/js/utils.js"></script>
    <script src="assets/js/ksig.js"></script>
    
</body>
</html>
