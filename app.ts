import type { SignedBlock, Header, BlockHash } from '@polkadot/types/interfaces';
import type { HeaderExtended } from '@polkadot/api-derive/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BlockInfo, BlockLimits, EraBlock } from './types';
import * as Constants from './constants'
import { StatemineData } from './classes';
import "@polkadot/api-augment";
import { start } from 'repl';
import { BN } from 'bn.js';

main();

async function main() {
    //Statemine WSS
    const wsProviderStatemine = new WsProvider(Constants.STATEMINE_WSS);
    const statemine_api = await ApiPromise.create({ provider: wsProviderStatemine });
    //Kusama WSS
    const wsProviderKusama = new WsProvider(Constants.KUSAMA_WSS);
    const kusama_api = await ApiPromise.create({ provider: wsProviderKusama });
    const cliProgress = require('cli-progress');

    const month = getInputVariable('Enter month', 1, 12);
    const year = getInputVariable('Enter year', new Date().getFullYear(), null);

    var statemine_limit: BlockLimits = { start: 0, end: 0 };
    var kusama_limit: BlockLimits = { start: 0, end: 0 };

    console.log(`Calculating block limits.`);
    await Promise.all([
        getFirstBlockForMonth(month, year, statemine_api, Constants.STATEMINE_BLOCK_TIME),
        getLastBlockForMonth(month, year, statemine_api, Constants.STATEMINE_BLOCK_TIME),
        getFirstBlockForMonth(month, year, kusama_api, Constants.KUSAMA_BLOCK_TIME),
        getLastBlockForMonth(month, year, kusama_api, Constants.KUSAMA_BLOCK_TIME)
    ]).then(result => {
        statemine_limit.start = result[0],
            statemine_limit.end = result[1],
            kusama_limit.start = result[2],
            kusama_limit.end = result[3]
    });

    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} | {filename} | {value}/{total}',
    }, cliProgress.Presets.shades_grey);

    console.log(`Block limit calculations completed.`);
    console.log(`Statemine: start => ${statemine_limit.start} end => ${statemine_limit.end}`);
    console.log(`Kusama: start => ${kusama_limit.start} end => ${kusama_limit.end}`);

    console.log(`Collecting block data for Statemine collators.`);
    /*
        var statemine_block_promises = [];
    
        for (var i = statemine_limit.start; i < statemine_limit.end; i += Constants.PARALLEL_INCREMENTS) {
            var start = i;
            var end = start + Constants.PARALLEL_INCREMENTS;
            statemine_block_promises.push(getPartialBlockInfo(start, end, statemine_api, multibar));
    
            //If the next increment would exceed the end, then initiate it here
            if (end + Constants.PARALLEL_INCREMENTS > statemine_limit.end) {
                statemine_block_promises.push(getPartialBlockInfo(end, statemine_limit.end, statemine_api, multibar));
            }
        }
    
        console.log(`Processing each block`)
        const statemine_data = new StatemineData();
    
        await Promise.all(statemine_block_promises).then(results => {
            for (var i = 0; i < statemine_block_promises.length; i++)
                for (var j = 0; j < results[i].length; j++)
                    statemine_data.addData(results[i][j]);
        });
        multibar.stop();
    
        console.log(statemine_data.getCollators());
    */

    await getEraInfo(kusama_limit.start, kusama_limit.end, kusama_api, multibar);



    process.exit(0);

    //console.log(`Completed`);
}

async function getEraInfo(start: number, end: number, api: ApiPromise, multibar: any): Promise<EraBlock[]> {

    var era_data: EraBlock[] = [];

    const kusama_data_extract_progress = multibar.create(end - start, 0);
    kusama_data_extract_progress.increment();


    for (var block = start; block < end; block += 1800) {

        const era_data_at_block = await getEraInfoFromBlock(api, block);

        //Only add if the era was not already added
        if (!era_data.find(x => x.era == era_data_at_block.era))
            era_data.push(era_data_at_block);

        if (era_data.length > 1) {
            var record = era_data[era_data.length - 1];
            const eraRewards = await getRewardInfoFromBlock(api, record.blockhash, record.era - 1);

        }
        kusama_data_extract_progress.update(block - start, { filename: `Block: ${block}` });

    }

    console.log(era_data);
    console.log(era_data.length);
    //kusama_data_extract_progress.update(end - start, { filename: `DONE` });

    kusama_data_extract_progress.stop();

    return era_data;

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

async function getRewardInfoFromBlock(api: ApiPromise, blockhash: string, era: number) {
    const api_at = await api.at(blockhash);

    const erasStakers = await api_at.query.staking.erasStakers.entries(era);
    const erasValidatorReward = await api_at.query.staking.erasValidatorReward(era);

    var total_stake = new BN(0);
    var divisor = new BN(1000000000000);

    for (var i = 0; i < erasStakers.length; i++) {
        total_stake=total_stake.add(erasStakers[i][1].total.toBn());
    }

    console.log(total_stake.div(divisor).toNumber());
}

async function getPartialBlockInfo(start: number, end: number, api: ApiPromise, multibar: any): Promise<BlockInfo[]> {

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
        current_block += ((60 * 60) / Constants.STATEMINE_BLOCK_TIME) - 50;
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

    //Make a guess as to the last block of the month
    var block_difference = estimateBlockDifference(month, year, new Date(), new Date(year, month, 1), block_time);
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

async function getBlockInfo(api: ApiPromise, block: number): Promise<BlockInfo> {

    const blockhash: BlockHash = await api.rpc.chain.getBlockHash(block);

    const api_at = await api.at(blockhash);
    const time = await api_at.query.timestamp.now();
    const header: HeaderExtended = await api.derive.chain.getHeader(blockhash);

    return {
        hash: blockhash.toString(),
        number: block,
        date: new Date(time.toNumber()),
        author: header.author!.toString()
    }
}
