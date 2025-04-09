import {
  ChatInputCommandInteraction,
  MessageFlags,
  TextChannel,
} from "discord.js";
import ChannelKV from "../database/models/ChannelKV";
import { ExtendedClient } from "../../types";
import { generateEmbed, logToChannel } from "../utils/embed";

export default async function close(
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

  const reason = interaction.options.getString("reason", true);

  await interaction.reply({
    content: `Closing thread... ${reason}`,
    flags: MessageFlags.Ephemeral,
  });

  try {
    const user = await client.users.fetch(modmailEntry.authorId);
    await user.send(
      generateEmbed(
        "Mentormail Thread Closed",
        `Your modmail thread has been closed. Reason: ${reason}`,
        user,
        0xff0000
      )
    );

    // Log thread closure
    const channel = interaction.channel;
    const channelName =
      channel && !channel.isDMBased() ? channel.name : "Unknown";
    await logToChannel(
      client,
      "Modmail Thread Closed",
      `Closed by: ${interaction.user.tag}\nUser: ${user.tag}\nChannel: ${channelName}\nReason: ${reason}`,
      0xff0000
    );
  } catch (error) {
    console.error("Error closing thread:", error);
    await logToChannel(
      client,
      "Error Closing Thread",
      `Staff Member: ${interaction.user.tag}\nError: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      0xff0000
    );
  }

  await ChannelKV.deleteOne({ channelId: interaction.channelId });
  await interaction.channel?.delete();
}
