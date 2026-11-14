import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

import type { AccountType, TransactionType } from '../../types';

/** Model untuk tabel `transactions` (lihat schema.ts). */
export default class TransactionModel extends Model {
  static table = 'transactions';

  @field('amount') amount: number;
  @field('type') type: TransactionType;
  @field('category') category: string;
  @field('account') account: AccountType;
  @field('notes') notes: string | null;
  @field('receipt_uri') receiptUri: string | null;
  @field('timestamp') timestamp: number;
  @field('synced') synced: boolean;
}
