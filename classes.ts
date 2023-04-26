import { BlockInfo, CollatorData } from "./types";
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

export class RewardData {

    private collators: CollatorData[];

    public constructor() {
        this.collators = [];
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
        return (this._reward / this._total_stake)*50;
    }

    public getEra(): number {
        return this._era;
    }

}