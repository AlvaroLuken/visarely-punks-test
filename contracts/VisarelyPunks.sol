// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VisarelyPunks is ERC721 {
    using EnumerableSet for EnumerableSet.UintSet;
    using Strings for uint256;

    mapping(address => EnumerableSet.UintSet) tokensOwned;
    mapping(uint => address) public tokenMinters;
    
    uint public constant MAX_SUPPLY = 2000;
    uint public counter;

    error InvalidTokenId(uint tokenId);
    error OnlyOwner(address);
    error MaxSupplyReached();

    IERC20 public immutable USDC;
    uint256 public constant MINT_PRICE = 500_000_000; // 500 USDC (6 decimals)

    string[] private backgrounds = [
        "#638596", "#8e6fb6", "#95554f", "#75bf80", "#f2ac17", "#2165ef",
        "#FF69B4", "#4B0082", "#800080", "#FFD700", "#eb4fb0", "#edfef3", 
        "#b0e1f0", "#FFFFFF"
    ];

    string[] private faceColors = [
        // Human tones (60% = 1200)
        "#FFE4B5", "#F5DEB3", "#DEB887", "#D2B48C", "#BC8F8F", "#F4C2C2", 
        "#E5AA70", "#F5F5DC", "#FFF8DC", "#FAF0E6",
        // Zombie tones (15% = 300)
        "#90EE90", "#98FB98", "#7CCD7C",
        // Ape tones (15% = 300)
        "#8B4513", "#A0522D", "#6B4423",
        // Alien tones (10% = 200)
        "#00FF00", "#7FFF00"
    ];

    string[] private glassesStyles = [
        "3D", "3DPunk", "3DGold", "3DNeon", "3DRetro", "3DRainbow", "3DFuture",
        "VR", "VRGold", "VRDeluxe", "VRCyber", "VRNeon", "VRMatrix", "VRSpace",
        "Classic", "HornRimmed"
    ];

    string[] private hairStyles = [
        "None", "Straight", "Mohawk", "Spiky", "Curly", "Long", "Bun", 
        "Pigtails", "Afro", "Frumpy", "Wild"
    ];

    string[] private hairColors = [
        "#000000", "#FFFFFF", "#FFD700", "#FF69B4", "#4B0082", "#00FF00",
        "#FFA500", "#C0C0C0", "#8B4513", "#FF0000"
    ];

    string[] private eyeColors = [
        "#000000", "#0000FF", "#8B4513", "#4B0082", "#FFD700", "#FFFFFF"
    ];

    string[] private hatStyles = [
        "TopHat", "Santa", "Crown"
    ];

    constructor(address _usdc) ERC721("VisarelyPunks", "VPUNK") {
        USDC = IERC20(_usdc);
    }

    function mintTo(address _to) public {
        if (counter >= MAX_SUPPLY) revert MaxSupplyReached();
        
        // Handle USDC transfer in one transaction
        if (!USDC.transferFrom(msg.sender, address(this), MINT_PRICE)) {
            // If transfer fails, try approving and transferring
            USDC.approve(address(this), MINT_PRICE);
            require(USDC.transferFrom(msg.sender, address(this), MINT_PRICE), "USDC transfer failed");
        }
        
        counter++;
        _safeMint(_to, counter);
        tokenMinters[counter] = msg.sender;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns(address) {
        if (tokenId != counter) {
            tokensOwned[auth].remove(tokenId);
        }
        tokensOwned[to].add(tokenId);
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint _tokenId) public view override returns (string memory) {
        if(_tokenId > counter) revert InvalidTokenId(_tokenId);

        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name": "VisarelyPunk #', 
                    _tokenId.toString(),
                    '", "description": "Generated art inspired by Vasarely with waves of punk attributes", "image": "data:image/svg+xml;base64,',
                    Base64.encode(bytes(generateSVG(_tokenId))),
                    '","attributes":',
                    generateMetadataAttributes(_tokenId),
                    '}'
                )
            ))
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function generateSVG(uint _tokenId) public view returns (string memory) {
        uint256 seed = uint256(keccak256(abi.encodePacked(_tokenId, tokenMinters[_tokenId])));
        string memory background = backgrounds[seed % backgrounds.length];
        
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">',
                generateDefs(_tokenId),
                '<rect width="800" height="800" fill="', background, '"/>',
                '<g filter="url(#noise)">',
                generatePunks(_tokenId, 1),
                '</g></svg>'
            )
        );
    }

    function generateDefs(uint _tokenId) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<defs>',
                '<filter id="noise">',
                '<feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" seed="',
                _tokenId.toString(),
                '"/><feDisplacementMap in="SourceGraphic" scale="15"/>',
                '</filter>',
                '</defs>'
            )
        );
    }

    function generatePunks(uint _tokenId, uint8 totalShapes) internal view returns (string memory) {
        uint256 seed = uint256(keccak256(abi.encodePacked(_tokenId, tokenMinters[_tokenId])));
        return string(
            abi.encodePacked(
                '<g>',
                generatePunk(400, 400, 600, seed),
                '</g>'
            )
        );
    }

    function generatePunk(
        uint16 x, 
        uint16 y, 
        uint16 size,
        uint256 seed
    ) internal view returns (string memory) {
        uint256 rarity = seed % 100;
        
        return string(
            abi.encodePacked(
                '<g transform="translate(',
                uint256(x).toString(), ',',
                uint256(y).toString(), ') scale(',
                uint256(size/100).toString(), ')">',
                generateFace(seed),
                generateAttributes(seed, rarity),
                '</g>'
            )
        );
    }

    function generateFace(uint256 seed) internal view returns (string memory) {
        string memory faceColor = faceColors[seed % faceColors.length];
        bool isRound = seed % 10 < 1; // 10% chance for round face
        
        if(isRound) {
            return string(
                abi.encodePacked(
                    '<circle cx="0" cy="0" r="20" fill="',
                    faceColor,
                    '"/>'
                )
            );
        }
        
        return string(
            abi.encodePacked(
                '<rect x="-20" y="-20" width="40" height="40" fill="',
                faceColor,
                '" rx="5"/>'
            )
        );
    }

    function generateAttributes(uint256 seed, uint256 rarity) internal view returns (string memory) {
        string memory attributes;
        
        // Legendary (4%)
        if(rarity < 4) {
            attributes = string.concat(attributes,
                generateHair(seed, true),
                generateGlasses(seed, true),
                generateChain(seed, true),
                generateEarrings(seed, true),
                generateExtraTraits(seed, true),
                generateSpecialEffects(seed)
            );
        }
        // Epic (8%)
        else if(rarity < 12) {
            attributes = string.concat(attributes,
                generateHair(seed, true),
                generateGlasses(seed, true),
                generateChain(seed, true),
                generateExtraTraits(seed, true),
                generateEarrings(seed, true)
            );
        }
        // Rare (25%)
        else if(rarity < 37) {
            attributes = string.concat(attributes,
                generateHair(seed, false),
                generateGlasses(seed, false),
                generateExtraTraits(seed, false),
                selectRandomAttribute(seed)
            );
        }
        // Common (63%)
        else {
            if(seed % 2 == 0) attributes = string.concat(attributes, generateHair(seed, false));
            if(seed % 3 == 0) attributes = string.concat(attributes, generateGlasses(seed, false));
            if(seed % 4 == 0) attributes = string.concat(attributes, selectRandomAttribute(seed));
            if(seed % 5 == 0) attributes = string.concat(attributes, generateExtraTraits(seed, false));
        }
        
        return attributes;
    }

    function generateHair(uint256 seed, bool isRare) internal view returns (string memory) {
        string memory hairStyle = hairStyles[(seed >> 64) % hairStyles.length];
        
        if(keccak256(bytes(hairStyle)) == keccak256(bytes("None"))) {
            return "";
        }
        
        string memory hairColor = hairColors[(seed >> 128) % hairColors.length];
        
        if(isRare && seed % 2 == 0) {
            return generateGradientHair(hairStyle, hairColor, seed);
        }
        
        return generateBasicHair(hairStyle, hairColor);
    }

    function generateExtraTraits(uint256 seed, bool isRare) internal view returns (string memory) {
        string memory traits;
        bool hasHat = false;
        
        // Eyes variations with colors
        uint256 eyeRoll = seed % 25;
        if(eyeRoll == 0) { // Cyclops (4%)
            string memory eyeColor = eyeColors[(seed >> 64) % eyeColors.length];
            traits = string.concat(traits,
                '<circle cx="0" cy="0" r="3" fill="',
                eyeColor,
                '"/>'
            );
        } else if(eyeRoll == 1) { // Spiral eyes (4%)
            traits = string.concat(traits,
                '<path d="M-10,0 a2,2 0 0 1 4,0 a1,1 0 0 1 2,0" stroke="#000000" fill="none"/>',
                '<path d="M10,0 a2,2 0 0 1 4,0 a1,1 0 0 1 2,0" stroke="#000000" fill="none"/>'
            );
        } else if(eyeRoll < 5) { // Different colored eyes (12%)
            string memory leftEye = eyeColors[(seed >> 64) % eyeColors.length];
            string memory rightEye = eyeColors[(seed >> 128) % eyeColors.length];
            traits = string.concat(traits,
                '<circle cx="-10" cy="0" r="2" fill="',
                leftEye,
                '"/>',
                '<circle cx="10" cy="0" r="2" fill="',
                rightEye,
                '"/>'
            );
        } else if(eyeRoll < 8) { // Winking
            string memory eyeColor = eyeColors[(seed >> 64) % eyeColors.length];
            traits = string.concat(traits,
                '<path d="M-10,0 Q-5,-5 0,0" stroke="#000000" stroke-width="1" fill="none"/>',
                '<circle cx="10" cy="0" r="2" fill="',
                eyeColor,
                '"/>'
            );
        } else if(eyeRoll < 11) { // Wide eyes
            string memory eyeColor = eyeColors[(seed >> 64) % eyeColors.length];
            traits = string.concat(traits,
                '<circle cx="-10" cy="0" r="3" fill="',
                eyeColor,
                '"/>',
                '<circle cx="10" cy="0" r="3" fill="',
                eyeColor,
                '"/>'
            );
        } else if(eyeRoll < 14) { // Sleepy eyes
            traits = string.concat(traits,
                '<path d="M-12,-2 Q-10,2 -8,-2" stroke="#000000" stroke-width="2" fill="none"/>',
                '<path d="M8,-2 Q10,2 12,-2" stroke="#000000" stroke-width="2" fill="none"/>'
            );
        } else if(eyeRoll < 17) { // Happy eyes
            traits = string.concat(traits,
                '<path d="M-12,0 Q-10,-3 -8,0" stroke="#000000" stroke-width="2" fill="none"/>',
                '<path d="M8,0 Q10,-3 12,0" stroke="#000000" stroke-width="2" fill="none"/>'
            );
        } else if(eyeRoll < 20) { // Frowny eyes
            traits = string.concat(traits,
                '<path d="M-12,2 Q-10,-1 -8,2" stroke="#000000" stroke-width="2" fill="none"/>',
                '<path d="M8,2 Q10,-1 12,2" stroke="#000000" stroke-width="2" fill="none"/>'
            );
        } else { // Default eyes with random color
            string memory eyeColor = eyeColors[(seed >> 64) % eyeColors.length];
            traits = string.concat(traits,
                '<circle cx="-10" cy="0" r="2" fill="',
                eyeColor,
                '"/>',
                '<circle cx="10" cy="0" r="2" fill="',
                eyeColor,
                '"/>'
            );
        }

        // Hats
        if(!hasHat) {
            uint256 hatRoll = seed % 15;
            if(hatRoll == 0) { // Top Hat
                hasHat = true;
                traits = string.concat(traits,
                    '<rect x="-22" y="-40" width="44" height="5" fill="#000000"/>',
                    '<rect x="-15" y="-55" width="30" height="15" fill="#000000"/>'
                );
            } else if(hatRoll == 1) { // Santa Hat
                hasHat = true;
                traits = string.concat(traits,
                    '<path d="M-20,-30 Q0,-50 20,-30" fill="#FF0000"/>',
                    '<rect x="-22" y="-32" width="44" height="5" fill="#FFFFFF"/>',
                    '<circle cx="15" cy="-45" r="5" fill="#FFFFFF"/>'
                );
            } else if(hatRoll == 2) { // Crown
                hasHat = true;
                traits = string.concat(traits,
                    '<path d="M-20,-40 L-10,-30 L0,-40 L10,-30 L20,-40 L15,-25 L-15,-25 Z" fill="#FFD700"/>',
                    '<circle cx="0" cy="-35" r="2" fill="#FF0000"/>',
                    '<circle cx="-10" cy="-32" r="2" fill="#00FF00"/>',
                    '<circle cx="10" cy="-32" r="2" fill="#0000FF"/>'
                );
            }
        }

        // Moustache (separate roll from mouth)
        if(seed % 8 == 0) {
            traits = string.concat(traits,
                '<path d="M-15,10 Q-7,13 0,10 Q7,13 15,10" stroke="#000000" stroke-width="2" fill="none"/>'
            );
        }

        // Mouth expressions (if no moustache)
        if(seed % 8 != 0) {
            uint256 mouthRoll = seed % 10;
            if(mouthRoll == 0) { // Slight frown
                traits = string.concat(traits,
                    '<path d="M-10,10 Q0,8 10,10" stroke="#000000" stroke-width="2" fill="none"/>'
                );
            } else if(mouthRoll == 1) { // Grin
                traits = string.concat(traits,
                    '<path d="M-10,10 Q0,15 10,10" stroke="#000000" stroke-width="2" fill="none"/>'
                );
            } else if(mouthRoll == 2) { // Expressionless
                traits = string.concat(traits,
                    '<path d="M-10,10 L10,10" stroke="#000000" stroke-width="2"/>'
                );
            }
        }

        // Facial Features
        if(seed % 5 == 0) { // Buck Tooth
            traits = string.concat(traits,
                '<rect x="-2" y="15" width="4" height="6" fill="#FFFFFF"/>'
            );
        }
        
        // Cigarette (10% chance when no vape)
        if(seed % 7 != 0 && seed % 10 == 0) {
            traits = string.concat(traits,
                '<rect x="15" y="10" width="12" height="2" fill="#FFFFFF"/>',
                '<circle cx="27" cy="11" r="1" fill="#FF4500"/>',
                '<path d="M28,11 Q32,11 35,8" stroke="#CCCCCC" stroke-width="1" opacity="0.7"/>'
            );
        }

        // Vape (separate from cigarette)
        if(seed % 7 == 0) {
            traits = string.concat(traits,
                '<rect x="12" y="8" width="10" height="5" fill="#4B0082"/>',
                '<path d="M22,10 Q30,10 35,5" stroke="#CCCCCC" stroke-width="1" opacity="0.5"/>'
            );
        }

        return traits;
    }

    function generateGlasses(uint256 seed, bool isRare) internal view returns (string memory) {
        string memory style = glassesStyles[(seed >> 32) % glassesStyles.length];
        
        if(isRare) {
            return generateRareGlasses(style, seed);
        }
        
        return generateBasicGlasses(style);
    }

    function generateChain(uint256 seed, bool isDouble) internal pure returns (string memory) {
        string memory chainColor = seed % 2 == 0 ? "#FFD700" : "#C0C0C0"; // Gold or Silver
        if(isDouble) {
            return string(
                abi.encodePacked(
                    '<path d="M-25,20 C-15,23 15,23 25,20" stroke="',
                    chainColor,
                    '" stroke-width="3" fill="none"/>',
                    '<path d="M-25,25 C-15,28 15,28 25,25" stroke="',
                    chainColor,
                    '" stroke-width="3" fill="none"/>'
                )
            );
        }
        return string(
            abi.encodePacked(
                '<path d="M-25,20 C-15,23 15,23 25,20" stroke="',
                chainColor,
                '" stroke-width="3" fill="none"/>'
            )
        );
    }

    function generateEarrings(uint256 seed, bool isRare) internal pure returns (string memory) {
        if(isRare) {
            return string(
                abi.encodePacked(
                    '<circle cx="18" cy="-5" r="2" fill="#FFD700"/>',
                    '<circle cx="18" cy="0" r="2" fill="#FFD700"/>',
                    '<circle cx="18" cy="5" r="2" fill="#FFD700"/>'
                )
            );
        }
        return '<circle cx="18" cy="0" r="2" fill="#FFD700"/>';
    }

    function generateSpecialEffects(uint256 seed) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<circle cx="0" cy="0" r="30" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.5"/>',
                '<circle cx="0" cy="0" r="35" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.3"/>'
            )
        );
    }

    function selectRandomAttribute(uint256 seed) internal pure returns (string memory) {
        uint256 choice = seed % 3;
        if(choice == 0) return generateChain(seed, false);
        if(choice == 1) return generateEarrings(seed, false);
        return "";
    }

    function generateBasicHair(string memory style, string memory color) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<rect x="-25" y="-25" width="50" height="10" fill="',
                color,
                '"/>'
            )
        );
    }

    function generateGradientHair(
        string memory style,
        string memory color,
        uint256 seed
    ) internal pure returns (string memory) {
        string memory gradientId = string(
            abi.encodePacked(
                "gradient",
                uint256(seed).toHexString()
            )
        );
        
        return string(
            abi.encodePacked(
                '<linearGradient id="',
                gradientId,
                '" x1="0%" y1="0%" x2="100%" y2="0%">',
                '<stop offset="0%" style="stop-color:',
                color,
                '"/>',
                '<stop offset="100%" style="stop-color:#FFD700"/>',
                '</linearGradient>',
                '<rect x="-25" y="-25" width="50" height="10" fill="url(#',
                gradientId,
                ')"/>'
            )
        );
    }

    function generateBasicGlasses(string memory style) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<rect x="-15" y="-8" width="12" height="10" fill="#000000"/>',
                '<rect x="3" y="-8" width="12" height="10" fill="#000000"/>'
            )
        );
    }

    function generateRareGlasses(
        string memory style,
        uint256 seed
    ) internal pure returns (string memory) {
        if(keccak256(bytes(style)) == keccak256(bytes("3D"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#FF0000" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.7"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("3DPunk"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#FF1493" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#4169E1" opacity="0.7"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("3DGold"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#FFD700" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.7"/>',
                    '<rect x="-16" y="-9" width="14" height="12" fill="none" stroke="#FFD700" stroke-width="1"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("3DNeon"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#FF1493" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FF00" opacity="0.7"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("3DRetro"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#FFD700" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#FF4500" opacity="0.7"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("3DRainbow"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#FF1493" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#4B0082" opacity="0.7"/>',
                    '<path d="M-16,-9 h14 M2,-9 h14" stroke="#FFD700" stroke-width="1"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("3DFuture"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.7"/>',
                    '<path d="M-16,-9 L-2,1 M2,-9 L16,1" stroke="#00FFFF" stroke-width="1"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("VR"))) {
            return string(
                abi.encodePacked(
                    '<path d="M-20,-10 h40 v15 h-40 Z" fill="#333333"/>',
                    '<rect x="-15" y="-8" width="12" height="10" fill="#00FF00" opacity="0.5"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FF00" opacity="0.5"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("VRGold"))) {
            return string(
                abi.encodePacked(
                    '<path d="M-20,-10 h40 v15 h-40 Z" fill="#FFD700"/>',
                    '<rect x="-15" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.5"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.5"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("VRDeluxe"))) {
            return string(
                abi.encodePacked(
                    '<path d="M-20,-10 h40 v15 h-40 Z" fill="#4B0082"/>',
                    '<rect x="-15" y="-8" width="12" height="10" fill="#FF1493" opacity="0.5"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#FF1493" opacity="0.5"/>',
                    '<circle cx="-20" cy="-5" r="2" fill="#FFD700"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("VRCyber"))) {
            return string(
                abi.encodePacked(
                    '<path d="M-20,-10 h40 v15 h-40 Z" fill="#4B0082"/>',
                    '<rect x="-15" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.5"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.5"/>',
                    '<path d="M-20,-10 L20,5 M20,-10 L-20,5" stroke="#00FFFF" stroke-width="1"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("VRMatrix"))) {
            return string(
                abi.encodePacked(
                    '<path d="M-20,-10 h40 v15 h-40 Z" fill="#000000"/>',
                    '<rect x="-15" y="-8" width="12" height="10" fill="#00FF00" opacity="0.7"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FF00" opacity="0.7"/>',
                    '<path d="M-20,-10 L20,5" stroke="#00FF00" stroke-width="1" opacity="0.5"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("VRSpace"))) {
            return string(
                abi.encodePacked(
                    '<path d="M-20,-10 h40 v15 h-40 Z" fill="#000066"/>',
                    '<rect x="-15" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.5"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FFFF" opacity="0.5"/>',
                    '<circle cx="-18" cy="-7" r="1" fill="#FFFFFF"/>',
                    '<circle cx="15" cy="-3" r="1" fill="#FFFFFF"/>'
                )
            );
        } else if(keccak256(bytes(style)) == keccak256(bytes("HornRimmed"))) {
            return string(
                abi.encodePacked(
                    '<rect x="-15" y="-8" width="12" height="10" fill="#000000"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#000000"/>',
                    '<rect x="-16" y="-9" width="14" height="2" fill="#8B4513"/>',
                    '<rect x="2" y="-9" width="14" height="2" fill="#8B4513"/>'
                )
            );
        }
        return generateBasicGlasses(style);
    }

    function generateMetadataAttributes(uint256 _tokenId) internal view returns (string memory) {
        uint256 seed = uint256(keccak256(abi.encodePacked(_tokenId, tokenMinters[_tokenId])));
        uint256 rarity = seed % 100;
        string memory rarityTier;
        
        // Rarity tiers for 2000 NFTs:
        // Legendary: 4% = 80 NFTs
        // Epic: 8% = 160 NFTs
        // Rare: 25% = 500 NFTs
        // Common: 63% = 1260 NFTs
        if(rarity < 4) rarityTier = "Legendary";
        else if(rarity < 12) rarityTier = "Epic";
        else if(rarity < 37) rarityTier = "Rare";
        else rarityTier = "Common";

        // Calculate trait probabilities based on seed
        uint256 faceIndex = seed % faceColors.length;
        if (faceIndex < 10) faceIndex = seed % 10; // Human (60%)
        else if (faceIndex < 13) faceIndex = 10 + (seed % 3); // Zombie (15%)
        else if (faceIndex < 16) faceIndex = 13 + (seed % 3); // Ape (15%)
        else faceIndex = 16 + (seed % 2); // Alien (10%)

        string memory faceColor = faceColors[faceIndex];
        bool isRound = seed % 10 < 1; // 10% round faces
        string memory glassesStyle = glassesStyles[(seed >> 32) % glassesStyles.length];
        string memory hairStyle = hairStyles[(seed >> 64) % hairStyles.length];
        string memory hairColor = hairColors[(seed >> 128) % hairColors.length];
        string memory eyeColor = eyeColors[(seed >> 64) % eyeColors.length];
        string memory background = backgrounds[seed % backgrounds.length];

        return string(
            abi.encodePacked(
                '[{"trait_type":"Rarity","value":"',
                rarityTier,
                '"},{"trait_type":"Face Shape","value":"',
                isRound ? "Round" : "Square",
                '"},{"trait_type":"Face Color","value":"',
                faceColor,
                '"},{"trait_type":"Glasses Style","value":"',
                glassesStyle,
                '"},{"trait_type":"Hair Style","value":"',
                hairStyle,
                '"},{"trait_type":"Hair Color","value":"',
                hairColor,
                '"},{"trait_type":"Eye Color","value":"',
                eyeColor,
                '"},{"trait_type":"Background","value":"',
                background,
                '"}]'
            )
        );
    }

    function sqrt(uint x) internal pure returns (uint y) {
        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // Add withdraw function for owner
    function withdrawUSDC() external {
        require(msg.sender == owner(), "Not owner");
        uint256 balance = USDC.balanceOf(address(this));
        require(USDC.transfer(owner(), balance), "Transfer failed");
    }

    // Add supply check function
    function totalSupply() public view returns (uint256) {
        return counter;
    }
}