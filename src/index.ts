import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
} from "discord.js";
import { config as dotenvConfig } from "dotenv";
import { ExtendedClient } from "./types";

// Load environment variables
dotenvConfig();

// Validate required environment variables
const requiredEnvVars = [
  "DISCORD_TOKEN",
  "GUILD_ID",
  "MODMAIL_CATEGORY_ID",
  "ANONYMOUS_CHANNEL_ID",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    // GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
}) as ExtendedClient;

// Initialize config
client.config = {
  token: process.env.DISCORD_TOKEN!,
  guildId: process.env.GUILD_ID!,
  modmailCategoryId: process.env.MODMAIL_CATEGORY_ID!,
  anonymousChannelId: process.env.ANONYMOUS_CHANNEL_ID!,
  logChannelId: process.env.LOG_CHANNEL_ID,
};

// Initialize modmail channels map
client.modmailChannels = new Map();

// Handle DM messages
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots and messages in guilds
  if (message.author.bot || message.guild) return;

  try {
    // Check if there's an existing modmail channel for this user
    const existingChannel = client.modmailChannels.get(message.author.id);

    if (existingChannel) {
      // Forward message to existing channel
      const channel = await client.channels.fetch(existingChannel.channelId);
      if (channel?.isTextBased() && channel.isSendable()) {
        await channel.send({
          embeds: [
            {
              title: "New DM",
              description: message.content,
              color: 0x0099ff,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
    } else {
      // Create new modmail channel
      const guild = await client.guilds.fetch(client.config.guildId);
      const category = await guild.channels.fetch(
        client.config.modmailCategoryId
      );

      if (category) {
        const channel = await guild.channels.create({
          name: `modmail-${message.author.username}`,
          type: 0, // Text channel
          parent: client.config.modmailCategoryId,
        });

        client.modmailChannels.set(message.author.id, {
          userId: message.author.id,
          channelId: channel.id,
        });

        await channel.send({
          embeds: [
            {
              title: "New Modmail Thread",
              description: `Thread started by ${message.author.tag}\n\nFirst message:\n${message.content}`,
              color: 0x0099ff,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
    }
  } catch (error) {
    console.error("Error handling DM:", error);
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "anonymous") {
      const message = interaction.options.getString("message", true);

      // Get the anonymous channel from the main guild
      const guild = await client.guilds.fetch(client.config.guildId);
      const anonymousChannel = await guild.channels.fetch(
        client.config.anonymousChannelId
      );

      if (!anonymousChannel?.isTextBased()) {
        await interaction.reply({
          content: "Failed to send anonymous message. Please try again later.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await anonymousChannel.send({
        embeds: [
          {
            title: "Anonymous Message",
            description: message,
            color: 0x0099ff,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      await interaction.reply({
        content: "Your anonymous message has been sent!",
        flags: MessageFlags.Ephemeral,
      });
    } else if (interaction.commandName === "respond") {
      // Check if the command is used in a modmail channel
      const modmailEntry = Array.from(client.modmailChannels.values()).find(
        (entry) => entry.channelId === interaction.channelId
      );

      if (!modmailEntry) {
        await interaction.reply({
          content: "This command can only be used in modmail channels!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const message = interaction.options.getString("message", true);

      try {
        const user = await client.users.fetch(modmailEntry.userId);
        await user.send(`**Staff Response:** ${message}`);

        await interaction.reply({
          content: "Response sent successfully!",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error("Error sending DM to user:", error);
        await interaction.reply({
          content: "Failed to send response. Please try again later.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  } catch (error) {
    console.error("Error handling interaction:", error);
    if (interaction.isChatInputCommand()) {
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

// Login to Discord
client.login(client.config.token);
