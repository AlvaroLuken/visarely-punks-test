// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";

contract VisarelyTreasury {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;
    IPool public aavePool;
    address public owner;

    event StrategyExecuted(address target, bytes data);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc, address _aavePool) {
        USDC = IERC20(_usdc);
        aavePool = IPool(_aavePool);
        owner = msg.sender;

        // ✅ Set max approval for Aave Pool once on deployment
        USDC.approve(address(aavePool), type(uint256).max);
    }

    function deposit(uint256 amount) external {
        require(msg.sender == owner || msg.sender == address(punks), "Not authorized");
        require(amount > 0, "Amount must be greater than 0");
        require(USDC.balanceOf(address(this)) >= amount, "Insufficient USDC balance");

        // ✅ Ensure approval is set before depositing into Aave
        if (USDC.allowance(address(this), address(aavePool)) < amount) {
            USDC.approve(address(aavePool), type(uint256).max);
        }

        aavePool.supply(address(USDC), amount, address(this), 0);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");

        // ✅ Withdraw directly from Aave
        aavePool.withdraw(address(USDC), amount, to);
    }

    function withdrawForFounder(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");

        uint256 contractBalance = USDC.balanceOf(address(this));
        uint256 totalAvailable = contractBalance;

        // ✅ Withdraw from Aave if contract balance is not enough
        if (contractBalance < amount) {
            uint256 remainingAmount = amount - contractBalance;

            // ✅ Withdraw whatever Aave allows
            uint256 withdrawnAmount = aavePool.withdraw(address(USDC), remainingAmount, address(this));
            totalAvailable += withdrawnAmount;
        }

        require(totalAvailable >= amount, "Insufficient funds available");

        // ✅ Transfer funds to founder
        USDC.safeTransfer(to, amount);
    }

    function executeStrategy(address target, bytes calldata data) external onlyOwner {
        (bool success,) = target.call(data);
        require(success, "Strategy failed");
        emit StrategyExecuted(target, data);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
