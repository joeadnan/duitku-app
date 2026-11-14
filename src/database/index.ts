import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import BudgetModel from './models/Budget';
import TransactionModel from './models/Transaction';
import schema from './schema';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: error => {
    console.error('WatermelonDB Setup Error:', error);
  },
});

export const database = new Database({
  adapter,
  // Setiap tabel yang diakses lewat database.get() harus punya model di sini.
  modelClasses: [TransactionModel, BudgetModel],
});
