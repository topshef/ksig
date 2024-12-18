# KSIG

$2 trillion of crypto assets are held in single key accounts. KSIG is an offline PWA and signing solution allowing anyone to benefit from Hedera’s highly secure, native multi-sig. KSIG eliminates “single point of failure” by decentralising risk, and opens the door to mass-market usability at all levels, from social account recovery to institutional asset management.

KSIG works entirely offline, including:
- Seed creation
- Cold storage (e.g., NFC)
- Air-gapped offline signing
- QR receipt/transmission of transactions and signatures

KSIG integrates with other ecosystem tools to provide a modular solution that’s ready to grow.  
Finally, DLT with decentralised key management that’s accessible to all.

Visit [ksig.uk](https://ksig.uk)

# Stack
KSIG PWA uses the following front-end libraries:

- **NaCl-fast**: Fast cryptographic library (NaCl implementation)  
- **Instascan**: QR code scanner library  
- **QRCode.js**: QR code generator library  
- **jQuery**: Frontend utility library for DOM manipulation and AJAX  
- **NDEFReader API**: NFC reader/writer native to browsers  

Additional integrations:

- **KSIG online widget**: Embedded into any website to enable KSIG  
- **KPOS (Kpay point-of-sale)**: API services  
- **Kpool/hashpool**: Mempool for off-chain Hedera transactions  
- **HAPI Hedera API services**: Via Node.js  
- **#Katomic script**: Used to demo transfers (hackathon prize winner 2023)

