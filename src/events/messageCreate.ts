import {
  Events,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  type Message,
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

// Check if the URL is included
function containsURL(input: string): boolean {
  // URL regular expression
  const urlRegex =
    /https?:\/\/(?:www\.|[a-zA-Z0-9-]+\.)[a-zA-Z0-9.-]+(?<!discord\.com)(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?/g;

  // Determine if a regular expression is matched
  return urlRegex.test(input);
}

export default {
  name: Events.MessageCreate,
  async execute(message: Message): Promise<void> {
    if (message.author.bot || !message.inGuild()) return;

    const channels = process.env.CHANNEL_ID?.split(",");
    if (!channels?.includes(message.channel.id)) return;

    if (containsURL(message.content)) {
      if (message.content.startsWith("!")) return;
      const content = message.content;

      const ok = new ButtonBuilder()
        .setCustomId("send")
        .setLabel("SEND")
        .setStyle(ButtonStyle.Secondary);

      const ng = new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("CANCEL")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(ok, ng);

      const reply = await message.reply({
        components: [row.toJSON()],
      });

      message.delete();

      interface InteractionFilter {
        user: {
          id: string;
        };
      }

      const filter = (interaction: InteractionFilter): boolean => {
        return interaction.user.id === message.author.id;
      };

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "send") {
          await message.channel.send(
            content + `\n\nThis message was posted by <@${message.author.id}>`,
          );
          await interaction.update({
            components: [],
            content: "The message has been sent.",
          });
        } else {
          await interaction.update({
            components: [],
            content: "The message has been canceled.",
          });

          await interaction.followUp({
            content: content,
            ephemeral: true,
          });
        }
      });

      collector.on("end", async () => {
        await reply.delete();
      });
    }
  },
};
