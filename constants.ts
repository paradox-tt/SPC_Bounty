/*export const KSM_ASSETHUB_WSS = `wss://sys.dotters.network/statemine`;
export const KSM_BRIDGEHUB_WSS = `wss://sys.dotters.network/bridgehub-kusama`;
export const KSM_CORETIME_WSS = `wss://sys.dotters.network/coretime-kusama`;

export const DOT_ASSETHUB_WSS = `wss://sys.dotters.network/statemint`;
export const DOT_BRIDGEHUB_WSS = `wss://sys.dotters.network/bridgehub-polkadot`;
export const DOT_COLLECTIVES_WSS = `wss://sys.dotters.network/collectives-polkadot`;
*/

export const DOT_ASSETHUB_WSS = `ws://192.168.250.179:9944`;
export const DOT_BRIDGEHUB_WSS = `ws://192.168.250.180:9944`;
export const DOT_COLLECTIVES_WSS = `ws://192.168.250.181:9944`;
export const DOT_PEOPLE_WSS = `ws://192.168.250.219:9944`;
export const DOT_CORETIME_WSS = `ws://192.168.250.220:9944`;

export const KSM_ASSETHUB_WSS = `ws://192.168.250.177:9944`;
export const KSM_BRIDGEHUB_WSS = `ws://192.168.250.178:9944`;
export const KSM_CORETIME_WSS = `ws://192.168.250.211:9944`;
export const KSM_PEOPLE_WSS = `ws://192.168.250.215:9944`;
export const KSM_ENCOINTER_WSS = `ws://192.168.250.218:9944`;

export const PARACHAIN_BLOCK_TIME = 12;

//export const KSM_ASSETHUB_WSS = `ws://192.168.250.177:9944`;
//export const KSM_WSS = `ws://192.168.250.175:9944`;
//export const DOTWSS = `ws://192.168.250.176:9944`;

export const KSM_WSS = `ws://192.168.250.177:9944`;
export const DOT_WSS = `ws://192.168.250.176:9944`;

export const RELAY_BLOCK_TIME = 6;

export const KUSAMA_PLANKS = 1000000000000;
export const POLKADOT_PLANKS = 10000000000;

export const NUM_DECIMALS = 4;

export const PARALLEL_INCREMENTS = 200000;

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

//Parity & Encointer Collators over all chains, plus mischief anon collators
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
    //Polkadot People
    '14QhqUX7kux5PggbBwUFFZNuLvfX2CjzUQ9V56m4d4S67Pgn',
    '14QhqUX7kux5PggbBwUFFZNuLvfX2CjzUQ9V56m4d4S67Pgn',
    //Polkadot Coretime
    '13NAwtroa2efxgtih1oscJqjxcKpWJeQF8waWPTArBewi2CQ',
    '13umUoWwGb765EPzMUrMmYTcEjKfNJiNyCDwdqAvCMzteGzi',
    //Kusama AssetHub
    'EPk1wv1TvVFfsiG73YLuLAtGacfPmojyJKvmifobBzUTxFv',
    'JL21EURyqQxJk9inVW7iuexJNzzuV7HpZJVxQrY8BzwFiTJ',
    //Kusama BridgeHub
    'DQkekNBt8g6D7bPUEqhgfujADxzzfivr1qQZJkeGzAqnEzF',
    'HbUc5qrLtKAZvasioiTSf1CunaN2SyEwvfsgMuYQjXA5sfk',
    //Kusama Coretime
    'Cx9Uu2sxp3Xt1QBUbGQo7j3imTvjWJrqPF1PApDoy6UVkWP',
    'HRn3a4qLmv1ejBHvEbnjaiEWjt154iFi2Wde7bXKGUwGvtL',
    //Kusama People
    //'CbLd7BdUr8DqD4TciR1kH6w12bbHBCW9n2MHGCtbxq4U5ty', BLD
    'CuLgnS17KwfweeoN9y59YrhDG4pekfiY8qxieDaVTcVCjuP',
    //'E8X4LxU9zEiNVAyM95ERDeomMmwwqn7RBCuRMEZCfgFm3J1', Openbit Labs
    'HNrgbuMxf7VLwsMd6YjnNQM6fc7VVsaoNVaMYTCCfK3TRWJ',
    //Kusama Encointer
    'FG2C6WJWFdBNgKGDdS6oyhP1K9zHLNNzRtvAJNbmV1FybzD',
    'Fsn4ArZxAtESoGmwnLVbiKPsrgjFNmGLLdVapjVPCD78mRA',
    'G6z6FmKhw6dHJ8a5tetrzarbsVU4jF8LhoRFk211GryqAdw',
    'GwDHvd1aToQRKa2b9rATV5igF99Bwr12Ko7jDZfPdNBTGT4',
    //RAVEN (exluded due to identity theft)
    'FRt6xsJzQp8isxEXTRGVfymNaosKbWihPCqy7XFKd9v5y6X'
]

//Curator's reward as a percentage of the final
export const CURATOR_REWARD = 0.075

export const KUSAMA_PARENT_BOUNTY_ID = 20;
export const POLKADOT_PARENT_BOUNTY_ID = 32;

//KSM to Plank multiplier
export const KSM_MULTIPLIER = 12;
export const DOT_MULTIPLIER = 10;

export const KSM_CURATOR_ACCOUNT = 'GsGcRLXWFcVnxUaWVE9ojJpnDNM9R7QNxYBrshWtnTcohyc';
export const DOT_CURATOR_ACCOUNT = `15NCSvkYjtf2G1fvtYVnLCSPmKiZk3ReX1AUWsSDD5ocFVXa`;

//Hosting fee per parachain instance
export const HOSTING_FEE = 40;
export const RELAY_HOSTING_FEE = 60;
export const CURATOR_HOSTING_FEE = 60;
export const HOSTING_RECIPIENT_KSM = `J11Rp4mjz3vRb2DL51HqRGRjhuEQRyXgtuFskebXb8zMZ9s`;
export const HOSTING_RECIPIENT_DOT = `16WWmr2Xqgy5fna35GsNHXMU7vDBM12gzHCFGibQjSmKpAN`;

//Permissionless fees
export const KSM_PERMISSIONLESS = 50;
export const DOT_PERMISSIONLESS = 1000;

/*
To add a new chain, insert entry below and ammend getWSSDetails() in app.ts
*/
export enum CHAINS {
    KUSAMA_ASSET_HUB = 1,
    KUSAMA_BRIDGE_HUB = 2,
    KUSAMA_CORETIME = 3,
    KUSAMA_PEOPLE = 4,
    KUSAMA_ENCOINTER = 5,
    POLKADOT_ASSET_HUB = 6,
    POLKADOT_BRIDGE_HUB = 7,
    POLKADOT_COLLECTIVES = 8,
    POLKADOT_PEOPLE = 9,
    POLKADOT_CORETIME = 10
}

export const PARACHAINS = 10;
export const DOT_PARACHAINS = 5;
export const KSM_PARACHAINS = 5;

export enum RELAY{
    KUSAMA,
    POLKADOT
}

//Coordinator details
export const COORDINATOR = `HqRcfhH8VXMhuCk5JXe28WMgDDuW9MVDVNofe1nnTcefVZn`;
export const COORDINATOR_FEE = 1020;
export const COORDINATOR_CHAIN = RELAY.KUSAMA;
