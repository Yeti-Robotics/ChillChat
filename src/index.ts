import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
} from "discord.js";
import { config as dotenvConfig } from "dotenv";
import { ExtendedClient } from "./types";
import { connectToDatabase } from "./lib/database/database";
import ChannelKV from "./lib/database/models/ChannelKV";
import { anonymous, respond, close } from "./lib/commands";
import { generateEmbed, logToChannel } from "./lib/utils/embed";

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

// Handle DM messages
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots and messages in guilds
  if (message.author.bot || message.guild) return;

  try {
    // Check if there's an existing modmail channel for this user
    const existingChannel = await ChannelKV.findOne({
      authorId: message.author.id,
    }).catch(() => null);

    if (existingChannel) {
      // Forward message to existing channel
      const channel = await client.channels.fetch(existingChannel.channelId);
      if (channel?.isTextBased() && channel.isSendable()) {
        await channel.send(
          generateEmbed(
            "Incoming Message",
            message.content,
            message.author,
            0x00ff00
          )
        );
        await message.reply({
          content:
            "I passed along this message :slight_smile:. I'll keep you updated here with any responses!",
        });

        // Log the incoming message
        await logToChannel(
          client,
          "Incoming Modmail Message",
          `User: ${message.author.tag}\nChannel: ${
            !channel.isDMBased() ? channel.name : "Unknown"
          }\nMessage: ${message.content}`,
          0x00ff00
        );
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

        await ChannelKV.create({
          authorId: message.author.id,
          channelId: channel.id,
        });

        await channel.send(
          generateEmbed(
            "New Mentormail Thread",
            `Thread started by ${message.author.tag}\n\nMessage:\n${message.content}`,
            message.author,
            0x00ff00
          )
        );

        // Log new thread creation
        await logToChannel(
          client,
          "New Modmail Thread Created",
          `User: ${message.author.tag}\nChannel: ${channel.name}\nInitial Message: ${message.content}`,
          0x00ff00
        );
      }

      await message.reply(
        generateEmbed(
          "Mentormail Thread Opened",
          "I've opened a new thread for you. I'll get back to you as soon as your mentors respond!",
          message.author,
          0x00ff00
        )
      );
    }
  } catch (error) {
    console.error("Error handling message:", error);
    await logToChannel(
      client,
      "Error Handling Message",
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      0xff0000
    );
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    switch (interaction.commandName) {
      case "anonymous":
        await anonymous(client, interaction);
        break;
      case "respond":
        await respond(client, interaction);
        break;
      case "close":
        await close(client, interaction);
        break;
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

client.on(Events.ClientReady, async () => {
  await connectToDatabase();
  client.user?.setActivity("for questions/feedback", {
    type: ActivityType.Watching,
  });
});

// Login to Discord
client.login(client.config.token);
