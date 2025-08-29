<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KSIG</title>
    <?php require_once("cacheBusting.php"); ?><!-- cacheBusting.php -->
    <!--<link rel="stylesheet" href="assets/css/style.css">-->
    <link rel="stylesheet" href="<?php echo getCacheBustedPath('assets/css/style.css'); ?>">
    <link rel="icon" id="favicon" type="image/svg+xml" href="./assets/img/ksig.ico">
    <link rel="manifest" href="manifest.json">

    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
    <meta http-equiv="Pragma" content="no-cache"/>
    <meta http-equiv="Expires" content="0"/>
    
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
          .then(() => console.log('Service Worker Registered'))
          .catch(error => console.error('Service Worker Registration Failed:', error))
      }
    </script>
    
</head>

<body>
    <div class="container">
        <div style='width: max-content; margin:  0 auto 0 20px; '>
            <a href='hh24'><img src='./assets/img/ksig.uk.png' height='60px'></a>
        </div>
        

        <div class="tabs" style="text-align: center; margin-bottom: 20px;">
            <a href="?showFeatures=section_create_seed,section_scan_seed" class="tab selected">Key Management</a>
            <a href="?showFeatures=section_scan_tx,section_scan_seed,section_scansign_tx" class="tab">Signing</a>
        </div>

        
        <section id='section_create_seed'>
          <h2>Generate new seeds</h2>
          <span class='feature'>
            <div class='row-buttons'>
            
            
                <button id="btnGenerateSeed" data-tooltip="Generate a new seed">
                    <img src="assets/img/newseed.png" alt="Scan">
                </button>           
                
                <button id="btnWriteSeedNFC" data-tooltip="Save your seed to an NFC tag">
                    <img src="assets/img/saveseednfc.png" alt="Scan">
                </button>            
            
            </div>
            <details id='showPrivateQR' class='hidden'>            
                <summary>Show QR ⚠️ private</summary>
                <div id="seedQrCode" class="row">
                    <!-- QR code will be generated here -->
                </div>          
            </details>
          </span>
        </section>
        

        <section id='section_scan_seed'>
          <h2>Assemble key</h2>
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


            <p>Public key ends in...</p>
            <mark><h1 id="publicKeyEnding"></h1></mark>
            <p id='publicKey'></p>

            <details>
                <summary>Show QR of public key</summary>
                <div id="publicKeyQrCode" class="row">
                    <!-- QR code will be generated here -->
                </div>
            </details>

            <img src='assets/img/key.jpg' width="150px">
            <details>            
                <summary>⚠ View private key</summary>
                <textarea  type="text" id="seed" placeholder="Paste your private key here or scan seed(s)" rows="2" cols="100"></textarea>
            </details>
          </span>
        </section>
        
        <section id='section_scansign_tx'>
          <h2>Scan & Sign</h2>
          <span class='feature'>
            <div class="row-buttons">            
                <button id="btnScanTx" data-tooltip="Scan a transaction before signing it">
                    <img src="assets/img/iconScanQR.png" alt="Scan">
                </button>
            </div>
            <details>
              <summary>Show content</summary>
                          
                <textarea  type="text" id="bodyBytesHex" placeholder="transaction body bytes in hex" rows="7">
                </textarea>

                <mark>
                    <p id='bodyBytesChecksum'></p>
                </mark>
            </details>

            <p id="confirmMessage"></p>
            <button id="btnSignTx" data-tooltip="Sign the above transaction">
            <img src="assets/img/iconSignTx.png" alt="Sign"></button>

            <span id="qrcode">QR code</span>
            
            <details>
              <summary>Show signed data</summary>
                <p id="QRtext">QR text</p>       
            </details>
            
          </span>
        </section>
    </div>

    <!-- Provide a manual install button -->
    <HR>
    <div style="text-align:center;margin-top:20px;">
      <button id="btnInstallPWA" class="basic-button">Install App</button>
    </div>
    
    <!-- QR modal -->
    <div id="qr_scanner" class="modal">   
        <span id="preview-close">&times;</span>
        <video id='preview'></video>
    </div>
        
    <script src="remoteLogger.js"></script>    
    <script src="assets/js/jquery-3.6.0.min.js"></script>
    <script src="assets/js/instascan.min.js"></script> 
    <script src="assets/js/qrcode.min.js"></script>
    <script src="assets/js/nacl-fast.min.js"></script>    

    <script src="assets/js/utils.js"></script>
    <!--<script src="assets/js/ksig.js"></script> -->
    <script src="<?php echo getCacheBustedPath('assets/js/ksig.js'); ?>"></script>
    
    
    <script>
    
        // UI related scripts. can be moved to ksig.js but not critical
        
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
            
            
            addPrivateKeyConfirmation()
            showFeaturesBasedOnUrl()
            highlightSelectedTab()

        })

        function highlightSelectedTab() {
            const urlParams = new URLSearchParams(window.location.search)
            const currentFeatures = urlParams.get('showFeatures') || ''
            const currentFeaturesSet = new Set(currentFeatures.split(','))

            document.querySelectorAll('.tabs .tab').forEach(tab => {
                tab.classList.remove('selected')
                const tabUrl = new URL(tab.href, window.location.origin)
                const tabFeatures = tabUrl.searchParams.get('showFeatures') || ''
                const tabFeaturesSet = new Set(tabFeatures.split(','))
                // Check if sets are the same
                if (tabFeaturesSet.size === currentFeaturesSet.size && 
                    [...tabFeaturesSet].every(f => currentFeaturesSet.has(f))) {
                    tab.classList.add('selected')
                }
            })
        }


                
        function addPrivateKeyConfirmation() {
            document.querySelectorAll('details').forEach(details => {
                const summary = details.querySelector('summary')
                if (summary?.textContent.toLowerCase().includes('private')) {
                    summary.addEventListener('click', e => {
                        if (!details.open) { // Only intercept the open action
                            e.preventDefault() // Prevent default toggle behavior
                            if (confirm('⚠️ WARNING: This is secret information, ensure no-one can see or record your screen. Proceed to reveal?'))
                                details.open = true // Manually open if user confirms
                        }
                    })
                }
            })
        }


        function showFeaturesBasedOnUrl() {
            // Parse the URL for the `showFeatures` parameter
            const urlParams = new URLSearchParams(window.location.search)
            const showFeatures = urlParams.get('showFeatures')

            if (!showFeatures) return
            const allowedFeatures = showFeatures.split(',') // Split the parameter into an array

            document.querySelectorAll('.container > section').forEach(section => {
                // If the section's ID is not in the allowed list, hide it
                if (!allowedFeatures.includes(section.id))
                    section.style.display = 'none'
            })
        }

    
    </script>

    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').then(reg => {
          reg.onupdatefound = () => {
            const installingWorker = reg.installing
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  const reload = confirm('New update available. Reload now?')
                  if (reload) {
                    installingWorker.postMessage('skipWaiting')
                    window.location.reload()
                  }
                } else {
                  console.log('Content is now available offline!')
                }
              }
            }
          }
        })
      }
              
              
      let deferredPrompt
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault()
        deferredPrompt = event
      })

      document.getElementById('btnInstallPWA').addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          deferredPrompt.userChoice.then(choiceResult => {
            deferredPrompt = null
          })
        } else {
          console.log('Install prompt not available yet')
        }
      })
      
      
        const installButton = document.getElementById('btnInstallPWA')
        if (window.matchMedia('(display-mode: standalone)').matches) {
        installButton.style.display = 'none'
        }

        window.addEventListener('appinstalled', () => {
        installButton.style.display = 'none'
        })      
    </script>

    

</body>
</html>
