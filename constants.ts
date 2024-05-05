export const KSM_ASSETHUB_WSS = `ws://192.168.250.177:9944`;
export const KSM_BRIDGEHUB_WSS = `ws://192.168.250.178:9944`;
export const KSM_CORETIME_WSS = `ws://192.168.250.211:9944`;



export const DOT_ASSETHUB_WSS = `wss://sys.dotters.network/statemine`;
export const DOT_BRIDGEHUB_WSS = `wss://sys.dotters.network/bridgehub-kusama`;
export const DOT_COLLECTIVES_WSS = `wss://kusama-coretime-rpc.polkadot.io`;

//export const DOT_ASSETHUB_WSS = `ws://192.168.250.179:9944`;
//export const DOT_BRIDGEHUB_WSS = `ws://192.168.250.180:9944`;
//export const DOT_COLLECTIVES_WSS = `ws://192.168.250.181:9944`;

export const PARACHAIN_BLOCK_TIME = 12;

//export const KSM_WSS = `ws://192.168.250.175:9944`;
export const KSM_WSS = `wss://rpc-kusama.luckyfriday.io`;
export const DOT_WSS = `wss://rpc-polkadot.luckyfriday.io`;

export const RELAY_BLOCK_TIME = 6;

export const KUSAMA_PLANKS = 1000000000000;
export const POLKADOT_PLANKS = 10000000000;

export const NUM_DECIMALS = 4;

export const PARALLEL_INCREMENTS = 100;

//Collator reward in fiat
export const COLLATOR_REWARD = 300.00;

export const KSM_CURATORS = [
    'HxyKNyZsr7gMAo2C4W4XKVt94MGLq71vJBm4Cs5YtbKgzxL',
    'HLD3kgUaiwfi97wfLQSXAjhWf1NsbahcMYLijzNu3HNbG4B',
    'DPcLx1cnnJKvLfad4JTNzHA3T2vMmvwLHZSAj9gGim4qLjg'
];

export const DOT_CURATORS = [
    '13YWynHAu8F8uKZFbQwvPgJ67xizvo21HCEQU3Ke8z1XHoyT',
    '14tcZ9ibPGdMwb7XXE4QChgVuJU1xXTvDFpV3E1HpMajbBsH',
    '1pHpxvp2CYscDreozYQdBkJkUkLFQftxQTAwMs5M1a6GRBf'
];

//Parity Collators over all chains
export const NO_REWARD_COLLATORS = [
    //Polkadot AssetHub
    '12ixt2xmCJKuLXjM3gh1SY7C3aj4gBoBUqExTBTGhLCSATFw',
    '15X2eHehrexKqz6Bs6fQTjptP2ndn39eYdQTeREVeRk32p54',
    //Polkadot BridgeHub
    '134AK3RiMA97Fx9dLj1CvuLJUa8Yo93EeLA1TkP6CCGnWMSd',
    '15dU8Tt7kde2diuHzijGbKGPU5K8BPzrFJfYFozvrS1DdE21',
    //Polkadot Collectives
    '1NvWYSswSt5v95m5z9JycedzTXEWJ9Zcgbu5BMnGAwiWUC9',
    '12n87jggYnvxvdHJaEiTAKZF7ZniJqxafYoKzEqfJCUDvJXP',
    //Kusama AssetHub
    'EPk1wv1TvVFfsiG73YLuLAtGacfPmojyJKvmifobBzUTxFv',
    'JL21EURyqQxJk9inVW7iuexJNzzuV7HpZJVxQrY8BzwFiTJ',
    //Kusama BridgeHub
    'DQkekNBt8g6D7bPUEqhgfujADxzzfivr1qQZJkeGzAqnEzF',
    'HbUc5qrLtKAZvasioiTSf1CunaN2SyEwvfsgMuYQjXA5sfk',
    //Kusama Coretime
    'Cx9Uu2sxp3Xt1QBUbGQo7j3imTvjWJrqPF1PApDoy6UVkWP',
    'HRn3a4qLmv1ejBHvEbnjaiEWjt154iFi2Wde7bXKGUwGvtL'
]
//Curator's reward as a percentage of the final
export const CURATOR_REWARD = 0.05

export const KUSAMA_PARENT_BOUNTY_ID = 20;
export const POLKADOT_PARENT_BOUNTY_ID = 32;

//KSM to Plank multiplier
export const KSM_MULTIPLIER = 12;
export const DOT_MULTIPLIER = 10;

export const KSM_CURATOR_ACCOUNT = 'GsGcRLXWFcVnxUaWVE9ojJpnDNM9R7QNxYBrshWtnTcohyc';
export const DOT_CURATOR_ACCOUNT = `15NCSvkYjtf2G1fvtYVnLCSPmKiZk3ReX1AUWsSDD5ocFVXa`;

//Hosting fee per parachain instance
export const HOSTING_FEE = 25;
export const RELAY_HOSTING_FEE = 40;
export const CURATOR_HOSTING_FEE = 40;
export const HOSTING_RECIPIENT_KSM = `J11Rp4mjz3vRb2DL51HqRGRjhuEQRyXgtuFskebXb8zMZ9s`;
export const HOSTING_RECIPIENT_DOT = `16WWmr2Xqgy5fna35GsNHXMU7vDBM12gzHCFGibQjSmKpAN`;

//Permissionless fees
export const KSM_PERMISSIONLESS = 50;
export const DOT_PERMISSIONLESS = 1000;

export enum CHAINS {
    KUSAMA_ASSET_HUB = 1,
    KUSAMA_BRIDGE_HUB = 2,
    KUSAMA_CORETIME = 3,
    POLKADOT_ASSET_HUB = 4,
    POLKADOT_BRIDGE_HUB = 5,
    POLKADOT_COLLECTIVES = 6
}

export const PARACHAINS = 5;

export enum RELAY{
    KUSAMA,
    POLKADOT
}