import { type Order, type InsertOrder, type StaffBook, type InsertStaffBook, type EntryStatus, type InsertEntryStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Orders
  getOrders(): Promise<Order[]>;
  getOrderBySno(sno: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(sno: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(sno: string): Promise<void>;
  
  // Staff Book
  getStaffBook(): Promise<StaffBook[]>;
  createStaffBook(staffBook: InsertStaffBook): Promise<StaffBook>;
  deleteStaffBook(billbookRange: string): Promise<void>;
  
  // Entry Status
  getEntryStatuses(): Promise<EntryStatus[]>;
  getEntryStatusesBySno(sno: string): Promise<EntryStatus[]>;
  createEntryStatus(entryStatus: InsertEntryStatus): Promise<EntryStatus>;
  deleteEntryStatus(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private orders: Map<string, Order>;
  private staffBooks: Map<string, StaffBook>;
  private entryStatuses: Map<string, EntryStatus>;

  constructor() {
    this.orders = new Map();
    this.staffBooks = new Map();
    this.entryStatuses = new Map();
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderBySno(sno: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.sno === sno);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      ...insertOrder,
      link: insertOrder.link || null,
      additional: insertOrder.additional || null,
      staffName: insertOrder.staffName || null,
      deliveryStatus: insertOrder.deliveryStatus || "pending",
      id,
      createdAt: new Date()
    };
    
    // Remove existing order with same sno
    const existing = await this.getOrderBySno(insertOrder.sno);
    if (existing) {
      this.orders.delete(existing.id);
    }
    
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(sno: string, updateData: Partial<InsertOrder>): Promise<Order> {
    const existing = await this.getOrderBySno(sno);
    if (!existing) {
      throw new Error(`Order with sno ${sno} not found`);
    }
    
    const updated: Order = { ...existing, ...updateData };
    this.orders.set(existing.id, updated);
    return updated;
  }

  async deleteOrder(sno: string): Promise<void> {
    const existing = await this.getOrderBySno(sno);
    if (existing) {
      this.orders.delete(existing.id);
    }
  }

  // Staff Book
  async getStaffBook(): Promise<StaffBook[]> {
    return Array.from(this.staffBooks.values());
  }

  async createStaffBook(insertStaffBook: InsertStaffBook): Promise<StaffBook> {
    const id = randomUUID();
    const staffBook: StaffBook = { 
      ...insertStaffBook, 
      id,
      createdAt: new Date()
    };
    this.staffBooks.set(id, staffBook);
    return staffBook;
  }

  async deleteStaffBook(billbookRange: string): Promise<void> {
    const existing = Array.from(this.staffBooks.values()).find(sb => sb.billbookRange === billbookRange);
    if (existing) {
      this.staffBooks.delete(existing.id);
    }
  }

  // Entry Status
  async getEntryStatuses(): Promise<EntryStatus[]> {
    return Array.from(this.entryStatuses.values());
  }

  async getEntryStatusesBySno(sno: string): Promise<EntryStatus[]> {
    return Array.from(this.entryStatuses.values()).filter(es => es.sno === sno);
  }

  async createEntryStatus(insertEntryStatus: InsertEntryStatus): Promise<EntryStatus> {
    const id = randomUUID();
    const entryStatus: EntryStatus = { 
      ...insertEntryStatus,
      package: insertEntryStatus.package ?? false,
      id,
      createdAt: new Date()
    };
    this.entryStatuses.set(id, entryStatus);
    return entryStatus;
  }

  async deleteEntryStatus(id: string): Promise<void> {
    this.entryStatuses.delete(id);
  }
}

export const storage = new MemStorage();
