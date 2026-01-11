import Dexie, { type Table } from 'dexie';

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  currentStock: number;
  unit: string;
  lastUpdatedAt: Date;
}

export interface Transaction {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  notes?: string;
  createdAt: Date;
  syncStatus: 'PENDING' | 'SYNCED';
}

export class WorkshopDB extends Dexie {
  categories!: Table<Category>;
  items!: Table<Item>;
  transactions!: Table<Transaction>;

  constructor() {
    super('WorkshopDB');
    this.version(1).stores({
      categories: 'id, name',
      items: 'id, code, name, categoryId, lastUpdatedAt',
      transactions: 'id, itemId, type, createdAt, syncStatus'
    });
  }
}

export const db = new WorkshopDB();
