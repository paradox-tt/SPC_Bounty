import { ApiPromise, WsProvider } from '@polkadot/api';
import { BlockLimits } from './interfaces';

const main = async () => {
    //Statemine WSS
    const wsProviderStatemine = new WsProvider('wss://rpc.polkadot.io');
    const statemine_api = await ApiPromise.create({ provider: wsProviderStatemine })
    //Kusama WSS
    const wsProviderKusama = new WsProvider('wss://rpc.polkadot.io');
    const kusama_api = await ApiPromise.create({ provider: wsProviderKusama })

    const statemine_block_limits = await getStartAndEndBlocks(3, 2023, statemine_api);

    const kusama_block_limits = await getStartAndEndBlocks(3, 2023, kusama_api);
    console.log(kusama_block_limits);
}

const getStartAndEndBlocks = async (month: number, year: number, api: ApiPromise): Promise<BlockLimits> => {
    //Get current block

    //Loop backward until the first block of the desired month is retrieved
    //This block is the end

    //Loop backward from the end block until the month changes
    //When this occurs, the block before is the 1st block of the month



    return { start: 1, end: 2 };
}

main();