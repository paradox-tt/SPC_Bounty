import { BlockInfo, CollatorData, ExtrinsicInfo, Identity, ManualPayment } from "./types";
import * as Constants from './constants';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types/codec';
import "@polkadot/api-augment";

export class ParachainData {

    private collators: CollatorData[];
    private previous_blocks: number[];
    private _invulnerables: string[];

    public constructor() {
        this.collators = [];
        this.previous_blocks = [];
        this._invulnerables = [];
    };

    public setInvulnerables(value: string[]) {
        this._invulnerables = value;
    }

    public getInvulnerables(): string[] {
        return this._invulnerables;
    }

    public addData(info: BlockInfo) {

        //Double check to ensure blocks aren't counted twice
        //Also don't reward collators in the no reward table
        if (this.previous_blocks.indexOf(info.number) < 0
            && Constants.NO_REWARD_COLLATORS.indexOf(info.author) == -1) {

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

export interface Parachain {

}

export class EraReward {

    private _era: number;
    private _total_stake: number;
    private _reward: number;
    private _chain: Constants.RELAY;

    public constructor(era: number, total_stake: number, reward: number, chain: Constants.RELAY) {
        this._era = era;
        this._total_stake = total_stake;
        this._reward = reward;
        this._chain = chain;
    }

    /*
        Gets the total reward for the era and divides it equally over the total staked for the era
        and then multiplies it by 50 (KSM) / 1000 DOT to determine the average reward for every DOT/KSM staked.
    */
    public getStakingReward(): number {
        const permissionless = this._chain == Constants.RELAY.POLKADOT ? Constants.DOT_PERMISSIONLESS : Constants.KSM_PERMISSIONLESS;
        return (this._reward / this._total_stake) * permissionless;
    }

    public getEra(): number {
        return this._era;
    }

}

export class RewardCollector {

    private ema7: number;
    private staking_info: EraReward[];
    private manual_entries: ManualPayment[];
    private parachain_data: ParachainData;


    public constructor(ema7: number, staking_info: EraReward[], manual_entries: ManualPayment[], parachain_data: ParachainData) {
        this.ema7 = ema7;
        this.staking_info = staking_info;
        this.manual_entries = manual_entries;
        this.parachain_data = parachain_data;
    }

    public async getExtrinsicInfo(chain: Constants.RELAY): Promise<ExtrinsicInfo[]> {
        var results: ExtrinsicInfo[] = [];
        const wsProvider = new WsProvider(chain == Constants.RELAY.POLKADOT ? Constants.DOT_WSS : Constants.KSM_WSS);
        const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

        const PLANKS = chain == Constants.RELAY.POLKADOT ? Constants.POLKADOT_PLANKS : Constants.KUSAMA_PLANKS;

        //Add manual entries
        this.manual_entries.map(x => results.push(
            {
                recipient: x.recipient,
                description: x.description,
                value: (x.isToken ? x.value : x.value / this.ema7) * PLANKS
            }
        ));

        if (this.parachain_data) {
            //Hosting reward
            results.push(
                {
                    recipient: Constants.HOSTING_RECIPIENT,
                    description: `Hosting fee for Curator RPC instance @ $${Constants.HOSTING_FEE.toFixed(Constants.NUM_DECIMALS)}`,
                    value: (Constants.HOSTING_FEE / this.ema7) * PLANKS
                }
            );

            results.push(
                {
                    recipient: Constants.HOSTING_RECIPIENT,
                    description: `1/${Constants.PARACHAINS} hosting fee for supporting relay chain RPC instances @ $${Constants.RELAY_HOSTING_FEE.toFixed(Constants.NUM_DECIMALS)}`,
                    value: ((Constants.RELAY_HOSTING_FEE / this.ema7) / Constants.PARACHAINS) * PLANKS
                }
            );

            results.push(
                {
                    recipient: Constants.HOSTING_RECIPIENT,
                    description: `1/${Constants.PARACHAINS} hosting fee for curator instance @ $${Constants.CURATOR_HOSTING_FEE.toFixed(Constants.NUM_DECIMALS)}`,
                    value: ((Constants.CURATOR_HOSTING_FEE / this.ema7) / Constants.PARACHAINS) * PLANKS
                }
            );

            //Calculate collator rewards
            const staking_reward = this.staking_info.map(x => x.getStakingReward()).reduce((a, b) => a + b);

            const max = this.parachain_data.getMaxBlocks();
            const collators = this.parachain_data.getCollators();

            for (var i = 0; i < collators.length; i++) {
                var collator = collators[i];
                var ratio = collator.number_of_blocks / max;
                var collator_name = await this.getIdentity(collator.collator, api);

                var adjusted_staking_reward = ratio * staking_reward;
                const adjusted_collator_reward = ratio * (Constants.COLLATOR_REWARD / this.ema7);

                var invulnerable = this.parachain_data.getInvulnerables().indexOf(collator.collator) > -1;
                adjusted_staking_reward = invulnerable ? 0 : adjusted_staking_reward;

                results.push(
                    {
                        recipient: collator.collator,
                        description: `${collator_name.name} produced ${collator.number_of_blocks}/${max} blocks; SR: ${invulnerable ? 'Invul:0' : adjusted_staking_reward.toFixed(Constants.NUM_DECIMALS)}, CR: ${adjusted_collator_reward.toFixed(Constants.NUM_DECIMALS)}`,
                        value: (adjusted_collator_reward + adjusted_staking_reward) * PLANKS
                    }
                );

            }
        }

        //Calculate curator rewards
        var total_reward_map = results.map(x => x.value);
        var total_reward = 0;

        if (total_reward_map.length > 0) {
            total_reward = total_reward_map.reduce((a, b) => a + b);
        }

        var curators = chain == Constants.RELAY.POLKADOT ? Constants.DOT_CURATORS : Constants.KSM_CURATORS;

        for (var i = 0; i < curators.length; i++) {
            var curator = await this.getIdentity(curators[i], api);

            results.push(
                {
                    recipient: curators[i],
                    description: `Reward for curator (${curator.name}) as a portion from total ${(total_reward / PLANKS).toFixed(Constants.NUM_DECIMALS)}`,
                    value: ((total_reward * Constants.CURATOR_REWARD) / curators.length)
                }
            )
        }

        return results;
    }

    public async getExtrinsic(chain: Constants.RELAY): Promise<string> {
        const extrinsic_info = await this.getExtrinsicInfo(chain);
        const wsProviderRelay = new WsProvider(chain == Constants.RELAY.POLKADOT ? Constants.DOT_WSS : Constants.KSM_WSS);
        const api = await ApiPromise.create({ provider: wsProviderRelay, noInitWarn: true });

        //Gets the current child bounty counter
        var cb_count_codec = await api.query.childBounties.childBountyCount();
        var cb_count = parseInt(cb_count_codec.toString());

        var parent_batch = [];

        //Loop through each payout item
        for (var i = 0; i < extrinsic_info.length; i++) {

            //Transaction to add a child bounty
            const add_cb_tx = api.tx.childBounties.addChildBounty(
                chain == Constants.RELAY.POLKADOT ? Constants.POLKADOT_PARENT_BOUNTY_ID : Constants.KUSAMA_PARENT_BOUNTY_ID,
                parseInt(extrinsic_info[i].value.toFixed(0)),
                extrinsic_info[i].description
            );

            //Transaction to propose a curator for the bounty that was just created
            const prop_cur_tx = api.tx.childBounties.proposeCurator(
                chain == Constants.RELAY.POLKADOT ? Constants.POLKADOT_PARENT_BOUNTY_ID : Constants.KUSAMA_PARENT_BOUNTY_ID,
                cb_count,
                { Id: chain == Constants.RELAY.POLKADOT ? Constants.DOT_CURATOR_ACCOUNT : Constants.KSM_CURATOR_ACCOUNT },
                0
            )

            //Accept curation of the bounty
            const acc_cb_tx = api.tx.childBounties.acceptCurator(
                chain == Constants.RELAY.POLKADOT ? Constants.POLKADOT_PARENT_BOUNTY_ID : Constants.KUSAMA_PARENT_BOUNTY_ID,
                cb_count
            );

            //Award the bounty to the recipient
            const award_cb_tx = api.tx.childBounties.awardChildBounty(
                chain == Constants.RELAY.POLKADOT ? Constants.POLKADOT_PARENT_BOUNTY_ID : Constants.KUSAMA_PARENT_BOUNTY_ID,
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
            return {
                name: this.hex2a(raw.substring(2)).replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, ''),
                verified: verified,
                sub: sub
            };
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