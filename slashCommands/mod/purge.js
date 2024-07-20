const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'purge',
    description: 'Delete a specified number of messages from the channel',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'amount',
            description: 'The number of messages to delete (max 50)',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const amount = interaction.options.getInteger('amount');

        // Check permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "You don't have permission to manage messages!", ephemeral: true });
        }

        if (amount > 50) {
            return interaction.reply({ content: "I cannot delete more than 50 messages at a time!", ephemeral: true });
        }

        if (amount < 1) {
            return interaction.reply({ content: "I cannot delete less than 1 message!", ephemeral: true });
        }

        try {
            const messages = await interaction.channel.bulkDelete(amount + 1, true);
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`Successfully deleted ${messages.size} messages.`);

            const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

            // Auto-delete the reply message after 3 seconds
            setTimeout(() => {
                reply.delete().catch(err => console.error('Error deleting reply:', err));
            }, 3000);

        } catch (err) {
            console.error('Error deleting messages:', err);
            await interaction.reply({ content: "There was an error trying to delete messages in this channel!", ephemeral: true });
        }
    },
};
