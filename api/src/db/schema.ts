import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  public_key: varchar("public_key", { length: 1024 }),
  asymmetric_key: varchar("asymmetric_key", { length: 2048 }),
});

export type User = typeof users.$inferSelect;

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  hash: varchar("hash", { length: 255 }).notNull(),
  content: text("content").notNull(),
  signature: varchar("signature", { length: 1024 }).notNull(),
  userId: serial("user_id").references(() => users.id),
});

export type File = typeof files.$inferSelect;
