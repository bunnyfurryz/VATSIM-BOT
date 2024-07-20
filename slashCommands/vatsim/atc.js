const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'atc',
    description: 'Retrieve information about a specific ATC on VATSIM by callsign',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'callsign',
            description: 'The callsign of the ATC to search for',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        await interaction.deferReply();

        const callsign = interaction.options.getString('callsign').toUpperCase();

        // Loading embed
        const loadingEmbed = new EmbedBuilder()
            .setTitle("Loading...")
            .setDescription("Fetching ATC data, please wait.")
            .setColor('#ffa500');

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Delay for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            // Fetch data from the VATSIM API for controllers
            const response = await axios.get('https://data.vatsim.net/v3/vatsim-data.json');

            // Check if controllers data is available
            if (!response.data || !response.data.controllers) {
                return interaction.editReply('No ATC data available from VATSIM.');
            }

            // Parse JSON data
            const atcData = response.data.controllers;

            // Find the ATC based on the callsign
            const atc = atcData.find(controller => controller.callsign.toUpperCase() === callsign);

            // Check if the ATC was found
            if (!atc) {
                return interaction.editReply(`No ATC found with the callsign ${callsign} on VATSIM.`);
            }

            // Fetch the rating from the VATSIM API using the CID
            const ratingResponse = await axios.get(`https://api.vatsim.net/api/ratings/${atc.cid}/`);
            const ratingNumber = ratingResponse.data.rating || 'N/A';

            // Map rating numbers to their corresponding strings
            const ratingMap = {
                1: 'S1',
                2: 'S2',
                3: 'S3',
                4: 'C1',
                6: 'C3',
                7: 'I1',
                9: 'I3',
                10: 'SUP',
                11: 'ADM',
            };

            const rating = ratingMap[ratingNumber] || 'N/A';

            // Determine which rating to display
            let displayedRating;
            if (rating !== 'I1') {
                displayedRating = 'C1';
            } else if (rating !== 'I3') {
                displayedRating = 'I1';
            } else {
                displayedRating = rating; // Show actual rating if it's I3
            }

            // Prepare the embed with the ATC information
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`ATC Information for ${callsign} on VATSIM`)
                .addFields(
                    { name: 'Name', value: `${atc.name || 'N/A'}`, inline: true },
                    { name: 'CID', value: `${atc.cid}`, inline: true },
                    { name: 'Callsign', value: `${atc.callsign}`, inline: true },
                    { name: 'Frequency', value: `${atc.frequency}`, inline: true },
                    { name: 'Server', value: `${atc.server}`, inline: true },
                    { name: 'Rating', value: displayedRating, inline: true },
                )
                .setTimestamp();

            // Respond with embed
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching VATSIM data:', error);
            await interaction.editReply('Failed to fetch data from VATSIM. Please try again later.');
        }
    },
};
