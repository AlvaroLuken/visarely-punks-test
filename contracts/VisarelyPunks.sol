// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import { VisarelyTreasury } from "./VisarelyTreasury.sol";
import { VisarelyRenderer } from "./VisarelyRenderer.sol";

contract VisarelyPunks is ERC721, ReentrancyGuard, IERC2981 {
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeERC20 for IERC20;

    // Royalty fee constant (2.5%)
    uint96 private constant ROYALTY_FEE = 250;
    uint256 public constant REDEMPTION_TAX = 1000; // 10% (using basis points: 1000/10000)

    // Immutable addresses
    IERC20 public immutable USDC;
    IERC20 public immutable aToken;
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
        address _renderer,
        address _aToken
    ) ERC721("VisarelyPunks", "VISA") {
        USDC = IERC20(_usdc);
        aToken = IERC20(_aToken);
        treasury = VisarelyTreasury(payable(_treasury));
        renderer = VisarelyRenderer(_renderer);

        if (block.chainid == 84532 || block.chainid == 11155111) {
            mintPrice = 1 * 10**6; // 1 USDC for testnet
            maxSupply = 20;
        } else {
            mintPrice = 500 * 10**6; // 500 USDC for mainnet
            maxSupply = 2000;
        }
        
        founder = msg.sender;
        founderControlActive = true;

        USDC.approve(address(treasury), type(uint256).max);
    }

    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(tokenId), "Token does not exist");
        return (address(treasury), (salePrice * ROYALTY_FEE) / 10000);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function mint() external nonReentrant {
        require(totalSupply() < maxSupply, "Max supply reached");
        require(!dissolved, "Contract dissolved");
        
        USDC.safeTransferFrom(msg.sender, address(treasury), mintPrice);
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

        // Calculate tax and redemption amount
        uint256 taxAmount = (mintPrice * REDEMPTION_TAX) / 10000;
        uint256 redemptionAmount = mintPrice - taxAmount;

        // Withdraw redemption amount to user, tax stays in treasury
        treasury.withdraw(msg.sender, redemptionAmount);
        
        _burn(tokenId);
        _burned[tokenId] = true;
        totalBurned++;
        
        emit NFTRedeemed(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return renderer.tokenURI(tokenId, tokenMinters[tokenId]);
    }

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
            uint256 directBalance = USDC.balanceOf(address(treasury));
            uint256 aaveBalance = aToken.balanceOf(address(treasury));

            uint256 totalFunds = directBalance + aaveBalance;
            require(totalFunds > 0, "No funds available");

            uint256 perNFTAmount = totalFunds / currentSupply;

            for (uint256 id = 1; id <= totalMinted; id++) {
                if (_exists(id)) {
                    address nftOwner = ownerOf(id);

                    if (aaveBalance > 0) {
                        treasury.withdraw(nftOwner, perNFTAmount);
                    }

                    if (directBalance > 0) {
                        USDC.safeTransfer(nftOwner, perNFTAmount);
                    }

                    _burnPunk(id);
                }
            }
        }
    }

    function emergencyDissolve() external onlyFounder {
        require(!dissolved, "Already dissolved");
        dissolved = true;

        uint256 directBalance = USDC.balanceOf(address(treasury));
        uint256 aaveBalance = aToken.balanceOf(address(treasury));

        uint256 totalFunds = directBalance + aaveBalance;
        require(totalFunds > 0, "No funds available");

        if (aaveBalance > 0) {
            treasury.withdraw(founder, aaveBalance);
        }

        if (directBalance > 0) {
            USDC.safeTransfer(founder, directBalance);
        }

        for (uint256 id = 1; id <= totalMinted; id++) {
            if (_exists(id)) {
                _burnPunk(id);
            }
        }
    }

    function selfDestructCollection() external onlyFounder {
        require(!dissolved, "Already dissolved");
        dissolved = true;

        uint256 directBalance = USDC.balanceOf(address(this));
        uint256 aaveBalance = aToken.balanceOf(address(treasury));

        uint256 totalFunds = directBalance + aaveBalance;
        require(totalFunds > 0, "No funds available");

        if (aaveBalance > 0) {
            treasury.withdraw(founder, aaveBalance);
        }

        if (directBalance > 0) {
            USDC.safeTransfer(founder, directBalance);
        }

        for (uint256 tokenId = 1; tokenId <= totalMinted; tokenId++) {
            if (_exists(tokenId)) {
                _burn(tokenId);
            }
        }
    }

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