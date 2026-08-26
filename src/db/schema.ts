import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const rolEnum = pgEnum('rol', ['alumno', 'admin']);
export const categoriaEnum = pgEnum('categoria', [
  'audifonos',
  'telefono',
  'lentes',
  'ropa',
  'llaves',
  'usb',
  'otros',
]);
export const estadoObjetoEnum = pgEnum('estado_objeto', [
  'disponible',
  'reclamado',
  'archivado',
]);
export const estadoReclamoEnum = pgEnum('estado_reclamo', [
  'pendiente',
  'aprobado',
  'rechazado',
]);
export const custodiaEnum = pgEnum('custodia', ['prefectura', 'reportador']);

// 1. Usuarios
// Auth.js expects: name, email, emailVerified, image
// We map them to Spanish column names in the DB but keep JS field names compatible
export const usuarios = pgTable('usuarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('nombre', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('imagen'),
  telefono: varchar('telefono', { length: 50 }),
  rol: rolEnum('rol').default('alumno').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// 2. Objetos
export const objetos = pgTable('objetos', {
  id: uuid('id').defaultRandom().primaryKey(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  descripcion: text('descripcion'),
  categoria: categoriaEnum('categoria').notNull(),
  ubicacion: varchar('ubicacion', { length: 255 }),
  custodia: custodiaEnum('custodia').default('prefectura').notNull(),
  telefonoContacto: varchar('telefono_contacto', { length: 50 }),
  fechaEncontrado: timestamp('fecha_encontrado', { mode: 'date' }).notNull(),
  estado: estadoObjetoEnum('estado').default('disponible').notNull(),
  reportadoPor: uuid('reportado_por')
    .references(() => usuarios.id)
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// 3. Fotos
export const fotos = pgTable('fotos', {
  id: uuid('id').defaultRandom().primaryKey(),
  objetoId: uuid('objeto_id')
    .references(() => objetos.id, { onDelete: 'cascade' })
    .notNull(),
  url: text('url').notNull(),
  orden: integer('orden').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// 4. Reclamos
export const reclamos = pgTable('reclamos', {
  id: uuid('id').defaultRandom().primaryKey(),
  objetoId: uuid('objeto_id')
    .references(() => objetos.id)
    .notNull(),
  reclamadoPor: uuid('reclamado_por')
    .references(() => usuarios.id)
    .notNull(),
  estado: estadoReclamoEnum('estado').default('pendiente').notNull(),
  notas: text('notas'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// 5. Accounts (Auth.js)
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('userId')
      .references(() => usuarios.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

// 6. Sessions (Auth.js)
export const sessions = pgTable('sessions', {
  sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
  userId: uuid('userId')
    .references(() => usuarios.id, { onDelete: 'cascade' })
    .notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// 7. VerificationTokens (Auth.js)
export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// Relations
export const usuariosRelations = relations(usuarios, ({ many }) => ({
  objetos: many(objetos),
  reclamos: many(reclamos),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const objetosRelations = relations(objetos, ({ one, many }) => ({
  reportadoPor: one(usuarios, {
    fields: [objetos.reportadoPor],
    references: [usuarios.id],
  }),
  fotos: many(fotos),
  reclamos: many(reclamos),
}));

export const fotosRelations = relations(fotos, ({ one }) => ({
  objeto: one(objetos, {
    fields: [fotos.objetoId],
    references: [objetos.id],
  }),
}));

export const reclamosRelations = relations(reclamos, ({ one }) => ({
  objeto: one(objetos, {
    fields: [reclamos.objetoId],
    references: [objetos.id],
  }),
  usuario: one(usuarios, {
    fields: [reclamos.reclamadoPor],
    references: [usuarios.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [accounts.userId],
    references: [usuarios.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [sessions.userId],
    references: [usuarios.id],
  }),
}));

// TypeScript Types
export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;
export type Objeto = typeof objetos.$inferSelect;
export type NewObjeto = typeof objetos.$inferInsert;
export type Foto = typeof fotos.$inferSelect;
export type NewFoto = typeof fotos.$inferInsert;
export type Reclamo = typeof reclamos.$inferSelect;
export type NewReclamo = typeof reclamos.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
