const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

module.exports = {
    name: 'timeouts',
    description: 'Timeout a member with a role change',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'member',
            description: 'The member to timeout',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'duration',
            description: 'Duration for the timeout (e.g., 10s, 1d, 4hr)',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        const member = interaction.options.getUser('member');
        const durationInput = interaction.options.getString('duration');
        
        // Parse duration
        const duration = parseDuration(durationInput);
        if (!duration) {
            return interaction.reply({ content: 'Invalid duration format. Use formats like 10s, 1d, or 4hr.', ephemeral: true });
        }

        // Define the role IDs
        const originalRoleId = '1262825706572873768'; // Replace with actual role ID
        const timeoutRoleId = '1262825720111955978'; // Replace with actual timeout role ID

        const guildMember = await interaction.guild.members.fetch(member.id).catch(() => null);
        if (!guildMember) {
            return interaction.reply({ content: 'Member not found in the server.', ephemeral: true });
        }

        try {
            // Remove the original role and add the timeout role
            await guildMember.roles.remove(originalRoleId);
            await guildMember.roles.add(timeoutRoleId);

            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('Member Timed Out')
                .addFields(
                    { name: 'Member', value: `${member.tag} (${member.id})`, inline: true },
                    { name: 'Duration', value: durationInput, inline: true },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Set a timeout to restore the role
            setTimeout(async () => {
                await guildMember.roles.remove(timeoutRoleId);
                await guildMember.roles.add(originalRoleId);
                const restoreEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('Timeout Ended')
                    .addFields(
                        { name: 'Member', value: `${member.tag} (${member.id})`, inline: true },
                        { name: 'Status', value: 'Role restored.', inline: true },
                    )
                    .setTimestamp();

                // Send a message in the channel or log
                await interaction.channel.send({ embeds: [restoreEmbed] });
            }, duration);

        } catch (error) {
            console.error('Error during timeout:', error);
            await interaction.reply({ content: 'Failed to timeout the member. Please check my permissions.', ephemeral: true });
        }
    },
};

// Function to parse duration
function parseDuration(duration) {
    const regex = /^(\d+)(s|m|h|d|w)$/;
    const match = duration.match(regex);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000; // seconds to milliseconds
        case 'm': return value * 60 * 1000; // minutes to milliseconds
        case 'h': return value * 60 * 60 * 1000; // hours to milliseconds
        case 'd': return value * 24 * 60 * 60 * 1000; // days to milliseconds
        case 'w': return value * 7 * 24 * 60 * 60 * 1000; // weeks to milliseconds
        default: return null;
    }
}
