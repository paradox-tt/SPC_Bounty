import { BlockInfo, CollatorData, ExtrinsicInfo, Identity, ManualPayment } from "./types";
import * as Constants from './constants';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types/codec';
import "@polkadot/api-augment";
import fs from 'fs';
const { encodeAddress } = require("@polkadot/keyring");

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

        const PLANKS = (chain == Constants.RELAY.POLKADOT) ? Constants.POLKADOT_PLANKS : Constants.KUSAMA_PLANKS;
        const HOSTING_RECIPIENT = (chain == Constants.RELAY.POLKADOT) ? Constants.HOSTING_RECIPIENT_DOT : Constants.HOSTING_RECIPIENT_KSM;

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
                    recipient: HOSTING_RECIPIENT,
                    description: `Hosting fee for Curator RPC instance @ $${Constants.HOSTING_FEE.toFixed(Constants.NUM_DECIMALS)} + 1/${Constants.PARACHAINS} hosting fee for supporting relay chain RPC instances @ $${(Constants.RELAY_HOSTING_FEE * 2).toFixed(Constants.NUM_DECIMALS)} + 1/${Constants.PARACHAINS.toString()} hosting fee for curator instance @ $${Constants.CURATOR_HOSTING_FEE.toFixed(Constants.NUM_DECIMALS)}`,
                    value: ((Constants.HOSTING_FEE / this.ema7) + (((Constants.RELAY_HOSTING_FEE * 2) / this.ema7) / Constants.PARACHAINS) + ((Constants.CURATOR_HOSTING_FEE / this.ema7) / Constants.PARACHAINS)) * PLANKS
                }
            );

            //System Parachain Coordinator
            if (chain == Constants.COORDINATOR_CHAIN) {
                results.push(
                    {
                        recipient: Constants.COORDINATOR,
                        description: `Partial fee for System Coordinator @ $${Constants.COORDINATOR_FEE.toFixed(Constants.NUM_DECIMALS)} split over ${(Constants.KSM_PARACHAINS)} parachains.`,
                        value: ((Constants.COORDINATOR_FEE / this.ema7) / Constants.KSM_PARACHAINS) * PLANKS
                    }
                )
            }

            //Calculate collator rewards
            const staking_reward = this.staking_info.map(x => x.getStakingReward()).reduce((a, b) => a + b);

            const max = this.parachain_data.getMaxBlocks();
            const collators = this.parachain_data.getCollators();

            for (var i = 0; i < collators.length; i++) {
                var collator = collators[i];
                var ratio = collator.number_of_blocks / max;
                var collator_name = await this.getIdentity(collator.collator, chain);

                var adjusted_staking_reward = ratio * staking_reward;
                const adjusted_collator_reward = ratio * (Constants.COLLATOR_REWARD / this.ema7);

                var invulnerable = this.parachain_data.getInvulnerables().indexOf(collator.collator) > -1;
                adjusted_staking_reward = invulnerable ? 0 : adjusted_staking_reward;

                results.push(
                    {
                        recipient: collator.collator,
                        description: `${collator_name} produced ${collator.number_of_blocks}/${max} blocks; SR: ${invulnerable ? '0 (Invulnerable)' : adjusted_staking_reward.toFixed(Constants.NUM_DECIMALS)}, CR: ${adjusted_collator_reward.toFixed(Constants.NUM_DECIMALS)}`,
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
            var curator = await this.getIdentity(curators[i], chain);

            results.push(
                {
                    recipient: curators[i],
                    description: `Reward for curator (${curator}) as a portion from total ${(total_reward / PLANKS).toFixed(Constants.NUM_DECIMALS)}`,
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

        var parent_child_bounty_id = chain == Constants.RELAY.POLKADOT ? Constants.POLKADOT_PARENT_BOUNTY_ID : Constants.KUSAMA_PARENT_BOUNTY_ID;
        //Gets the current child bounty counter
        var cb_count_codec = await api.query.childBounties.parentChildBounties(parent_child_bounty_id);
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

    private getIdentity(addr: string, chain: Constants.RELAY): string {

        var identities: Identity[] = [];
        var emojiStrip = require('emoji-strip');

        if (chain == Constants.RELAY.POLKADOT) {
            identities = JSON.parse(fs.readFileSync('polkadot-identities.json', 'utf-8'));
        } else {
            identities = JSON.parse(fs.readFileSync('kusama-identities.json', 'utf-8'));
        }

        var identity: Identity = identities.find(x => x.address == encodeAddress(addr, 42));

        if (identity) {
            if (identity.sub) {
                return emojiStrip(`${identity.name}\\${identity.sub}`);
            } else {
                return emojiStrip(identity.name)
            }
        } else {
            return addr
        }

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