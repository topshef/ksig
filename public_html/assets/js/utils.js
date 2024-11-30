
    function removePrefixFromPublicKey(publicKey) {
        const prefix = "302a300506032b6570032100"
        return publicKey.startsWith(prefix) ? publicKey.replace(prefix, '') : publicKey
    }


    function base64ToHex(base64String) {
        // Decode Base64 to Binary
        const binaryString = atob(base64String)

        // Convert Binary to Hex
        const hexArray = Array.from(binaryString, (c) => {
            return ('0' + c.charCodeAt(0).toString(16)).slice(-2)
        })

        return hexArray.join('')
    }

    function hexToUint8Array(hexString) {
        var bytes = new Uint8Array(hexString.length / 2)
        for (var i = 0; i < bytes.length; i++)
            bytes[i] = parseInt(hexString.substr(i * 2, 2), 16)
        return bytes
    }
    
    function toHexString(byteArray) {
      return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2)
      }).join('')
    }


    async function sha256(message) {
        // Encode the string into Uint8Array
        const msgBuffer = new TextEncoder().encode(message)

        // Hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)

        // Convert the ArrayBuffer to string using hexadecimal representation
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        return hashHex
    }

 
    async function calcAccumulatedSeed(isHashSeed = true) {
        
        let seedText = (isHashSeed) ? await sha256(seedArray.sort().join('')) : seedArray.join('')
        // window.alert(`seedText ${seedText}`)

        if (!isHashSeed) {
            let isSeedPhrase = seedText.trim().split(/\s+/).length === 24 && /^[a-z\s]*$/.test(seedText) // roughly

            //if (isSeedPhrase) console.log("seed phrase detected: " + seedText)
            if (isSeedPhrase) seedText = await seedPhraseToPrivateKey(seedText)
        }

        document.getElementById("seed").textContent = seedText
        seed = hexToUint8Array(seedText)
        generateKeypair()
        if (autoSign && bodyBytesHex) signTransaction()
    } 