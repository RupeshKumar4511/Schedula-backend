import { pgTable, serial, text, varchar, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['member', 'patient', 'doctor', 'admin']);

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    image: text('image'),
    password: text('password'),
    role: roleEnum('role').default('patient').notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    provider_id: varchar('provider_id', { length: 255 }).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Role = 'member' | 'patient' | 'doctor' | 'admin';

export type User = {
    id: number;
    email: string;
    name: string;
    image: string | null;
    password: string | null;
    role: Role;
    provider: string;
    provider_id: string;
    created_at: string | Date;
};

export const otps = pgTable('otps', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 32 }).notNull(),
    expires_at: timestamp('expires_at').notNull(),
    used: boolean('used').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export type OtpRow = {
    id: number;
    email: string;
    code: string;
    expires_at: string | Date;
    used: boolean;
    created_at: string | Date;
};
