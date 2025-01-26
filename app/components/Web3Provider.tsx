'use client'

import { WagmiProvider, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

/// When ready for mainnet, you'll just need to replace baseSepolia with base in the Web3Provider configuration.

const config = createConfig(
    getDefaultConfig({
        // Only Base Sepolia testnet
        chains: [baseSepolia],

        // Required API Keys
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',

        // Required App Info
        appName: "Visarely Punks",

        // Optional App Info
        appDescription: "Generative art collection merging Vasarely with CryptoPunks",
        appUrl: "https://your-website.com",
        appIcon: "/images/logo.png",
    }),
);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider 
                    customTheme={{
                        "--ck-overlay-backdrop-filter": "blur(8px)",
                    }}
                    options={{
                        initialChainId: baseSepolia.id,
                        hideBalance: true,
                        hideTooltips: true,
                        enforceSupportedChains: true,
                        // Custom message when wrong network
                        walletConnectName: "WalletConnect",
                        disclaimer: "Please switch to Base Sepolia Testnet to mint NFTs",
                    }}
                >
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}