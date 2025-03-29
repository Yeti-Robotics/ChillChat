import { User, Client, TextChannel } from "discord.js";

export function generateEmbed(
  title: string,
  message: string,
  sender: User,
  color: number = 0x0099ff
) {
  return {
    embeds: [
      {
        title: title,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        author: {
          name: sender.username,
          icon_url: sender.displayAvatarURL(),
        },
      },
    ],
  };
}

export async function logToChannel(
  client: Client,
  title: string,
  message: string,
  color: number = 0x0099ff
) {
  const config = (client as any).config;
  if (!config?.logChannelId) return;

  try {
    const channel = await client.channels.fetch(config.logChannelId);
    if (channel && channel.isSendable()) {
      await channel.send({
        embeds: [
          {
            title: title,
            description: message,
            color: color,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }
  } catch (error) {
    console.error("Error logging to channel:", error);
  }
}
