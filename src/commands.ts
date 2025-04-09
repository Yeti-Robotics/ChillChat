import {
  InteractionContextType,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const dmCommands = [
  new SlashCommandBuilder()
    .setName("anonymous")
    .setDescription("Send an anonymous message")
    .setContexts(InteractionContextType.BotDM)
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send anonymously")
        .setRequired(true)
    ),
];

const guildCommands = [
  new SlashCommandBuilder()
    .setName("respond")
    .setDescription("Respond to a modmail thread")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Your response to send to the user")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close the modmail thread")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for closing the thread")
        .setRequired(true)
    ),
];

// Validate required environment variables
const requiredEnvVars = ["DISCORD_TOKEN", "CLIENT_ID"] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: guildCommands }
    );

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: dmCommands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error refreshing commands:", error);
    process.exit(1);
  }
})();
