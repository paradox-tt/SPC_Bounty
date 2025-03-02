import type { SignedBlock, Header, BlockHash } from '@polkadot/types/interfaces';
import type { HeaderExtended } from '@polkadot/api-derive/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BlockInfo, BlockLimits, EraBlock, ManualPayment } from './types';
import * as Constants from './constants'
import { ParachainData, EraReward, RewardCollector } from './classes';
import "@polkadot/api-augment";
import { BN } from 'bn.js';

main();

async function main() {
    let cluster = require('cluster');
    const cliProgress = require('cli-progress');

    const prompt = require('prompt-sync')({ sigint: true });

    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} | {filename} | {value}/{total}',
    }, cliProgress.Presets.shades_grey);

    console.log(`Establish the period of analysis.`);
    const month = getInputVariable('Enter month', 1, 12);
    const year = getInputVariable('Enter year', new Date().getFullYear() - 1, null);

    const chain = getInputVariable('1) Kusama-AssetHub 2) Kusama-BridgeHub 3) Kusama-Coretime 4) Kusama-People 5) Kusama-Encointer 6) Polkadot-AssetHub 7) Polkadot-BridgeHub 8) Polkadot-Collectives 9) Polkadot-People 10) Polkadot-Coretime' , 1, 10);

    const ema7 = parseFloat(prompt(`Enter the EMA7 for use during the period above: `));

    console.log(`Collect manual entries.`);
    const manual_entries = getManualEntries();

    var staking_info: EraReward[] = [];
    var parachain_data: ParachainData;

    var PARACHAIN_WSS, RELAY_CHAIN_WSS, CHAIN_NAME, RELAY_CHAIN;

    if (prompt(`Would you like to process chain blocks (y/n): `) == "y") {
        [PARACHAIN_WSS, RELAY_CHAIN_WSS, CHAIN_NAME, RELAY_CHAIN] = getWSSDetails(chain);

        //Statemine WSS
        const wsProviderParachain = new WsProvider(PARACHAIN_WSS);
        const parachain_api = await ApiPromise.create({ provider: wsProviderParachain, noInitWarn: true });
        //Kusama WSS
        const wsProviderRelay = new WsProvider(RELAY_CHAIN_WSS);
        const relay_api = await ApiPromise.create({ provider: wsProviderRelay, noInitWarn: true });

        console.log(`Determining block limits for Relay-chain and Parachain`);
        const [parachain_limit, relay_limit] = await getLimits(month, year, parachain_api, relay_api);

        console.log(`Parachain start: ${parachain_limit.start} end: ${parachain_limit.end}`);
        console.log(`Relay-chain start: ${relay_limit.start} end: ${relay_limit.end}`);

        console.log(`Collecting block data for Parachain collators.`);
        await parachain_api.isReady;

        parachain_data = new ParachainData();
        (await collectParachainData(parachain_limit, multibar, PARACHAIN_WSS)).map(x => parachain_data.addData(x));

        var invulnerables = await getInvulnerables(parachain_api);
        parachain_data.setInvulnerables(invulnerables);

        console.log(`Collecting era reward information for the relay-chain.`);
        await relay_api.isReady;

        staking_info = await getEraInfo(relay_limit.start, relay_limit.end, relay_api, multibar, RELAY_CHAIN);

        multibar.stop();
        console.log(`${CHAIN_NAME} | Extrinsic Data:`)
    } else {
        console.log(`Manual Entries Only | Extrinsic Data:`);
        RELAY_CHAIN = chain > 5 ? Constants.RELAY.POLKADOT : Constants.RELAY.KUSAMA;
    }

    const reward_collector = new RewardCollector(ema7, staking_info, manual_entries, parachain_data);
    //If the chain is > 2 then it is a Polkadot chain, submit 1, else 0
    const reward_hash = await reward_collector.getExtrinsic(RELAY_CHAIN);

    console.log(reward_hash);

    process.exit(0);

}

async function getInvulnerables(api: ApiPromise): Promise<string[]> {

    const invulnerables = await api.query.collatorSelection.invulnerables();

    return JSON.parse(JSON.stringify(invulnerables.toJSON()));

}

function getWSSDetails(chain: number): [string, string, string, Constants.RELAY] {
    var parachain_wss: string;
    var relay_chain_wss: string;
    var chain_name: string;
    var relay_chain: Constants.RELAY;

    switch (chain) {
        case Constants.CHAINS.KUSAMA_ASSET_HUB:
            parachain_wss = Constants.KSM_ASSETHUB_WSS;
            chain_name = `Kusama Asset Hub`;
            break;
        case Constants.CHAINS.KUSAMA_BRIDGE_HUB:
            parachain_wss = Constants.KSM_BRIDGEHUB_WSS;
            chain_name = `Kusama Bridge Hub`;
            break;
        case Constants.CHAINS.KUSAMA_CORETIME:
            parachain_wss = Constants.KSM_CORETIME_WSS;
            chain_name = `Kusama Coretime`;
            break;
        case Constants.CHAINS.KUSAMA_PEOPLE:
            parachain_wss = Constants.KSM_PEOPLE_WSS;
            chain_name = `Kusama People`;
            break;
        case Constants.CHAINS.KUSAMA_ENCOINTER:
            parachain_wss = Constants.KSM_ENCOINTER_WSS;
            chain_name = `Kusama Encointer`;
            break;            
        case Constants.CHAINS.POLKADOT_ASSET_HUB:
            parachain_wss = Constants.DOT_ASSETHUB_WSS;
            chain_name = `Polkadot Asset Hub`;
            break;
        case Constants.CHAINS.POLKADOT_BRIDGE_HUB:
            parachain_wss = Constants.DOT_BRIDGEHUB_WSS;
            chain_name = `Polkadot Bridge Hub`;
            break;
        case Constants.CHAINS.POLKADOT_COLLECTIVES:
            parachain_wss = Constants.DOT_COLLECTIVES_WSS;
            chain_name = `Polkadot Collectives`;
            break;
        case Constants.CHAINS.POLKADOT_PEOPLE:
            parachain_wss = Constants.DOT_PEOPLE_WSS;
            chain_name = `Polkadot People`;
            break;       
        case Constants.CHAINS.POLKADOT_CORETIME:
            parachain_wss = Constants.DOT_CORETIME_WSS;
            chain_name = `Polkadot Coretime`
            break;     
        default:
            parachain_wss = ``;
            relay_chain_wss = ``;
            chain_name = ``;
            break;
    }

    relay_chain_wss = chain_name.indexOf("Polkadot") == 0 ? Constants.DOT_WSS : Constants.KSM_WSS;
    relay_chain = chain_name.indexOf("Polkadot") == 0 ? Constants.RELAY.POLKADOT : Constants.RELAY.KUSAMA;

    return [parachain_wss, relay_chain_wss, chain_name, relay_chain];
}

async function getLimits(month: number, year: number, parachain_api: ApiPromise, relay_api: ApiPromise) {
    var parachain_limit: BlockLimits = { start: 0, end: 0 };
    var relay_limit: BlockLimits = { start: 0, end: 0 };

    await Promise.all([
        getFirstBlockForMonth(month, year, parachain_api, Constants.PARACHAIN_BLOCK_TIME),
        getLastBlockForMonth(month, year, parachain_api, Constants.PARACHAIN_BLOCK_TIME),
        getFirstBlockForMonth(month, year, relay_api, Constants.RELAY_BLOCK_TIME),
        getLastBlockForMonth(month, year, relay_api, Constants.RELAY_BLOCK_TIME)
    ]).then(result => {
        parachain_limit.start = result[0],
            parachain_limit.end = result[1],
            relay_limit.start = result[2],
            relay_limit.end = result[3]
    });

    return [parachain_limit, relay_limit];
}

async function collectParachainData(parachain_limit: BlockLimits, multibar: any, parachain_wss: string): Promise<BlockInfo[]> {
    var parachain_block_promises = [];
    var return_results: BlockInfo[] = [];

    for (var i = parachain_limit.start; i < parachain_limit.end; i += Constants.PARALLEL_INCREMENTS) {


        var start = i;
        var end = start + Constants.PARALLEL_INCREMENTS;
        parachain_block_promises.push(getPartialBlockInfo(start, end, parachain_wss, multibar));

        //If the next increment exceeds the end, then initiate it here
        if (end + Constants.PARALLEL_INCREMENTS > parachain_limit.end) {
            parachain_block_promises.push(getPartialBlockInfo(end, parachain_limit.end, parachain_wss, multibar));
        }
    }

    console.log(`Processing each block`)

    await Promise.all(parachain_block_promises).then(results => {
        for (var i = 0; i < parachain_block_promises.length; i++)
            for (var j = 0; j < results[i].length; j++)
                return_results.push(results[i][j]);
    });

    return return_results;

}

async function getEraInfo(start: number, end: number, api: ApiPromise, multibar: any, relay: Constants.RELAY): Promise<EraReward[]> {

    var result: EraReward[] = [];

    const kusama_data_extract_progress = multibar.create(end - start, 0);
    kusama_data_extract_progress.increment();


    for (var block = start; block < end; block += 1800) {

        var era_data_at_block = await getEraInfoFromBlock(api, block);

        //Only add if the era was not already added
        if (!result.find(x => x.getEra() == era_data_at_block.era - 1)) {
            const eraRewards = await getRewardInfoFromBlock(api, era_data_at_block.blockhash, era_data_at_block.era - 1, relay);
            result.push(eraRewards);

            kusama_data_extract_progress.update(block - start, { filename: `Block: ${block}` });
        }

        //If the next increment goes beyond the end, then redo using the ending block
        if (block + 1800 > end) {
            era_data_at_block = await getEraInfoFromBlock(api, end);

            if (!result.find(x => x.getEra() == era_data_at_block.era - 1)) {
                const eraRewards = await getRewardInfoFromBlock(api, era_data_at_block.blockhash, era_data_at_block.era - 1, relay);
                result.push(eraRewards);
                kusama_data_extract_progress.update(end - start, { filename: `Block: ${block}` });
            }
        }

    }
    //kusama_data_extract_progress.update(end - start, { filename: `DONE` });

    kusama_data_extract_progress.stop();

    return result;

}


async function getEraInfoFromBlock(api: ApiPromise, block: number): Promise<EraBlock> {
    const blockhash: BlockHash = await api.rpc.chain.getBlockHash(block);

    const api_at = await api.at(blockhash);
    const active_era = await api_at.query.staking.activeEra();
    const index = active_era.unwrapOrDefault().index.toNumber();

    var era_obj: EraBlock = {
        era: index,
        block: block,
        blockhash: blockhash.toString()
    };

    return era_obj;
}

async function getRewardInfoFromBlock(api: ApiPromise, blockhash: string, era: number, relay: Constants.RELAY): Promise<EraReward> {
    const api_at = await api.at(blockhash);
    const PLANKS = Constants.RELAY.POLKADOT ? Constants.POLKADOT_PLANKS : Constants.KUSAMA_PLANKS;

    var divisor = new BN(PLANKS);

    const erasValidatorReward = await api_at.query.staking.erasValidatorReward(era);

    const reward = erasValidatorReward.unwrapOrDefault().div(divisor);

    var total_stake = new BN(0);
    const era_stakers_old = await api_at.query.staking.erasStakers.entries(era)
    var era_stakers: any

    if (era_stakers_old.length == 0) {
        era_stakers = await api_at.query.staking.erasStakersOverview.entries(era);
    } else {
        era_stakers = era_stakers_old;
    }

    for (var i = 0; i < era_stakers.length; i++) {
        if (era_stakers_old.length == 0) {
            total_stake = total_stake.add(stringToBN(era_stakers[i][1].value.total.toString()));
        } else {
            total_stake = total_stake.add(stringToBN(era_stakers[i][1].total.toString()));
        }

    }

    total_stake = total_stake.div(divisor);

    return new EraReward(era, total_stake.toNumber(), reward.toNumber(), relay);

}

function stringToBN(value: string) {

    if (value.indexOf('0x') == 0) {
        return new BN(value.substring(2), 16);
    } else {
        return new BN(value, 10);
    }
}

async function getPartialBlockInfo(start: number, end: number, parachain_wss: string, multibar: any): Promise<BlockInfo[]> {

    const wsProviderParachain = new WsProvider(parachain_wss);
    const api = await ApiPromise.create({ provider: wsProviderParachain, noInitWarn: true });

    await api.isReady;

    const statemine_data_extract_progress = multibar.create(end - start, 0);
    statemine_data_extract_progress.increment();

    var statemine_block_data: BlockInfo[] = [];

    for (var i = start; i < end; i++) {
        const statemeine_block_info = await getBlockInfo(api, i);
        statemine_block_data.push(statemeine_block_info);
        statemine_data_extract_progress.update(i - start, { filename: `Block: ${i}` });
    }

    statemine_data_extract_progress.update(end - start, { filename: `DONE` });

    statemine_data_extract_progress.stop();

    return statemine_block_data;
}

async function getLastBlockForMonth(month: number, year: number, api: ApiPromise, block_time: number): Promise<number> {
    //Javascript months start at 0
    month--;
    //Get current block
    var header: Header = await api.rpc.chain.getHeader();
    var current_block = header.number.toNumber()
    var block_info = await getBlockInfo(api, current_block);

    //Make a guess as to the last block of the month
    var block_difference = estimateBlockDifference(month, year, new Date(), new Date(Number(new Date(year, month + 1, 1)) - 1), block_time);
    while (Math.abs(block_difference) > 50) {
        current_block = current_block - block_difference;
        block_info = await getBlockInfo(api, current_block);
        block_difference = estimateBlockDifference(month, year, block_info.date, new Date(Number(new Date(year, month + 1, 1)) - 1), block_time);
    }

    //If we jumped to far behind then increment blocks to find the last of the month
    if (block_info.date.getMonth() <= month && block_info.date.getFullYear() <= year) {
        //Compensate for time difference
        current_block += ((60 * 60) / Constants.PARACHAIN_BLOCK_TIME) - 50;
        while (new Date(Number(block_info.date) - (60 * 60 * 1000)).getMonth() == month) {
            block_info = await getBlockInfo(api, ++current_block);
        }
    } else {
        while (new Date(Number(block_info.date)).getMonth() > month) {
            block_info = await getBlockInfo(api, current_block--);
        }
    }

    return block_info.number;
}

async function getFirstBlockForMonth(month: number, year: number, api: ApiPromise, block_time: number): Promise<number> {
    //Javascript months start at 0
    month--;
    //Get current block
    var header: Header = await api.rpc.chain.getHeader();
    var current_block = header.number.toNumber()
    var block_info = await getBlockInfo(api, current_block);

    //Make a guess as to the first block of the month
    var block_difference = estimateBlockDifference(month, year, new Date(), new Date(year, month, 1), block_time);

    //Catering for new chains
    if ((current_block - block_difference) < 0)
        return 0;

    while (Math.abs(block_difference) > 50) {
        current_block = current_block - block_difference;
        block_info = await getBlockInfo(api, current_block);
        block_difference = estimateBlockDifference(month, year, block_info.date, new Date(year, month, 1), block_time);
    }

    //If we jumped to far behind then increment blocks to find the last of the month
    if (block_info.date.getMonth() >= month && block_info.date.getFullYear() >= year) {
        //Compensate for time difference
        //current_block -= ((60 * 60) / Constants.STATEMINE_BLOCK_TIME) - 50;
        while (new Date(Number(block_info.date)).getMonth() >= month && block_info.date.getFullYear() >= year) {
            block_info = await getBlockInfo(api, current_block--);
        }
    } else {
        while (new Date(Number(block_info.date)).getMonth() < month) {
            block_info = await getBlockInfo(api, current_block++);
        }
    }

    return block_info.number;
}

function estimateBlockDifference(month: number, year: number, current_date: Date, target_date: Date, block_time: number): number {

    var block_difference = Math.floor((Number(current_date) - Number(target_date)) / (block_time * 1000));

    return block_difference;
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

function getManualEntries(): ManualPayment[] {
    var result: ManualPayment[] = [];
    var continue_adding: boolean = false;

    const prompt = require('prompt-sync')({ sigint: true });

    do {
        if (prompt(`Would you like to add ${result.length == 0 ? `a manual` : `another`} entry? (y/n): `) == "y") {
            result.push(getManualEntry());
            continue_adding = true;
        } else {
            continue_adding = false;
        }
    } while (continue_adding)

    return result;
}

function getManualEntry(): ManualPayment {
    const prompt = require('prompt-sync')({ sigint: true });

    return {
        recipient: prompt(`Enter the recipient address: `),
        description: prompt(`Enter a description: `),
        value: parseFloat(prompt(`Enter a value for payment: `)),
        isToken: prompt(`Is the value for payment in tokens (DOT/KSM), if so select (y)? If not select (n) and it would be processed as fiat (y/n): `) == "y"
    }

}

async function getBlockInfo(api: ApiPromise, block: number): Promise<BlockInfo> {

    await api.isConnected;
    await api.isReady;

    const blockhash: BlockHash = await api.rpc.chain.getBlockHash(block);

    const api_at = await api.at(blockhash);
    const time = await api_at.query.timestamp.now();
    const header: HeaderExtended = await api.derive.chain.getHeader(blockhash);

    return {
        hash: blockhash.toString(),
        number: block,
        date: new Date(time.toNumber()),
        //If the author isn't known then use one of the unpayable addresses
        author: header.author ? header.author.toString() : 'HRn3a4qLmv1ejBHvEbnjaiEWjt154iFi2Wde7bXKGUwGvtL'
    }
}
