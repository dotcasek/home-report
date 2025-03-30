export interface OverviewData {
    name: string,
    // income: number,
    spending: number
}

export interface Transaction {
    date: Date,
    name: string,
    merchant: string,
    category: string,
    amount: string,
    isHidden: boolean
}