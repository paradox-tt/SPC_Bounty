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

export class RewardData{

    public constructor(){

    }


}