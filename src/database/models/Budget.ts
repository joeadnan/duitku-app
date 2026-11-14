import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

/** Model untuk tabel `budgets` (lihat schema.ts). */
export default class BudgetModel extends Model {
  static table = 'budgets';

  @field('category') category: string;
  @field('monthly_limit') monthlyLimit: number;
}
