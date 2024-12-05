;(function () {
    const KSIG = {
        
        // ┌─┐┌─┐┌─┐  ┌─┐┌┬┐┌─┐┌┬┐┌─┐
        // ├─┤├─┘├─┘  └─┐ │ ├─┤ │ ├┤ 
        // ┴ ┴┴  ┴    └─┘ ┴ ┴ ┴ ┴ └─┘
        // App State
        isScannerActive: false,
        scanner: null,
        seedArray: [],

        // ┌─┐┌─┐┌┐┌┌─┐┬┌─┐
        // │  │ ││││├┤ ││ ┬
        // └─┘└─┘┘└┘└  ┴└─┘
        // config
        config: {
            autoSign: new URLSearchParams(window.location.search).get('autoSign') ?? true
            // autosign: true  // automatically sign tx after reading seeds
        },

        // ┬┌┐┌┬┌┬┐
        // │││││ │ 
        // ┴┘└┘┴ ┴ 
        // init
        init() {
            this.initScanner()
            this.addEventListeners()
        },


        // **Initialize Scanner**
        initScanner() {
            this.scanner = new Instascan.Scanner({
                video: document.getElementById('preview'),
                scanPeriod: 2,
                mirror: false
            })
        },
        
        // ┌─┐┬  ┬┌─┐┌┐┌┌┬┐  ┬  ┬┌─┐┌┬┐┌─┐┌┐┌┌─┐┬─┐┌─┐
        // ├┤ └┐┌┘├┤ │││ │   │  │└─┐ │ ├┤ │││├┤ ├┬┘└─┐
        // └─┘ └┘ └─┘┘└┘ ┴   ┴─┘┴└─┘ ┴ └─┘┘└┘└─┘┴└─└─┘
        // event listeners
        addEventListeners() {
            // Button to QR scan transaction
            document.getElementById('btnScanTx').addEventListener('click', (event) => this.startQrScanning('btnScanTx'))
            
            // Button to QR scan seed(s)
            document.getElementById('btnScanSeedQR')?.addEventListener('click', (event) => this.startQrScanning('btnScanSeedQR'))

            // Clear seed data
            document.getElementById("btnClearSeed").addEventListener("click", () => this.clearSeedData())
            
            // Close modal when clicking the close button
            document.getElementById('preview-close').onclick = () => this.closeModal()

            // Close modal when clicking outside of it
            window.addEventListener('click', (event) => {
                if (event.target === document.getElementById('qr_scanner')) this.closeModal()
            })

            // sign tx or any message
            document.getElementById("btnSignTx").addEventListener("click", () => this.signTransaction())


            
        },


        // **Start QR Scanning**
        startQrScanning(sourceTrigger) {
            if (this.isScannerActive) return

            const modal = document.getElementById('qr_scanner')
            modal.style.display = 'block'

            Instascan.Camera.getCameras()
                .then((cameras) => {
                    if (cameras.length === 0)
                        return alert('No cameras found.')

                    // Find rear camera if available
                    let rearCamera = cameras.find((camera) => camera.name.toLowerCase().includes('back'))

                    // Start the appropriate camera
                    if (rearCamera) 
                         this.scanner.start(rearCamera)
                    else this.scanner.start(cameras[0])

                    this.isScannerActive = true

                    // Remove any existing listeners to prevent duplicates
                    this.scanner.removeAllListeners('scan')

                    // Add listener for scan event
                    this.scanner.addListener('scan', async (content) => {
                        await this.handleScannedContent(content, sourceTrigger)
                        this.scanner.stop()
                        this.isScannerActive = false
                        modal.style.display = 'none'
                    })
                })
                .catch((e) => {
                    console.error(e)
                    alert('Error: ' + e)
                })
        },


        // **Handle Scanned Content**
        async handleScannedContent(content, sourceTrigger) {
            console.log('Scanned content:', content)
            console.log(`sourceTrigger=${sourceTrigger}`)

            if (sourceTrigger === 'btnScanSeedQR') {
                const isHashSeed = document.getElementById('isHashSeed').checked
                await this.updateSeedList(content, isHashSeed)
                const seed = await this.calcAccumulatedSeed(isHashSeed)
                // console.log("seed=", seed)
                this.generateKeypair(seed)
                if (this.config.autoSign && this.bodyBytes) this.signTransaction()
                
                return
            }
            
            if (sourceTrigger === 'btnScanTx') {
                // Handle transaction data
                this.bodyBytesBase64 = content // todo verify this
                this.bodyBytesHex = this.base64ToHex(this.bodyBytesBase64)
                this.bodyBytes = this.hexToUint8Array(this.bodyBytesHex)

                // generate checksum based on base64 data
                const checksum = (await sha256(content)).substring(0, 4).toUpperCase()

                 // Update UI elements
                this.updateTransactionUI(this.bodyBytesHex, checksum)
                return
            } 
            alert('Unknown scan source ref JD98432') // random refs handy if user screenshots
        },


        // **Close Modal**
        closeModal() {
            const modal = document.getElementById('qr_scanner')
            modal.style.display = 'none'
            if (this.scanner) this.scanner.stop()
            this.isScannerActive = false
        },



        // ┌─┐┌─┐┬─┐┌─┐  ┬  ┌─┐┌─┐┬┌─┐
        // │  │ │├┬┘├┤   │  │ ││ ┬││  
        // └─┘└─┘┴└─└─┘  ┴─┘└─┘└─┘┴└─┘
        // core logic

        // **Update Seed List**
        async updateSeedList(seedPiece, isHashSeed = true) {
            
            const snippet = this.getSnippet(seedPiece)
     
            if (isHashSeed) seedPiece = await sha256(seedPiece)

            if (!this.seedArray.includes(seedPiece)) {
                this.seedArray.push(seedPiece)
                document.getElementById('seedList').innerHTML += `${snippet}<br>`
                document.getElementById('seedCounter').textContent = this.seedArray.length
            } else {
                alert('Already scanned: ' + snippet)
            }
        },


        getSnippet(seedPiece) {
            // Check if there's an explicit prefix using a slash
            const firstSlashIndex = seedPiece.indexOf('/')
            return (firstSlashIndex === -1) 
                ? seedPiece.substring(0, 5) // Take the first few characters
                : seedPiece.substring(0, firstSlashIndex) // Take everything up to the first slash
        },

        // **Calculate Accumulated Seed**
        async calcAccumulatedSeed(isHashSeed = true) {
            let seedText = (isHashSeed) 
                ? await sha256(this.seedArray.sort().join('')) 
                : this.seedArray.join('')
            // window.alert(`seedText ${seedText}`)

            if (!isHashSeed) {
                let isSeedPhrase = seedText.trim().split(/\s+/).length === 24 && /^[a-z\s]*$/.test(seedText) // roughly

                // if (isSeedPhrase) console.log("seed phrase detected: " + seedText)
                if (isSeedPhrase) seedText = await seedPhraseToPrivateKey(seedText)
            }

            document.getElementById("seed").textContent = seedText
            seed = this.hexToUint8Array(seedText)
            return seed

        },


        generateKeypair(seed) {
            if (!seed)
                return alert("Please generate a seed first!")

            // Generate a key pair from the seed
            this.keyPair = nacl.sign.keyPair.fromSeed(seed)

            // Construct public and private keys in hexadecimal format
            this.publicKeyHex = "302a300506032b6570032100" + this.byteArrayToHexString(this.keyPair.publicKey)
            this.privateKeyHex = this.byteArrayToHexString(seed)
            
            // Extract the last 4 characters of the public key for display
            const last3chars = this.publicKeyHex.slice(-4)

            // Update UI with the public key and its ending
            document.getElementById("publicKeyEnding").textContent = last3chars
            document.getElementById("publicKey").textContent = this.publicKeyHex.slice(-64)
        },


        // SIGN TX
        signTransaction() {    
            const bodyBytes = this.bodyBytes
            const keyPair = this.keyPair
            
            console.log(keyPair) 
            if (!bodyBytes) alert('missing bodyBytes')
                
            // Sign the bodyBytes
            const signature = nacl.sign.detached(bodyBytes, keyPair.secretKey)

            // Convert the signature to hex string
            const signatureHex = this.byteArrayToHexString(signature)

            // Display the QR
            QRtext = `${this.publicKeyHex} ${signatureHex}` 

            document.getElementById("QRtext").textContent = QRtext
            this.updateQR()
        },


        // ┬ ┬┌┬┐┬┬  ┌─┐
        // │ │ │ ││  └─┐
        // └─┘ ┴ ┴┴─┘└─┘
        // utils
        base64ToHex(base64String) {
            // Decode Base64 to Binary
            const binaryString = atob(base64String)

            // Convert Binary to Hex
            const hexArray = Array.from(binaryString, (c) => {
                return ('0' + c.charCodeAt(0).toString(16)).slice(-2)
            })

            return hexArray.join('')
        },
        
        hexToUint8Array(hexString) {
            var bytes = new Uint8Array(hexString.length / 2)
            for (var i = 0; i < bytes.length; i++)
                bytes[i] = parseInt(hexString.substr(i * 2, 2), 16)
            return bytes
        },

        byteArrayToHexString(byteArray) {
          return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2)
          }).join('')
        },
            
        // ╦ ╦╦  ┬ ┬┌─┐┌┬┐┌─┐┌┬┐┌─┐┌─┐
        // ║ ║║  │ │├─┘ ││├─┤ │ ├┤ └─┐
        // ╚═╝╩  └─┘┴  ─┴┘┴ ┴ ┴ └─┘└─┘
        // UI updates

        clearSeedData() {
            this.seedArray = []
            this.setHTML('seedList')
            this.setHTML('seedCounter', 0)
            this.setHTML('publicKeyEnding')
            this.setHTML('publicKey')
            this.setHTML('seed')
        },

        setHTML(id, value = '') {
            document.getElementById(id).innerHTML = value
        },

        updateTransactionUI(bodyBytesHex, checksum) {
            document.getElementById('bodyBytesHex').textContent = bodyBytesHex

            
            document.getElementById('bodyBytesChecksum').innerHTML = 
                `Checksum: ${checksum} ⚠️ ensure this matches`
            document.getElementById('bodyBytesHex').style.display = 'block'
        },
        
        updateQR() {
            // Clear the previous QR code
            const qrcodeElement = document.getElementById('qrcode')
            qrcodeElement.innerHTML = ''

            // Generate a new QR code
            new QRCode(qrcodeElement, {
                text: QRtext,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            })            
        }
            

        
    }

    window.KSIG = KSIG
    KSIG.init()
})()
