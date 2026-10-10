import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const build = sqliteTable(
    "build",
    {
        guildId: text("guild_id").notNull(),
        name: text("name").notNull(),
        alias: text("alias").notNull(),
    },
    t => [primaryKey({ columns: [t.guildId, t.name] })]
);

export const notifyChannel = sqliteTable("notify_channel", {
    guildId: text("guild_id").primaryKey(),
    channelId: text("channel_id").notNull(),
    messageId: text("message_id").notNull(),
});

export type Build = typeof build.$inferSelect;
