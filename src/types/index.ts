export type TransactionType = 'income' | 'expense';

export type AccountType = 'Cash' | 'Bank' | 'E-Wallet';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: AccountType;
  notes?: string;
  receiptUri?: string;
  timestamp: number;
  synced: boolean;
}

/** Data transaksi baru sebelum disimpan (id dibuat oleh database). */
export type NewTransaction = Omit<Transaction, 'id'>;

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}
