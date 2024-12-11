<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KSIG</title>
    <?php require_once("cacheBusting.php"); ?><!-- cacheBusting.php -->
    <link rel="stylesheet" href="<?php echo getCacheBustedPath('assets/css/style.css'); ?>">
    <link rel="icon" id="favicon" type="image/svg+xml" href="./assets/img/ksig.ico">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
    <meta http-equiv="Pragma" content="no-cache"/>
    <meta http-equiv="Expires" content="0"/>
    
</head>

<body>
    <div class="container">
        <div style='width: max-content; margin:  0 auto 0 20px; '>
            <img src='./assets/img/ksig.uk.png' height='60px'>
        </div>
        <section>
          <h2>Create key</h2>
          <span class='feature'>
            <div class='row-buttons'>
               <button id="btnGenerateSeed" data-tooltip="Generate a new seed">
                   Generate Seed
               </button>
               <button id="btnWriteSeedNFC" data-tooltip="Write current seed to NFC tag">
                   Write Seed to NFC Tag
               </button>
            </div>
            <details>            
                <summary>Show QR</summary>
                <div id="seedQrCode" class="row">
                    <!-- QR code will be generated here -->
                </div>          
            </details>
          </span>
        </section>
        
        <section>
          <h2>Scan transaction</h2>
          <span class='feature'>
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
          </span>
        </section>
        <section>
          <h2>Scan seeds</h2>
          <span class='feature'>
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
          </span>
        </section>
        <section>
          <h2>View key</h2>
           <span class='feature'>
            <p>Public key ends in...</p>
            <mark><h1 id="publicKeyEnding"></h1></mark>
            <p id='publicKey'></p>
            <img src='assets/img/key.jpg' width="150px">
            <details>            
                <summary>View private key</summary>
                <textarea  type="text" id="seed" placeholder="Paste your private key here or scan seed(s)" rows="2" cols="100"></textarea>
            </details>
          </span>
        </section>
        <section>
          <h2>Sign transaction</h2>
          <span class='feature'>

            <button id="btnSignTx" data-tooltip="Sign the above transaction">
            <img src="assets/img/iconSignTx.png" alt="Sign"></button>

            <span id="qrcode">QR code</span>
            <p id="QRtext">QR text</p>       
          </span>
        </section>
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
    
    <script>
    
        document.addEventListener('DOMContentLoaded', () => {
            // Select all h2 elements
            const headers = document.querySelectorAll('.container > section > h2')

            headers.forEach(header => {
                header.addEventListener('click', () => {
                    // Find the sibling with class 'feature' and toggle 'hidden' class
                    const feature = header.nextElementSibling
                    if (feature && feature.classList.contains('feature')) {
                        feature.classList.toggle('hidden')

                        // Toggle 'open' class on the header
                        header.classList.toggle('open')
                    }
                })
            })
        })
    
    </script>
</body>
</html>
