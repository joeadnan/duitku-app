import { Q } from '@nozbe/watermelondb';

import type { NewTransaction } from '../types';
import { database } from './index';
import type TransactionModel from './models/Transaction';

const transactions = () => database.get<TransactionModel>('transactions');

/** Menyimpan transaksi ke database lokal (selalu berhasil, online maupun luring). */
export function createTransaction(input: NewTransaction): Promise<TransactionModel> {
  return database.write(() =>
    transactions().create(record => {
      record.amount = input.amount;
      record.type = input.type;
      record.category = input.category;
      record.account = input.account;
      record.notes = input.notes ?? null;
      record.receiptUri = input.receiptUri ?? null;
      record.timestamp = input.timestamp;
      record.synced = input.synced;
    }),
  );
}

/** Transaksi terbaru lebih dulu. */
export function fetchTransactions(limit = 100): Promise<TransactionModel[]> {
  return transactions().query(Q.sortBy('timestamp', Q.desc), Q.take(limit)).fetch();
}
