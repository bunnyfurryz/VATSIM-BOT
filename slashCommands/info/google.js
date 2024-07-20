const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'search',
    description: 'Search for a term on Google',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'name',
            description: 'The term to search for',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const name = encodeURIComponent(interaction.options.getString('name'));
        const link = `https://www.google.com/search?q=${name}`;

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`I have found the following for: \`${name}\``)
            .addFields([
                {
                    name: `🔗┇Link`,
                    value: `[Click here to see the link](${link})`,
                    inline: true,
                },
            ]);

        await interaction.reply({ embeds: [embed] });
    },
};
