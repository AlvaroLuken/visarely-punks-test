export const CONTRACT_ADDRESS = '0x358679aD3812B4C645A62B0B30D50d4c4d9a47f7'

export const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_to",
                "type": "address"
            }
        ],
        "name": "mintTo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_tokenId",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const