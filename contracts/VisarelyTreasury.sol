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
    address public punks;

    event StrategyExecuted(address target, bytes data);
    event ETHReceived(address indexed from, uint256 amount);
    event ETHWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == punks, "Not authorized");
        _;
    }

    // Allow contract to receive ETH
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    fallback() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    constructor(address _usdc, address _aavePool) {
        USDC = IERC20(_usdc);
        aavePool = IPool(_aavePool);
        owner = msg.sender;
        USDC.approve(address(aavePool), type(uint256).max);
    }

    // Existing USDC functions remain the same
    function deposit(uint256 amount) external {
        require(msg.sender == owner || msg.sender == punks, "Not authorized");
        require(amount > 0, "Amount must be greater than 0");
        require(USDC.balanceOf(address(this)) >= amount, "Insufficient USDC balance");

        if (USDC.allowance(address(this), address(aavePool)) < amount) {
            USDC.approve(address(aavePool), type(uint256).max);
        }
        
        aavePool.supply(address(USDC), amount, address(this), 0);
    }

    function withdraw(address to, uint256 amount) external {
        require(msg.sender == owner || msg.sender == punks, "Not authorized");
        require(amount > 0, "Amount must be greater than 0");
        aavePool.withdraw(address(USDC), amount, to);
    }

    function withdrawForFounder(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");

        uint256 contractBalance = USDC.balanceOf(address(this));
        uint256 totalAvailable = contractBalance;

        if (contractBalance < amount) {
            uint256 remainingAmount = amount - contractBalance;
            uint256 withdrawnAmount = aavePool.withdraw(address(USDC), remainingAmount, address(this));
            totalAvailable += withdrawnAmount;
        }

        require(totalAvailable >= amount, "Insufficient funds available");
        USDC.safeTransfer(to, amount);
    }

    // New ETH handling functions
    function withdrawETH(address payable to, uint256 amount) external onlyAuthorized {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient ETH balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit ETHWithdrawn(to, amount);
    }

    function withdrawAllETH(address payable to) external onlyAuthorized {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH balance");
        
        (bool success, ) = to.call{value: balance}("");
        require(success, "ETH transfer failed");
        emit ETHWithdrawn(to, balance);
    }

    // Add emergency token recovery
    function rescueToken(IERC20 token, address to, uint256 amount) external onlyAuthorized {
        token.safeTransfer(to, amount);
    }

    // View functions for balances
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUSDCBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }

    function getAaveUSDCBalance() external view returns (uint256) {
        // This assumes the aToken address can be retrieved from the pool
        address aTokenAddress = aavePool.getReserveData(address(USDC)).aTokenAddress;
        return IERC20(aTokenAddress).balanceOf(address(this));
    }

    // Existing administrative functions
    function executeStrategy(address target, bytes calldata data) external onlyOwner {
        (bool success,) = target.call(data);
        require(success, "Strategy failed");
        emit StrategyExecuted(target, data);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function setPunksAddress(address _punks) external onlyOwner {
        require(punks == address(0), "Punks already set");
        punks = _punks;
    }
}