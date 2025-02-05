// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import { SVGUtils } from "./SVGUtils.sol";

contract VisarelyRenderer {
    using Strings for uint256;

    function tokenURI(
        uint256 tokenId,
        address minter
    ) external pure returns (string memory) {
        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId, minter)));
        
        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name":"VisarelyPunk #', 
                    tokenId.toString(),
                    '","description":"Generated art inspired by Vasarely with waves of punk attributes","image":"data:image/svg+xml;base64,',
                    Base64.encode(bytes(generateSVG(tokenId, seed))),
                    '","attributes":',
                    generateAttributes(seed),
                    '}'
                )
            ))
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function generateSVG(uint256 tokenId, uint256 seed) internal pure returns (string memory) {
        // Get background color
        string memory background = SVGUtils.getBackground(uint8(seed % 10));
        
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">',
                generateDefs(tokenId),
                '<rect width="800" height="800" fill="#', background, '"/>',
                '<g filter="url(#noise)">',
                generatePunk(400, 400, 600, seed),
                '</g></svg>'
            )
        );
    }

    function generateDefs(uint256 tokenId) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<defs>',
                '<filter id="noise">',
                '<feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" seed="',
                tokenId.toString(),
                '"/><feDisplacementMap in="SourceGraphic" scale="15"/>',
                '</filter>',
                '</defs>'
            )
        );
    }

    function generatePunk(
        uint16 x, 
        uint16 y, 
        uint16 size,
        uint256 seed
    ) internal pure returns (string memory) {
        uint256 rarity = seed % 100;
        string memory faceColor = SVGUtils.getFaceColor(
            uint8((seed >> 32) & 0xFF),
            uint8((seed >> 40) & 0xFF) % 4
        );

        return string(
            abi.encodePacked(
                '<g transform="translate(',
                uint256(x).toString(), ',',
                uint256(y).toString(), ') scale(',
                uint256(size/100).toString(), ')">',
                SVGUtils.generateFace(seed, faceColor),
                generatePunkTraits(seed, rarity),
                '</g>'
            )
        );
    }

    function generatePunkTraits(uint256 seed, uint256 rarity) internal pure returns (string memory) {
        string memory traits;
        
        // Legendary (4%)
        if(rarity < 4) {
            traits = string.concat(traits,
                SVGUtils.generateHair(seed, true),
                SVGUtils.generateGlasses(seed, true),
                SVGUtils.generateChain(seed, true),
                SVGUtils.generateEarrings(seed, true),
                SVGUtils.generateExtraTraits(seed, true),
                SVGUtils.generateSpecialEffects(seed)
            );
        }
        // Epic (8%)
        else if(rarity < 12) {
            traits = string.concat(traits,
                SVGUtils.generateHair(seed, true),
                SVGUtils.generateGlasses(seed, true),
                SVGUtils.generateChain(seed, true),
                SVGUtils.generateExtraTraits(seed, true),
                SVGUtils.generateEarrings(seed, true)
            );
        }
        // Rare (25%)
        else if(rarity < 37) {
            traits = string.concat(traits,
                SVGUtils.generateHair(seed, false),
                SVGUtils.generateGlasses(seed, false),
                SVGUtils.generateExtraTraits(seed, false),
                SVGUtils.selectRandomAttribute(seed)
            );
        }
        // Common (63%)
        else {
            if(seed % 2 == 0) traits = string.concat(traits, SVGUtils.generateHair(seed, false));
            if(seed % 3 == 0) traits = string.concat(traits, SVGUtils.generateGlasses(seed, false));
            if(seed % 4 == 0) traits = string.concat(traits, SVGUtils.selectRandomAttribute(seed));
            if(seed % 5 == 0) traits = string.concat(traits, SVGUtils.generateExtraTraits(seed, false));
        }
        
        return traits;
    }

    function generateAttributes(uint256 seed) internal pure returns (string memory) {
        // Rarity
        uint8 rarity = uint8(seed % 100);
        string memory rarityTier;
        if(rarity < 4) rarityTier = "Legendary";
        else if(rarity < 12) rarityTier = "Epic";
        else if(rarity < 37) rarityTier = "Rare";
        else rarityTier = "Common";

        // Race (based on face color)
        uint8 race = uint8((seed >> 40) & 0xFF) % 4;
        string memory raceType;
        if(race == 0) raceType = "Human";
        else if(race == 1) raceType = "Zombie";
        else if(race == 2) raceType = "Ape";
        else raceType = "Alien";

        // Shape
        bool isRound = seed % 10 < 1;
        string memory shapeType = isRound ? "Round" : "Square";

        // Get glasses style
        string memory glassesStyle = seed % 3 == 0 ? "None" : SVGUtils.getGlassesStyles()[(seed >> 32) % 16];

        // Hair style
        string memory hairStyle = SVGUtils.getHairStyles()[(seed >> 64) % 11];
        
        // Special features
        bool hasChain = (seed % 3 == 0) || rarity < 12;
        bool hasEarrings = (seed % 3 == 1) || rarity < 12;
        bool hasCigarette = seed % 7 != 0 && seed % 10 == 0;
        bool hasVape = seed % 7 == 0;
        bool hasMoustache = seed % 8 == 0;

        return string(
            abi.encodePacked(
                '[',
                '{"trait_type":"Rarity","value":"', rarityTier, '"},',
                '{"trait_type":"Race","value":"', raceType, '"},',
                '{"trait_type":"Face Shape","value":"', shapeType, '"},',
                '{"trait_type":"Glasses","value":"', glassesStyle, '"},',
                '{"trait_type":"Hair","value":"', hairStyle, '"},',
                '{"trait_type":"Chain","value":"', hasChain ? "Yes" : "No", '"},',
                '{"trait_type":"Earrings","value":"', hasEarrings ? "Yes" : "No", '"},',
                '{"trait_type":"Smoking","value":"',
                    hasCigarette ? "Cigarette" : (hasVape ? "Vape" : "None"),
                '"},',
                '{"trait_type":"Moustache","value":"', hasMoustache ? "Yes" : "No", '"}',
                ']'
            )
        );
    }
}