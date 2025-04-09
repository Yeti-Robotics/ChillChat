import {
  ChatInputCommandInteraction,
  MessageFlags,
  User,
  TextChannel,
} from "discord.js";
import { ExtendedClient } from "../../types";
import ChannelKV from "../database/models/ChannelKV";
import { generateEmbed, logToChannel } from "../utils/embed";

export default async function respond(
  client: ExtendedClient,
  interaction: ChatInputCommandInteraction
) {
  const modmailEntry = await ChannelKV.findOne({
    channelId: interaction.channelId,
  });

  if (!modmailEntry) {
    await interaction.reply({
      content: "This command can only be used in modmail channels!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const message = interaction.options.getString("message", true);

  try {
    const user = await client.users.fetch(modmailEntry.authorId);
    const sender = await client.users.fetch(interaction.user.id);
    await user.send(
      generateEmbed("Mentormail Response", message, sender, 0x00ff00)
    );
    await interaction.reply({
      content: "Response sent successfully!",
      flags: MessageFlags.Ephemeral,
    });

    // Log the response
    const channel = interaction.channel;
    const channelName =
      channel && !channel.isDMBased() ? channel.name : "Unknown";
    await logToChannel(
      client,
      "Staff Response Sent",
      `Staff Member: ${sender.tag}\nUser: ${user.tag}\nChannel: ${channelName}\nResponse: ${message}`,
      0x00ff00
    );
  } catch (error) {
    console.error("Error sending DM to user:", error);
    await interaction.reply({
      content: "Failed to send response. Please try again later.",
      flags: MessageFlags.Ephemeral,
    });

    // Log the error
    await logToChannel(
      client,
      "Error Sending Response",
      `Staff Member: ${interaction.user.tag}\nError: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      0xff0000
    );
  }
}
