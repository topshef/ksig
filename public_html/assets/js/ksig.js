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
        config: {},

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
            
            // Close modal when clicking the close button
            document.getElementById('preview-close').onclick = () => this.closeModal()

            // Close modal when clicking outside of it
            window.addEventListener('click', (event) => {
                if (event.target === document.getElementById('qr_scanner')) this.closeModal()
            })
            
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
                // await this.updateSeedList(content, isHashSeed)
                // await this.calcAccumulatedSeed(isHashSeed)
                return
            }
            
            if (sourceTrigger === 'btnScanTx') {
                // Handle transaction data
                this.bodyBytesBase64 = content
                this.bodyBytesHex = this.base64ToHex(this.bodyBytesBase64)
                this.bodyBytes = this.hexToUint8Array(this.bodyBytesHex)

                 // Update UI elements
                await this.updateTransactionUI(this.bodyBytesHex)
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

        handleSeedContent() {},
        calcAccumulatedSeed() {},


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
        
        
        // ╦ ╦╦  ┬ ┬┌─┐┌┬┐┌─┐┌┬┐┌─┐┌─┐
        // ║ ║║  │ │├─┘ ││├─┤ │ ├┤ └─┐
        // ╚═╝╩  └─┘┴  ─┴┘┴ ┴ ┴ └─┘└─┘
        // UI updates
        updateSeedList() {},

        async updateTransactionUI(bodyBytesHex) {
            document.getElementById('bodyBytesHex').textContent = bodyBytesHex

            const checksum = (await sha256(bodyBytesHex)).substring(0, 4).toUpperCase()
            document.getElementById('bodyBytesChecksum').innerHTML = 
                `Checksum: ${checksum} ⚠️ ensure this matches`
            document.getElementById('bodyBytesHex').style.display = 'block'
        }

        
    }

    window.KSIG = KSIG
    KSIG.init()
})()
