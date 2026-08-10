import { Buffer } from 'buffer'

// Solana web3 / wallet-adapter expect Buffer in the browser
;(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer