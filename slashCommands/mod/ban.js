const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Ban a member from the server',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'member',
            description: 'The member to ban',
            type: ApplicationCommandOptionType.User,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        const member = interaction.options.getUser('member');

        // Create a modal for the ban reason
        const modal = new ModalBuilder()
            .setCustomId('banModal')
            .setTitle('Ban Member');

        const reasonInput = new TextInputBuilder()
            .setCustomId('banReason')
            .setLabel('Reason for ban')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

        // Handle modal submission
        const filter = (i) => i.customId === 'banModal' && i.user.id === interaction.user.id;
        const submitted = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(() => null);

        if (!submitted) {
            return interaction.followUp('You did not provide a reason in time.');
        }

        const reason = submitted.fields.getTextInputValue('banReason');

        // Attempt to ban the member
        const guildMember = await interaction.guild.members.fetch(member.id).catch(() => null);
        if (!guildMember) {
            return submitted.reply({ content: 'Member not found in the server.', ephemeral: true });
        }

        try {
            await guildMember.ban({ reason });
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Member Banned')
                .addFields(
                    { name: 'Member', value: `${member.tag} (${member.id})`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                )
                .setTimestamp();

            await submitted.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error banning member:', error);
            await submitted.reply({ content: 'Failed to ban the member. Please check my permissions.', ephemeral: true });
        }
    },
};
