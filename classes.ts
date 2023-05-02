import { BlockInfo, CollatorData, ExtrinsicInfo, Identity, ManualPayment } from "./types";
import * as Constants from './constants';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types/codec';
import "@polkadot/api-augment";

export class StatemineData {

    private collators: CollatorData[];
    private previous_blocks: number[];

    public constructor() {
        this.collators = [];
        this.previous_blocks = [];
    };

    public addData(info: BlockInfo) {
        //Double check to ensure blocks aren't counted twice
        //Also don't reward collators in the no reward table
        if (this.previous_blocks.indexOf(info.number) < 0 
            && Constants.NO_REWARD_COLLATORS.indexOf(info.author)==-1) {

            //Find collator and increment block
            //If the collator does not exist then create it with a block count of 1
            var collator = this.collators.find(x => x.collator == info.author);
            if (collator) {
                collator.number_of_blocks++;
            } else {
                this.collators.push(
                    {
                        collator: info.author,
                        number_of_blocks: 1
                    }
                );
            }
        }

        this.previous_blocks.push(info.number);
    }

    public getMaxBlocks(): number {
        var max = 0;

        for (var i = 0; i < this.collators.length; i++) {
            if (this.collators[i].number_of_blocks > max) {
                max = this.collators[i].number_of_blocks;
            }
        }

        return max;
    }

    public getCollators(): CollatorData[] {
        return this.collators;
    }

}

export class EraReward {

    private _era: number;
    private _total_stake: number;
    private _reward: number;

    public constructor(era: number, total_stake: number, reward: number) {
        this._era = era;
        this._total_stake = total_stake;
        this._reward = reward;
    }

    /*
        Gets the total reward for the era and divides it equally over the total staked for the era
        and then multiplies it by 50 (KSM) to determine the average reward for every 50 KSM staked.
    */
    public getStakingReward(): number {
        return (this._reward / this._total_stake) * 50;
    }

    public getEra(): number {
        return this._era;
    }

}

export class RewardCollector {

    private ema7: number;
    private staking_info: EraReward[];
    private manual_entries: ManualPayment[];
    private statemine_data: StatemineData;


    public constructor(ema7: number, staking_info: EraReward[], manual_entries: ManualPayment[], statemine_data: StatemineData) {
        this.ema7 = ema7;
        this.staking_info = staking_info;
        this.manual_entries = manual_entries;
        this.statemine_data = statemine_data;
    }

    public async getExtrinsicInfo(): Promise<ExtrinsicInfo[]> {
        var results: ExtrinsicInfo[] = [];
        const wsProviderKusama = new WsProvider(Constants.KUSAMA_WSS);
        const api = await ApiPromise.create({ provider: wsProviderKusama });

        //Add manual entries
        this.manual_entries.map(x => results.push(
            {
                recipient: x.recipient,
                description: x.description,
                value: (x.isKSM ? x.value : x.value / this.ema7) * Constants.KUSAMA_PLANKS
            }
            
        ));
       
        //Calculate collator rewards
        const staking_reward = this.staking_info.map(x => x.getStakingReward()).reduce((a, b) => a + b);

        const max = this.statemine_data.getMaxBlocks();
        const collators = this.statemine_data.getCollators();

        for (var i = 0; i < collators.length; i++) {
            var collator = collators[i];
            var ratio = collator.number_of_blocks / max;
            var collator_name = await this.getIdentity(collator.collator, api);

            const adjusted_staking_reward = ratio * staking_reward;
            const adjusted_collator_reward = ratio * (300 / this.ema7);

            results.push(
                {
                    recipient: collator.collator,
                    description: `${collator_name.name} produced ${collator.number_of_blocks}/${max} blocks; SR: ${adjusted_staking_reward.toFixed(2)}, CR: ${adjusted_collator_reward.toFixed(2)}`,
                    value: (adjusted_collator_reward + adjusted_staking_reward) * Constants.KUSAMA_PLANKS
                }
            );

        }

        //Calculate curator rewards
        var total_reward_map = results.map(x => x.value);
        var total_reward = 0;

        if (total_reward_map.length > 0) {
            total_reward = total_reward_map.reduce((a, b) => a + b);
        }

        for (var i = 0; i < Constants.CURATORS.length; i++) {
            var curator = await this.getIdentity(Constants.CURATORS[i], api);

            results.push(
                {
                    recipient: Constants.CURATORS[i],
                    description: `Reward for curator (${curator.name}) as a portion from total ${(total_reward / Constants.KUSAMA_PLANKS).toFixed(2)}`,
                    value: ((total_reward * Constants.CURATOR_REWARD) / Constants.CURATORS.length)
                }
            )
        }

        return results;
    }

    public async getExtrinsic(): Promise<string> {
        const extrinsic_info = await this.getExtrinsicInfo();
        const wsProviderKusama = new WsProvider(Constants.KUSAMA_WSS);
        const api = await ApiPromise.create({ provider: wsProviderKusama });

        //Gets the current child bounty counter
        var cb_count_codec = await api.query.childBounties.childBountyCount();
        var cb_count = parseInt(cb_count_codec.toString());

        var parent_batch = [];

        //Loop through each payout item
        for (var i = 0; i < extrinsic_info.length; i++) {

            //Transaction to add a child bounty
            const add_cb_tx = api.tx.childBounties.addChildBounty(
                Constants.PARENT_BOUNTY_ID,
                parseInt(extrinsic_info[i].value.toFixed(0)),
                extrinsic_info[i].description
            );

            //Transaction to propose a curator for the bounty that was just created
            const prop_cur_tx = api.tx.childBounties.proposeCurator(
                Constants.PARENT_BOUNTY_ID,
                cb_count,
                { Id: Constants.CURATOR_ACCOUNT },
                0
            )

            //Accept curation of the bounty
            const acc_cb_tx = api.tx.childBounties.acceptCurator(
                Constants.PARENT_BOUNTY_ID,
                cb_count
            );

            //Award the bounty to the recipient
            const award_cb_tx = api.tx.childBounties.awardChildBounty(
                Constants.PARENT_BOUNTY_ID,
                cb_count,
                { Id: extrinsic_info[i].recipient }
            )

            //Increment count
            cb_count++;

            //Add the four transactions above in a batchAll, each must be executed together
            const inner_batch = api.tx.utility.batchAll([add_cb_tx, prop_cur_tx, acc_cb_tx, award_cb_tx]);

            //Add the batchAll to the parent batch
            parent_batch.push(inner_batch);

        }


        //Execute each individual batch, if one inner batch fails continue with the others.
        const final_batch = api.tx.utility.forceBatch(parent_batch);

        return final_batch.toHex();
    }

    private async getIdentity(addr: string, api: ApiPromise): Promise<Identity> {     

        let identity, verified, sub;
        identity = await api.query.identity.identityOf(addr);

        if (!identity.isSome) {
            identity = await api.query.identity.superOf(addr);
            if (!identity.isSome) return { name: addr, verified: false, sub: "" };

            const subRaw = identity.toJSON()[1].raw;
            if (subRaw && subRaw.substring(0, 2) === "0x") {
                sub = this.hex2a(subRaw.substring(2)).trim();
            } else {
                sub = subRaw;
            }
            const superAddress = identity.toJSON()[0];
            identity = await api.query.identity.identityOf(superAddress);
        }


        const raw = identity.toJSON().info.display.raw;
        const { judgements } = identity.unwrap();
        for (const judgement of judgements) {
            const status = judgement[1];
            if (status.isReasonable || status.isKnownGood) {
                verified = status.isReasonable || status.isKnownGood;
                continue;
            }
        }

        if (raw && raw.substring(0, 2) === "0x") {
            return { name: this.hex2a(raw.substring(2)), verified: verified, sub: sub };
        } else return { name: raw, verified: verified, sub: sub };
    };

    private hex2a(hex: string): string {
        var str;

        try {
            str = decodeURIComponent(hex.replace(/(..)/g, '%$1'))
        }
        catch (e) {
            str = hex
            console.log('invalid hex input: ' + hex)
        }
        return str
    }

    private CodecToObject(item: Codec) {
        const res = JSON.parse(item.toString());
        return res;
    }
}