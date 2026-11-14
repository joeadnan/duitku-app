import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'amount', type: 'number' },
        { name: 'type', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'account', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'receipt_uri', type: 'string', isOptional: true },
        { name: 'timestamp', type: 'number' },
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'budgets',
      columns: [
        { name: 'category', type: 'string' },
        { name: 'monthly_limit', type: 'number' }
      ]
    })
  ]
});
