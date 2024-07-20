const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'pilot',
    description: 'Retrieve VATSIM pilot details by callsign',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'callsign',
            description: 'Callsign of the VATSIM pilot',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        try {
            const callsign = interaction.options.getString('callsign');
            const response = await axios.get('https://data.vatsim.net/v3/vatsim-data.json');
            
            if (response.status === 200) {
                const vatsimData = response.data;

                // Find the pilot in vatsimData
                const pilot = vatsimData.pilots.find(pilot => pilot.callsign.toLowerCase() === callsign.toLowerCase());
                
                if (!pilot) {
                    throw new Error('Pilot not found');
                }

                // Create an embed with pilot details and flight plan
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`VATSIM Pilot Details: ${pilot.name} (${pilot.callsign})`)
                    .addFields(
                        { name: 'CID', value: pilot.cid.toString() || 'N/A', inline: true },
                        { name: 'Name', value: pilot.name || 'N/A', inline: true },
                        { name: 'Server', value: pilot.server || 'N/A', inline: true },
                        { name: 'Transponder', value: pilot.transponder.toString() || 'N/A', inline: true },
                        { name: 'Flight Rules', value: pilot.flight_plan.flight_rules || 'N/A', inline: true },
                        { name: 'Aircraft', value: pilot.flight_plan.aircraft_short || 'N/A', inline: true },
                        { name: 'Departure', value: pilot.flight_plan.departure || 'N/A', inline: true },
                        { name: 'Arrival', value: pilot.flight_plan.arrival || 'N/A', inline: true },
                        { name: 'Alternate', value: pilot.flight_plan.alternate || 'N/A', inline: true },
                        { name: 'Cruise TAS', value: pilot.flight_plan.cruise_tas || 'N/A', inline: true },
                        { name: 'Altitude', value: pilot.flight_plan.altitude || 'N/A', inline: true },
                        { name: 'Departure Time', value: pilot.flight_plan.deptime || 'N/A', inline: true },
                        { name: 'Enroute Time', value: pilot.flight_plan.enroute_time || 'N/A', inline: true },
                        { name: 'Remarks', value: pilot.flight_plan.remarks || 'N/A', inline: true },
                        { name: 'Assigned Transponder', value: pilot.flight_plan.assigned_transponder || 'N/A', inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } else {
                throw new Error('Failed to fetch VATSIM data');
            }
        } catch (error) {
            console.error('Error fetching VATSIM data:', error);
            await interaction.reply('Failed to fetch VATSIM pilot details. Please try again later.');
        }
    }
};
