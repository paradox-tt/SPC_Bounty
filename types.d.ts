export interface BlockLimits {
    start: number,
    end: number
}

export interface BlockInfo {
    hash: string,
    number: number,
    date: Date,
    author: string
}

export interface CollatorData {
    collator: string,
    number_of_blocks: number
}

export interface EraBlock {
    era: number,
    block: number,
    blockhash: string
}

export interface ManualPayment {
    recipient: string,
    description: string,
    value: number,
    isKSM: boolean
}

export interface ExtrinsicInfo{
    recipient: string,
    description:string,
    value:number
}