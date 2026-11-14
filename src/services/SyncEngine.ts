import { Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';

import { database } from '../database';
import type TransactionModel from '../database/models/Transaction';

const SYNC_ENDPOINT = 'https://api.duitku.app/v1/sync/batch';

export class SyncEngine {
  private static isSyncing = false;

  /**
   * Mulai memantau koneksi dan menyinkronkan data saat internet tersedia.
   * Mengembalikan fungsi untuk berhenti memantau (panggil di cleanup useEffect).
   */
  public static initNetworkListener(): () => void {
    return NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        void SyncEngine.performBatchSync();
      }
    });
  }

  public static async performBatchSync(): Promise<void> {
    if (SyncEngine.isSyncing) return;
    SyncEngine.isSyncing = true;

    try {
      const unsyncedTransactions = await database
        .get<TransactionModel>('transactions')
        .query(Q.where('synced', false))
        .fetch();

      if (unsyncedTransactions.length === 0) return;

      const payload = unsyncedTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        account: tx.account,
        notes: tx.notes,
        receiptUri: tx.receiptUri,
        timestamp: tx.timestamp,
      }));

      const response = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: payload }),
      });

      if (response.ok) {
        // Satu batch atomik: semua transaksi ditandai tersinkron, atau tidak sama sekali.
        await database.write(async () => {
          await database.batch(
            ...unsyncedTransactions.map(tx =>
              tx.prepareUpdate(record => {
                record.synced = true;
              }),
            ),
          );
        });
      }
    } catch (error) {
      console.error('Batch sync error (retry on next online cycle):', error);
    } finally {
      SyncEngine.isSyncing = false;
    }
  }
}
