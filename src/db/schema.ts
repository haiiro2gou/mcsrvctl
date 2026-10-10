import { primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const build = sqliteTable(
    "build",
    {
        guildId: text("guild_id").notNull(),
        name: text("name").notNull(),
        alias: text("alias").notNull(),
    },
    t => [
        primaryKey({ columns: [t.guildId, t.name] }),
        unique().on(t.guildId, t.alias),
    ]
);

export const notifyChannel = sqliteTable("notify_channel", {
    guildId: text("guild_id").primaryKey(),
    channelId: text("channel_id").notNull(),
    messageId: text("message_id").notNull(),
});

export type Build = typeof build.$inferSelect;
