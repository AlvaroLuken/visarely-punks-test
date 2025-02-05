// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {console2} from "forge-std/console2.sol";
import {Script} from "forge-std/Script.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {VisarelyPunks} from "../contracts/VisarelyPunks.sol";
import {VisarelyTreasury} from "../contracts/VisarelyTreasury.sol";
import {VisarelyRenderer} from "../contracts/VisarelyRenderer.sol";
import {VisarelyGovernor} from "../contracts/VisarelyGovernor.sol";

contract DeployVisarelyContracts is Script {
    // Configuration constants
    uint256 constant TIMELOCK_MIN_DELAY = 2 days; // 172800 seconds
    address constant USDC_ADDRESS_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant AAVE_POOL_BASE = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Treasury first
        VisarelyTreasury treasury = new VisarelyTreasury(USDC_ADDRESS_BASE, AAVE_POOL_BASE);

        // 2. Deploy Renderer
        VisarelyRenderer renderer = new VisarelyRenderer();

        // 3. Deploy NFT contract
        VisarelyPunks punks = new VisarelyPunks(USDC_ADDRESS_BASE, address(treasury), address(renderer), AAVE_POOL_BASE);

        // 4. Set up Timelock Controller
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = deployer;

        TimelockController timelock = new TimelockController(
            TIMELOCK_MIN_DELAY,
            proposers,
            executors,
            deployer // admin
        );

        vm.stopBroadcast();

        // Log deployed addresses
        console2.log("Deployed contracts:");
        console2.log("Treasury:", address(treasury));
        console2.log("Renderer:", address(renderer));
        console2.log("Punks:", address(punks));
        console2.log("Timelock:", address(timelock));
    }
}
