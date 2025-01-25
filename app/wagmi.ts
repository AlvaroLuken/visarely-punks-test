import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export function getConfig() {
    return createConfig({
        chains: [mainnet, base],
        connectors: [
            coinbaseWallet({ 
                appName: 'Your App Name',
                preference: 'smartWalletOnly'
            }),
        ],
        storage: createStorage({
            storage: cookieStorage,
        }),
        ssr: true,
        transports: {
            [mainnet.id]: http(),
            [base.id]: http(),
        },
    })
}

declare module 'wagmi' {
    interface Register {
        config: ReturnType<typeof getConfig>
    }
}
