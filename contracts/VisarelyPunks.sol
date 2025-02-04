// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VisarelyTreasury.sol";
import "./VisarelyRenderer.sol";

contract VisarelyPunks is ERC721, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeERC20 for IERC20;

    // Immutable addresses
    IERC20 public immutable USDC;
    VisarelyTreasury public immutable treasury;
    VisarelyRenderer public immutable renderer;
    
    // Core state
    address public founder;
    bool public founderControlActive;
    bool public dissolved;
    uint256 public mintPrice;
    uint256 public maxSupply;
    
    // Tracking
    uint256 public totalMinted;
    uint256 public totalBurned;
    mapping(uint256 => address) public tokenMinters;
    mapping(uint256 => bool) private _burned;
    mapping(address => EnumerableSet.UintSet) private tokensOwned;

    // Events
    event FounderControlSurrendered(uint256 timestamp);
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTRedeemed(address indexed from, uint256 indexed tokenId);

    modifier onlyFounder() {
        require(msg.sender == founder, "Not founder");
        _;
    }

    constructor(
        address _usdc, 
        address _treasury,
        address _renderer
    ) ERC721("VisarelyPunks", "VISA") {
        USDC = IERC20(_usdc);
        treasury = VisarelyTreasury(_treasury);
        renderer = VisarelyRenderer(_renderer);

        // ✅ **Check if on Base Sepolia or Ethereum Sepolia (chainId = 84532 or 11155111)**
        if (block.chainid == 84532 || block.chainid == 11155111) {
            mintPrice = 1 * 10**6; // 1 USDC for testnet
        } else {
            mintPrice = 500 * 10**6; // 500 USDC for mainnet
        }
        
        founder = msg.sender;
        founderControlActive = true;
        maxSupply = 2000;

        USDC.approve(address(treasury), type(uint256).max);
    }

    function mint() external nonReentrant {
        require(totalSupply() < maxSupply, "Max supply reached");
        require(!dissolved, "Contract dissolved");
        
        // Transfer USDC from the user directly to the treasury
        USDC.safeTransferFrom(msg.sender, address(treasury), mintPrice);

        // Call treasury deposit to supply to Aave
        treasury.deposit(mintPrice);

        uint256 tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        tokenMinters[tokenId] = msg.sender;
        
        emit NFTMinted(msg.sender, tokenId);
    }

    
    function redeem(uint256 tokenId) external nonReentrant {
        require(totalSupply() < maxSupply, "Redemption ended");
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(!dissolved, "Contract dissolved");

        treasury.withdraw(msg.sender, mintPrice);
        
        _burn(tokenId);
        _burned[tokenId] = true;
        totalBurned++;
        
        emit NFTRedeemed(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return renderer.tokenURI(tokenId, tokenMinters[tokenId]);
    }

    // DAO Functions
    function setMaxSupply(uint256 newMaxSupply) external {
        require(msg.sender == address(treasury.owner()), "Not governance");
        require(newMaxSupply >= totalSupply(), "Cannot reduce below current supply");
        maxSupply = newMaxSupply;
    }

    function setMintPrice(uint256 newPrice) external {
        require(msg.sender == address(treasury.owner()), "Not governance");
        require(newPrice > 0, "Price must be greater than 0");
        mintPrice = newPrice;
    }

    // Treasury Control
    function executeStrategy(address target, bytes calldata data) external {
        require(
            (msg.sender == founder && founderControlActive) || 
            msg.sender == treasury.owner(), 
            "Not authorized"
        );
        treasury.executeStrategy(target, data);
    }
    
    function surrenderFounderControl(address governor) external onlyFounder {
        require(founderControlActive, "Already surrendered");
        founderControlActive = false;
        treasury.transferOwnership(governor);
        emit FounderControlSurrendered(block.timestamp);
    }
    
    function dissolveDAO() external onlyFounder {
        require(!dissolved, "Already dissolved");
        dissolved = true;
        
        uint256 currentSupply = totalSupply();
        if (currentSupply > 0) {
            uint256 totalFunds = USDC.balanceOf(address(treasury));
            uint256 perNFTAmount = totalFunds / currentSupply;
            
            for (uint256 id = 1; id <= totalMinted; id++) {
                if (_exists(id)) {
                    treasury.withdraw(ownerOf(id), perNFTAmount);
                    _burnPunk(id);
                }
            }
        }
    }

    function emergencyDissolve() external onlyFounder {
        require(!dissolved, "Already dissolved");
        dissolved = true;
        
        uint256 totalFunds = USDC.balanceOf(address(treasury));
        treasury.withdraw(founder, totalFunds);
        
        for (uint256 id = 1; id <= totalMinted; id++) {
            if (_exists(id)) {
                _burnPunk(id);
            }
        }
    }

    // Self Destruct this NFT collection
    function selfDestructCollection() external onlyFounder {
        require(!dissolved, "Already dissolved"); // Ensure it runs only once
        dissolved = true; // Mark as dissolved to prevent re-entry

        uint256 totalFunds = USDC.balanceOf(address(this));

        // Burn all NFTs before contract destruction
        for (uint256 tokenId = 1; tokenId <= totalMinted; tokenId++) {
            if (_exists(tokenId)) {
                _burn(tokenId);
            }
        }

        // Destroy the contract and send any remaining ETH to the founder
        selfdestruct(payable(founder));
    }


    // Internal helpers
    function _exists(uint256 tokenId) internal view returns (bool) {
        return !_burned[tokenId] && tokenId <= totalMinted;
    }
    
    function _burnPunk(uint256 tokenId) internal {
        _burn(tokenId);
        _burned[tokenId] = true;
        totalBurned++;
    }
    
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = super._update(to, tokenId, auth);
        if (from != address(0)) tokensOwned[from].remove(tokenId);
        if (to != address(0)) tokensOwned[to].add(tokenId);
        return from;
    }
    
    function totalSupply() public view returns (uint256) {
        return totalMinted - totalBurned;
    }
}