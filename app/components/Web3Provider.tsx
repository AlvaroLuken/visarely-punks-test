'use client'

import { WagmiProvider, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

/// When ready for mainnet, you'll just need to replace baseSepolia with base in the Web3Provider configuration.

const config = createConfig(
    getDefaultConfig({
        chains: [sepolia],
        walletConnectProjectId: 'b3aaf7f0ab0ac22709868bc1e4494bec',
        appName: "Visarely Punks",
        appDescription: "Generative art collection merging Vasarely with CryptoPunks",
    }),
);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}