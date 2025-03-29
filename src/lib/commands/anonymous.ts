import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { ExtendedClient } from "../../types";

export default async function anonymous(
  client: ExtendedClient,
  interaction: ChatInputCommandInteraction
) {
  const message = interaction.options.getString("message", true);

  // Get the anonymous channel from the main guild
  const guild = await client.guilds.fetch(client.config.guildId);
  const anonymousChannel = await guild.channels.fetch(
    client.config.anonymousChannelId
  );

  if (!anonymousChannel?.isTextBased()) {
    await interaction.reply({
      content: "Failed to send anonymous feedback. Please try again later.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await anonymousChannel.send({
    embeds: [
      {
        title: "Anonymous Feedback",
        description: message,
        color: 0x0099ff,
        timestamp: new Date().toISOString(),
      },
    ],
  });

  await interaction.reply({
    content: "Your anonymous feedback has been sent!",
    flags: MessageFlags.Ephemeral,
  });
}
