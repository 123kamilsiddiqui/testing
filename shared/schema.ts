import { pgTable, text, varchar, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sno: varchar("sno").notNull().unique(),
  product: text("product").notNull(),
  additional: text("additional"),
  oDate: varchar("o_date").notNull(), // order date
  dDate: varchar("d_date").notNull(), // delivery date
  tel: varchar("telephone").notNull(),
  link: text("link"), // image link
  deliveryStatus: varchar("delivery_status").notNull().default("pending"),
  staffName: text("staff_name"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const staffBook = pgTable("staff_book", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billbookRange: varchar("billbook_range").notNull().unique(), // e.g., "301-350"
  staffName: text("staff_name").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const entryStatus = pgTable("entry_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sno: varchar("sno").notNull(),
  product: text("product").notNull(),
  package: boolean("package").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertStaffBookSchema = createInsertSchema(staffBook).omit({
  id: true,
  createdAt: true,
});

export const insertEntryStatusSchema = createInsertSchema(entryStatus).omit({
  id: true,
  createdAt: true,
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type StaffBook = typeof staffBook.$inferSelect;
export type InsertStaffBook = z.infer<typeof insertStaffBookSchema>;
export type EntryStatus = typeof entryStatus.$inferSelect;
export type InsertEntryStatus = z.infer<typeof insertEntryStatusSchema>;
