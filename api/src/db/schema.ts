import { pgTable, serial, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  public_key: varchar("public_key", { length: 1024 }),
  symmetric_key: varchar("symmetric_key", { length: 2048 }),
});

export type User = typeof users.$inferSelect;

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  hash: varchar("hash", { length: 255 }).notNull(),
  // Keep as text but store base64 encoded data
  content: text("content").notNull(),
  signature: varchar("signature", { length: 1024 }).notNull(),
  userId: serial("user_id").references(() => users.id),
  size: integer("size").notNull(),
  contentType: varchar("content_type", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  path: text("path").notNull(),
});

export type File = typeof files.$inferSelect;
