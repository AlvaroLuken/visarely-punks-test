// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Strings.sol";

library SVGUtils {
    using Strings for uint256;

    function getBackgrounds() internal pure returns (string[] memory) {
        string[] memory arr = new string[](10);
        arr[0] = "638596"; arr[1] = "8e6fb6"; arr[2] = "95554f";
        arr[3] = "75bf80"; arr[4] = "f2ac17"; arr[5] = "2165ef";
        arr[6] = "FF69B4"; arr[7] = "4B0082"; arr[8] = "800080";
        arr[9] = "FFD700";
        return arr;
    }

    function getBackground(uint8 index) internal pure returns (string memory) {
        string[] memory backgrounds = getBackgrounds();
        if(index < backgrounds.length) return backgrounds[index];
        return "FFFFFF"; // Default white
    }

    function getFaceColors() internal pure returns (string[] memory) {
        string[] memory arr = new string[](18);
        // Human tones
        arr[0] = "FFE4B5"; arr[1] = "F5DEB3"; arr[2] = "DEB887"; 
        arr[3] = "D2B48C"; arr[4] = "BC8F8F"; arr[5] = "F4C2C2";
        arr[6] = "E5AA70"; arr[7] = "F5F5DC"; arr[8] = "FFF8DC"; 
        arr[9] = "FAF0E6";
        // Zombie tones
        arr[10] = "90EE90"; arr[11] = "98FB98"; arr[12] = "7CCD7C";
        // Ape tones
        arr[13] = "8B4513"; arr[14] = "A0522D"; arr[15] = "6B4423";
        // Alien tones
        arr[16] = "00FF00"; arr[17] = "7FFF00";
        return arr;
    }

    function getGlassesStyles() internal pure returns (string[] memory) {
        string[] memory arr = new string[](16);
        arr[0] = "3D"; arr[1] = "3DPunk"; arr[2] = "3DGold";
        arr[3] = "3DNeon"; arr[4] = "3DRetro"; arr[5] = "3DRainbow";
        arr[6] = "3DFuture"; arr[7] = "VR"; arr[8] = "VRGold";
        arr[9] = "VRDeluxe"; arr[10] = "VRCyber"; arr[11] = "VRNeon";
        arr[12] = "VRMatrix"; arr[13] = "VRSpace"; arr[14] = "Classic";
        arr[15] = "HornRimmed";
        return arr;
    }

    function getHairStyles() internal pure returns (string[] memory) {
        string[] memory arr = new string[](11);
        arr[0] = "None"; arr[1] = "Straight"; arr[2] = "Mohawk";
        arr[3] = "Spiky"; arr[4] = "Curly"; arr[5] = "Long";
        arr[6] = "Bun"; arr[7] = "Pigtails"; arr[8] = "Afro";
        arr[9] = "Frumpy"; arr[10] = "Wild";
        return arr;
    }

    function getHairColors() internal pure returns (string[] memory) {
        string[] memory arr = new string[](10);
        arr[0] = "000000"; arr[1] = "FFFFFF"; arr[2] = "FFD700";
        arr[3] = "FF69B4"; arr[4] = "4B0082"; arr[5] = "00FF00";
        arr[6] = "FFA500"; arr[7] = "C0C0C0"; arr[8] = "8B4513";
        arr[9] = "FF0000";
        return arr;
    }

    function getEyeColors() internal pure returns (string[] memory) {
        string[] memory arr = new string[](6);
        arr[0] = "000000"; arr[1] = "0000FF"; arr[2] = "8B4513";
        arr[3] = "4B0082"; arr[4] = "FFD700"; arr[5] = "FFFFFF";
        return arr;
    }

    function getFaceColor(uint8 index, uint8 race) internal pure returns (string memory) {
        string[] memory faceColors = getFaceColors();
        if(race == 0) { // Human
            if(index < 10) return faceColors[index];
            return faceColors[0];
        }
        if(race == 1) return faceColors[10]; // Zombie
        if(race == 2) return faceColors[13]; // Ape
        return faceColors[16]; // Alien
    }

    function generateFace(uint256 seed, string memory faceColor) internal pure returns (string memory) {
        bool isRound = seed % 10 < 1; // 10% chance for round face
        
        if(isRound) {
            return string(
                abi.encodePacked(
                    '<circle cx="0" cy="0" r="20" fill="#',
                    faceColor,
                    '"/>'
                )
            );
        }
        
        return string(
            abi.encodePacked(
                '<rect x="-20" y="-20" width="40" height="40" fill="#',
                faceColor,
                '" rx="5"/>'
            )
        );
    }

    function generateHair(uint256 seed, bool isRare) internal pure returns (string memory) {
        string[] memory styles = getHairStyles();
        string[] memory colors = getHairColors();
        string memory style = styles[(seed >> 64) % styles.length];
        
        if(keccak256(bytes(style)) == keccak256(bytes("None"))) {
            return "";
        }
        
        string memory color = colors[(seed >> 128) % colors.length];
        
        if(isRare && seed % 2 == 0) {
            return generateGradientHair(style, color, seed);
        }
        
        return generateBasicHair(style, color);
    }

    function generateGlasses(uint256 seed, bool isRare) internal pure returns (string memory) {
        string[] memory styles = getGlassesStyles();
        string memory style = styles[(seed >> 32) % styles.length];
        
        if(isRare) {
            return generateRareGlasses(style, seed);
        }
        
        return generateBasicGlasses(style);
    }

    function generateChain(uint256 seed, bool isDouble) internal pure returns (string memory) {
        string memory chainColor = seed % 2 == 0 ? "FFD700" : "C0C0C0"; // Gold or Silver
        if(isDouble) {
            return string(
                abi.encodePacked(
                    '<path d="M-25,20 C-15,23 15,23 25,20" stroke="#',
                    chainColor,
                    '" stroke-width="3" fill="none"/>',
                    '<path d="M-25,25 C-15,28 15,28 25,25" stroke="#',
                    chainColor,
                    '" stroke-width="3" fill="none"/>'
                )
            );
        }
        return string(
            abi.encodePacked(
                '<path d="M-25,20 C-15,23 15,23 25,20" stroke="#',
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

    function generateExtraTraits(uint256 seed, bool isRare) internal pure returns (string memory) {
        string memory traits;
        bool hasHat = false;
        
        // Eyes variations
        uint256 eyeRoll = seed % 25;
        if(eyeRoll == 0) { // Cyclops (4%)
            string[] memory colors = getEyeColors();
            string memory eyeColor = colors[(seed >> 64) % colors.length];
            traits = string.concat(traits,
                '<circle cx="0" cy="0" r="3" fill="#',
                eyeColor,
                '"/>'
            );
        } else if(eyeRoll == 1) { // Spiral eyes (4%)
            string[] memory colors = getEyeColors();
            traits = string.concat(traits,
                '<path d="M-10,0 a2,2 0 0 1 4,0 a1,1 0 0 1 2,0" stroke="#000000" fill="none"/>',
                '<path d="M10,0 a2,2 0 0 1 4,0 a1,1 0 0 1 2,0" stroke="#000000" fill="none"/>'
            );
        } else if(eyeRoll < 5) { // Different colored eyes (12%)
            string[] memory colors = getEyeColors();
            string memory leftEye = colors[(seed >> 64) % colors.length];
            string memory rightEye = colors[(seed >> 128) % colors.length];
            traits = string.concat(traits,
                '<circle cx="-10" cy="0" r="2" fill="#',
                leftEye,
                '"/>',
                '<circle cx="10" cy="0" r="2" fill="#',
                rightEye,
                '"/>'
            );
        } else if(eyeRoll < 8) { // Winking
            string[] memory colors = getEyeColors();
            string memory eyeColor = colors[(seed >> 64) % colors.length];
            traits = string.concat(traits,
                '<path d="M-10,0 Q-5,-5 0,0" stroke="#000000" stroke-width="1" fill="none"/>',
                '<circle cx="10" cy="0" r="2" fill="#',
                eyeColor,
                '"/>'
            );
        } else if(eyeRoll < 11) { // Wide eyes
            string[] memory colors = getEyeColors();
            string memory eyeColor = colors[(seed >> 64) % colors.length];
            traits = string.concat(traits,
                '<circle cx="-10" cy="0" r="3" fill="#',
                eyeColor,
                '"/>',
                '<circle cx="10" cy="0" r="3" fill="#',
                eyeColor,
                '"/>'
            );
        } else {
            string[] memory colors = getEyeColors();
            string memory eyeColor = colors[(seed >> 64) % colors.length];
            traits = string.concat(traits,
                '<circle cx="-10" cy="0" r="2" fill="#',
                eyeColor,
                '"/>',
                '<circle cx="10" cy="0" r="2" fill="#',
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
                '<rect x="-25" y="-25" width="50" height="10" fill="#',
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
                '<stop offset="0%" style="stop-color:#',
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
        } else if(keccak256(bytes(style)) == keccak256(bytes("VR"))) {
            return string(
                abi.encodePacked(
                    '<path d="M-20,-10 h40 v15 h-40 Z" fill="#333333"/>',
                    '<rect x="-15" y="-8" width="12" height="10" fill="#00FF00" opacity="0.5"/>',
                    '<rect x="3" y="-8" width="12" height="10" fill="#00FF00" opacity="0.5"/>'
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
        }
        return generateBasicGlasses(style);
    }

    function generateGradientDefs(uint256 seed) internal pure returns (string memory) {
        return ""; // Only used when needed by other functions
    }
}