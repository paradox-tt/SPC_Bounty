import { ApiPromise, WsProvider } from '@polkadot/api';
import type { HeaderExtended } from '@polkadot/api-derive/types';
import type { SignedBlock, Header, BlockHash } from '@polkadot/types/interfaces';
import { BlockInfo } from "./Types";
import "@polkadot/api-augment";

const STATEMINE_WSS = `wss://statemine.api.onfinality.io/public-ws`;
const KUSAMA_WSS = ``;

main();

async function main() {

    const wsProvider = new WsProvider(STATEMINE_WSS);
    const api = await ApiPromise.create({ provider: wsProvider });

    //const month = getInputVariable('Please enter a month in numeric format.', 1, 12);
    //const year = getInputVariable('Please enter a year.', 2023, null);

    const x = await getBlockByDate(api, new Date(2023, 1, 2));
    console.log(x);
}

function getInputVariable(input_text: string, min_value: number, max_value: number | null): number {
    const prompt = require('prompt-sync')({ sigint: true });
    var result;
    do {
        result = (max_value == null) ?
            prompt(`${input_text} [>=${min_value}] =>`) :
            prompt(`${input_text} [${min_value}-${max_value}] =>`);

    } while (
        Number.isNaN(Number(result)) ||
        Number(result) < min_value ||
        (max_value != null && Number(result) > max_value)
    )

    return Number(result);
}

async function getBlockByDate(api: ApiPromise, target: Date): Promise<BlockInfo> {
    //Get the current block
    var header: Header = await api.rpc.chain.getHeader();
    const block_info = await getBlockInfo(api, header.number.toNumber());

    return block_info;

}

async function getBlockInfo(api: ApiPromise, block: number): Promise<BlockInfo> {

    const blockhash:BlockHash = await api.rpc.chain.getBlockHash(block);

    const api_at = await api.at(blockhash);
    const current_block: SignedBlock = await api.rpc.chain.getBlock();

    const time = await api_at.query.timestamp.now();
    const header: HeaderExtended = await api.derive.chain.getHeader(blockhash);

    return {
        hash: blockhash.toString(),
        number: current_block.block.header.number.toNumber(),
        time: new Date(time.toNumber()),
        author: header.author.toString()
    }
}