import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
    // ✅ Load environment variables
    const { ETH_SEPOLIA_RPC_URL, ETH_SEPOLIA_PRIVATE_KEY, ETH_SEPOLIA_USDC_ADDRESS, ETH_SEPOLIA_AAVE_POOL_ADDRESS } =
        process.env;

    if (!ETH_SEPOLIA_RPC_URL || !ETH_SEPOLIA_PRIVATE_KEY) {
        throw new Error("Please set your ETH_SEPOLIA_RPC_URL and ETH_SEPOLIA_PRIVATE_KEY in the .env file.");
    }

    // ✅ Connect to Sepolia provider
    const provider = new ethers.providers.JsonRpcProvider(ETH_SEPOLIA_RPC_URL);

    // ✅ Create wallet instance using deployer's private key
    const wallet = new ethers.Wallet(ETH_SEPOLIA_PRIVATE_KEY, provider);

    console.log("🚀 Deploying contracts with account:", wallet.address);

    // ✅ Load contract ABIs & bytecodes from Hardhat artifacts
    const contractsPath = path.join(__dirname, "../artifacts/contracts");

    const VisarelyTreasuryArtifact = JSON.parse(
        fs.readFileSync(`${contractsPath}/VisarelyTreasury.sol/VisarelyTreasury.json`, "utf8")
    );

    const VisarelyRendererArtifact = JSON.parse(
        fs.readFileSync(`${contractsPath}/VisarelyRenderer.sol/VisarelyRenderer.json`, "utf8")
    );

    const VisarelyPunksArtifact = JSON.parse(
        fs.readFileSync(`${contractsPath}/VisarelyPunks.sol/VisarelyPunks.json`, "utf8")
    );

    // ✅ Function to get the latest nonce
    async function getLatestNonce() {
        const nonce = await wallet.getTransactionCount("latest"); // Ensure real-time nonce
        console.log(`📌 Using nonce: ${nonce}`);
        return nonce;
    }

    let nonce = await getLatestNonce();

    // ✅ **Set up contract factories**
    const TreasuryFactory = new ethers.ContractFactory(
        VisarelyTreasuryArtifact.abi,
        VisarelyTreasuryArtifact.bytecode,
        wallet
    );

    const RendererFactory = new ethers.ContractFactory(
        VisarelyRendererArtifact.abi,
        VisarelyRendererArtifact.bytecode,
        wallet
    );

    const PunksFactory = new ethers.ContractFactory(
        VisarelyPunksArtifact.abi,
        VisarelyPunksArtifact.bytecode,
        wallet
    );

    // ✅ **Step 1: Deploy Treasury WITHOUT Punks Address**
    console.log("🔹 Deploying VisarelyTreasury...");
    const treasury = await TreasuryFactory.deploy(ETH_SEPOLIA_USDC_ADDRESS, ETH_SEPOLIA_AAVE_POOL_ADDRESS, { nonce });
    console.log("⏳ Awaiting confirmations...");
    await treasury.deployed();
    console.log("✅ VisarelyTreasury deployed at:", treasury.address);
    nonce++; // Increment nonce for next transaction

    // ✅ **Step 2: Deploy Renderer**
    console.log("🔹 Deploying VisarelyRenderer...");
    const renderer = await RendererFactory.deploy({ nonce });
    console.log("⏳ Awaiting confirmations...");
    await renderer.deployed();
    console.log("✅ VisarelyRenderer deployed at:", renderer.address);
    nonce++;

    // ✅ **Step 3: Deploy Punks Contract (Now Treasury Exists)**
    console.log("🔹 Deploying VisarelyPunks...");
    const punks = await PunksFactory.deploy(
        ETH_SEPOLIA_USDC_ADDRESS,
        treasury.address,
        renderer.address,
        "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
        { nonce }
    );
    console.log("⏳ Awaiting confirmations...");
    await punks.deployed();
    console.log("✅ VisarelyPunks deployed at:", punks.address);
    nonce++;

    // ✅ **Step 4: Set Punks Address in Treasury**
    console.log("🔹 Linking Treasury to Punks...");
    const setPunksTx = await treasury.setPunksAddress(punks.address, { nonce });
    await setPunksTx.wait();
    console.log("✅ Treasury now recognizes Punks contract at:", punks.address);
    nonce++;

    // 🚨 **Founder retains control!**
    console.log("🛑 Treasury ownership remains with the founder at deployment.");
    console.log("🔥 Founder can later decide when to transfer ownership to the DAO.");

    console.log("🚀 Deployment Complete!");
}

// ✅ **Execute the script and handle errors**
main().catch((error) => {
    console.error("❌ Deployment Failed:", error);
    process.exitCode = 1;
});
