import { BlockInfo, CollatorData, ExtrinsicInfo, ManualPayment } from "./types";
import * as Constants from './constants';

export class StatemineData {

    private collators: CollatorData[];
    private previous_blocks: number[];

    public constructor() {
        this.collators = [];
        this.previous_blocks = [];
    };

    public addData(info: BlockInfo) {
        //Double check to ensure blocks aren't counted twice
        if (this.previous_blocks.indexOf(info.number) < 0) {

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

    private getExtrinsicInfo(): ExtrinsicInfo[] {
        var results: ExtrinsicInfo[] = [];

        //Add manual entries
        this.manual_entries.map(x => results.push(
            {
                recipient: x.recipient,
                description: x.description,
                value: x.isKSM ? x.value : x.value / this.ema7
            }
        ));

        //Calculate collator rewards
        const staking_reward = this.staking_info.map(x => x.getStakingReward()).reduce((a, b) => a + b);

        const max = this.statemine_data.getMaxBlocks();
        const collators = this.statemine_data.getCollators();

        for (var i = 0; i < collators.length; i++) {
            var collator = collators[i];
            var ratio = collator.number_of_blocks / max;

            const adjusted_staking_reward = ratio * staking_reward;
            const adjusted_collator_reward = ratio * (300 / this.ema7);

            results.push(
                {
                    recipient: collator.collator,
                    description: `${this.getIdentity(collator.collator)} produced ${collator.number_of_blocks}/${max} blocks; SR:${adjusted_staking_reward}, CR:${adjusted_collator_reward}`,
                    value: adjusted_collator_reward + adjusted_staking_reward
                }
            );

        }

        //Calculate curator rewards
        var total_reward = results.map(x => x.value).reduce((a, b) => a + b);

        Constants.CURATORS.map(x => results.push(
            {
                recipient: x,
                description: `Curator ${this.getIdentity(x)} reward from total ${total_reward}`,
                value: (total_reward * Constants.CURATOR_REWARD) / Constants.CURATORS.length
            }
        ));

        return results;
    }

    public getExtrinsic():string{
        return "";
    }

    private getIdentity(address: string): string {
        return address;
    }
}