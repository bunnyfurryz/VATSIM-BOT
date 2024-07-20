const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    name: 'metar',
    description: 'Get the metar for a given airport ICAO.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'airport',
            description: 'Specify the airport ICAO code (e.g., EGLL)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        await interaction.deferReply();

        const airport = interaction.options.getString('airport').split(" ");
        
        if (airport.length === 0) {
            return interaction.editReply("You must specify an ICAO code.");
        }

        // Loading embed
        const loadingEmbed = new EmbedBuilder()
            .setTitle("Loading...")
            .setDescription("Fetching METAR data, please wait.")
            .setColor('#ffa500');

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Delay for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
            const formatAirport = airport.join(",");
            const response = await axios.get(`https://api.checkwx.com/metar/${formatAirport}`, {
                headers: { "X-API-Key": process.env.WX_API }
            });

            if (response.data.results !== 0) {
                const embed = new EmbedBuilder()
                    .setTitle(`Metar Results`)
                    .setColor('#0099ff');

                response.data.data.forEach((result, i) => {
                    embed.addFields({
                        name: airport[i],
                        value: `\`\`\`${result}\`\`\``,
                        inline: false,
                    });
                });

                return interaction.editReply({ embeds: [embed] });
            } else {
                return interaction.editReply(`A Metar is not available for your requested airports ${airport.join(", ")}, please ensure you have entered valid ICAO codes.`);
            }
        } catch (error) {
            console.error('Error fetching METAR data:', error);
            return interaction.editReply('There was an error fetching the Metar data. Please try again later.');
        }
    },
};
