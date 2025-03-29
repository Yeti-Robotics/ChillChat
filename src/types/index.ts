import { Client } from "discord.js";

export interface Config {
  token: string;
  guildId: string;
  modmailCategoryId: string;
  anonymousChannelId: string;
  logChannelId?: string;
}

export interface ModmailChannel {
  userId: string;
  channelId: string;
}

export interface ExtendedClient extends Client {
  config: Config;
  modmailChannels: Map<string, ModmailChannel>;
}
