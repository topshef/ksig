;(function () {
    const KSIG = {
        
        // ┌─┐┌─┐┌─┐  ┌─┐┌┬┐┌─┐┌┬┐┌─┐
        // ├─┤├─┘├─┘  └─┐ │ ├─┤ │ ├┤ 
        // ┴ ┴┴  ┴    └─┘ ┴ ┴ ┴ ┴ └─┘
        // App State
        isScannerActive: false,
        scanner: null,
        seedArray: [],

        // also support signing JWT eg for KPOP
        isJWT: false,
        jwtHeader: '',
        jwtPayload: '',

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
            
            // generate new seed
            // document.getElementById("btnGenerateSeed")?.addEventListener("click", () => this.generateSeed())
            
           document.getElementById('btnGenerateSeed')?.addEventListener('click', async (event) =>
            {
              await this.generateSeed()
            })            
            
            document.getElementById("btnWriteSeedNFC")?.addEventListener("click", () => this.writeSeedToNFC())
            
            // Button to QR scan transaction
            document.getElementById('btnScanTx').addEventListener('click', (event) => this.startQrScanning('btnScanTx'))
            
            //scan seed from NFC tag
            // document.getElementById('btnScanSeedNFC')?.addEventListener('click', (event) => this.scanSeedFromNFC())
            document.getElementById('btnScanSeedNFC')?.addEventListener('click', async (event) =>
            {
              await this.scanSeedFromNFC()
            })


            // Button to QR scan seed(s)
            document.getElementById('btnScanSeedQR')?.addEventListener('click', (event) => this.startQrScanning('btnScanSeedQR'))

            // manual entry            
            document.getElementById("btnEnterSeedManual")?.addEventListener("click", async (event) => {
                let content = prompt("Enter seed info")
                if (!content) return
                let isHashSeed = document.getElementById('isHashSeed').checked
                
                // todo review/refactor.. repetitive..
                await this.updateSeedList(content, isHashSeed)
                const seed = await this.calcAccumulatedSeed(isHashSeed)
                this.generateKeypair(seed)
            })
            

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
                console.log("seed=", seed)
                this.generateKeypair(seed)
                if (this.config.autoSign && this.bodyBytes) this.signTransaction()
                
                return
            }


            
            if (sourceTrigger === 'btnScanTx') {
              const isUnsignedJWT = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(content)

              if (isUnsignedJWT) {
                this.isJWT = true
                const [header, payload] = content.split('.')

                // Only sign header.payload, not the existing signature
                const signingInput = `${header}.${payload}`
                this.jwtHeader = header
                this.jwtPayload = payload
                this.bodyBytes = new TextEncoder().encode(signingInput)

                const checksum = (await sha256(signingInput)).substring(0, 4).toUpperCase()
                this.updateTransactionUI(signingInput, checksum)
              } else {
                this.isJWT = false
                const isValidBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(content) && content.length % 4 === 0
                if (!isValidBase64) {
                  alert('❌ Invalid base64 format. Please scan a valid transaction, or unsigned JWT.')
                  return
                }
                this.bodyBytesBase64 = content

                this.bodyBytesHex = this.base64ToHex(this.bodyBytesBase64)
                this.bodyBytes = this.hexToUint8Array(this.bodyBytesHex)

                const checksum = (await sha256(content)).substring(0, 4).toUpperCase()
                this.updateTransactionUI(this.bodyBytesHex, checksum)
              }
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
            
            // Generate QR code for the public key
            const publicKeyQrCodeElement = document.getElementById('publicKeyQrCode')
            publicKeyQrCodeElement.innerHTML = '' // Clear existing QR code
            new QRCode(publicKeyQrCodeElement, {
                text: this.publicKeyHex,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            })
        },


        // SIGN TX
        
        signTransaction() {
          const bodyBytes = this.bodyBytes
          const keyPair = this.keyPair

          if (!bodyBytes) return alert('No content to sign. Please scan a transaction or JWT')
          if (!keyPair) return alert('No key available. Please scan a key')
              

          const signature = nacl.sign.detached(bodyBytes, keyPair.secretKey)

          if (this.isJWT) {
            const sigB64url = btoa(String.fromCharCode(...signature))
              .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

            const jwt = `${this.jwtHeader}.${this.jwtPayload}.${sigB64url}`
            // QRtext = jwt
            QRtext = sigB64url
            // document.getElementById("QRtext").textContent = jwt
            document.getElementById("QRtext").textContent = sigB64url
          } else {
            const signatureHex = this.byteArrayToHexString(signature)
            QRtext = `${this.publicKeyHex} ${signatureHex}`
            document.getElementById("QRtext").textContent = QRtext
          }

          this.updateQR()
        },

        
        zzsignTransaction() {    
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


        async generateSeed() {
            const randomBytes = nacl.randomBytes(32)
            const seedText = this.byteArrayToHexString(randomBytes)
            document.getElementById("seed").textContent = seedText
            
            //to show the public key of an accumulator need call calcAccumulatedSeed etc
            // this.generateKeypair(randomBytes) // only does it as plain, not hashed
            const isHashSeed = document.getElementById('isHashSeed').checked
            await this.updateSeedList(seedText, isHashSeed)
            const seed = await this.calcAccumulatedSeed(isHashSeed)
            console.log("seed=", seed)
            this.generateKeypair(seed)
            
            // display QR code
            const qrCodeElement = document.getElementById("seedQrCode")
            qrCodeElement.innerHTML = "" // Clear any existing QR code
            new QRCode(qrCodeElement, {
                text: seedText,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            })

            // alert(`Yey! A new seed was generated\n\nNow save the QR or write to NFC tag`)
            
            document.getElementById('showPrivateQR').classList.remove('hidden')

        },

        async writeSeedToNFC() {
            const seed = document.getElementById("seed").textContent.trim()
            console.log(`seed=${seed}`)
            if (!seed) {
               alert("No seed found to write.")
               return
            }
            if ('NDEFReader' in window) {
               try {
                 const ndef = new NDEFReader()
                 await ndef.write({records: [{ recordType: "text", data: seed }]})
                 alert('Seed written to NFC tag.')
               } catch (error) {
                 console.error("JR32495 Error writing NFC tag: ", error)
                 alert('Error writing NFC tag.')
               }
            } else alert("NFC writing is not supported on this device.")
        },

        async scanSeedFromNFC() {
            alert('Tap some seed info to append')
            let message = await this.readNFC()
            if (message) {
                const isHashSeed = document.getElementById('isHashSeed').checked
                
                // await appendSeedData(message)
                const content = await this.getMessageFromNFCdata(message)
                await this.updateSeedList(content, isHashSeed)
                const seed = await this.calcAccumulatedSeed(isHashSeed)
                this.generateKeypair(seed)
                if (this.config.autoSign && this.bodyBytes) this.signTransaction()
            }
        },
    
        async readNFC() {
            if ('NDEFReader' in window) {
                const ndef = new NDEFReader()
                try {
                    await ndef.scan()
                    return new Promise((resolve, reject) => {
                        ndef.addEventListener("reading", ({ message }) => {
                            resolve(message)
                        })
                    })
                } catch (error) {
                    console.error("Error reading NFC tag: ", error)
                    alert('Error reading NFC tag.')
                }
            } else alert("NFC reading is not supported on this device.")
        },

        async getMessageFromNFCdata(message) {
            const decoder = new TextDecoder()
            for (const record of message.records) {
                let someMoreData = decoder.decode(record.data)
                // window.alert(`read data ${someMoreData}`)
                return someMoreData // only return first record
            }
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

            const label = (this.isJWT) ? 'JWT checksum' : 'Checksum'
            
            document.getElementById('bodyBytesChecksum').innerHTML = 
                `${label}: ${checksum} ⚠️ ensure this matches`
                
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
