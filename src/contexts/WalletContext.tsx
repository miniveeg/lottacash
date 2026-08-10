import { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { SOLANA_NETWORK } from '../lib/connection'

import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const network =
    SOLANA_NETWORK === 'devnet' ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet

  const endpoint = useMemo(() => {
    const custom = import.meta.env.VITE_SOLANA_RPC_URL as string | undefined
    if (custom && custom.length > 0) return custom
    return network === WalletAdapterNetwork.Devnet
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com'
  }, [network])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}