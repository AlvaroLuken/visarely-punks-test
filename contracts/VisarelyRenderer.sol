// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SVGUtils.sol";

contract VisarelyRenderer {
    using Strings for uint256;

    function tokenURI(
        uint256 tokenId,
        address minter
    ) external pure returns (string memory) {
        // Generate deterministic seed from tokenId and minter
        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId, minter)));
        
        // Create base64 encoded JSON
        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name":"VisarelyPunk #', 
                    tokenId.toString(),
                    '","description":"Generated art inspired by Vasarely","image":"data:image/svg+xml;base64,',
                    Base64.encode(bytes(generateSVG(seed))),
                    '","attributes":',
                    generateAttributes(seed),
                    '}'
                )
            ))
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function generateSVG(uint256 seed) internal pure returns (string memory) {
        // Extract style configuration
        SVGUtils.StyleConfig memory style = SVGUtils.StyleConfig({
            isRare: (seed % 100) < 12, // 12% rare
            isRound: (seed >> 128) % 10 == 0, // 10% round
            glassesType: uint8((seed >> 64) & 0xFF),
            hairStyle: uint8((seed >> 96) & 0xFF)
        });

        // Get colors
        string memory background = SVGUtils.getBackground(uint8(seed % 8));
        string memory faceColor = SVGUtils.getFaceColor(
            uint8((seed >> 32) & 0xFF),
            uint8((seed >> 40) & 0xFF) % 4
        );

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">',
                '<defs>',
                generateFilter(seed),
                '</defs>',
                '<rect width="800" height="800" fill="#', background, '"/>',
                '<g filter="url(#noise)" transform="translate(400,400)">',
                SVGUtils.generateHead(style, faceColor),
                style.isRare ? 
                    SVGUtils.generateRareGlasses(style.glassesType) :
                    SVGUtils.generateBasicGlasses(style.glassesType),
                SVGUtils.generateTraits(seed, style.isRare),
                '</g></svg>'
            )
        );
    }

    function generateFilter(uint256 seed) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" seed="',
                seed.toString(),
                '"/><feDisplacementMap in="SourceGraphic" scale="15"/></filter>'
            )
        );
    }

    function generateAttributes(uint256 seed) internal pure returns (string memory) {
        // Simplified attributes
        uint8 rarity = uint8(seed % 100);
        string memory rarityTier;
        
        if(rarity < 4) rarityTier = "Legendary";
        else if(rarity < 12) rarityTier = "Epic";
        else if(rarity < 37) rarityTier = "Rare";
        else rarityTier = "Common";

        return string(
            abi.encodePacked(
                '[{"trait_type":"Rarity","value":"',
                rarityTier,
                '"}]'
            )
        );
    }
}