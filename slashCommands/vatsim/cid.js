const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const request = require('request');

module.exports = {
  name: 'cid',
  description: 'Search a user by their CID',
  cooldown: 3000,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'cid',
      type: ApplicationCommandOptionType.String,
      description: 'The VATSIM CID to search for',
      required: true,
    },
    {
      name: 'email',
      type: ApplicationCommandOptionType.Boolean,
      description: 'Include email information (if available)',
      required: false,
    },
  ],
  run: async (client, interaction) => {
    const cid = interaction.options.getString('cid');
    const includeEmail = interaction.options.getBoolean('email') || false;

    // Loading embed
    const loadingEmbed = new EmbedBuilder()
      .setTitle("Loading...")
      .setDescription("Fetching user data, please wait.")
      .setColor('#ffa500');

    await interaction.deferReply();
    await interaction.editReply({ embeds: [loadingEmbed] });

    // Delay for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fetch user data from the VATSIM API v2
    request(`https://api.vatsim.net/v2/members/${cid}`, { json: true }, (err, res, memberData) => {
      if (err) {
        console.error(err);
        return interaction.editReply({ content: 'An error occurred while fetching user data.', ephemeral: true });
      }

      if (res.statusCode === 200) {
        // Fetch user ratings data
        request(`https://api.vatsim.net/api/ratings/${cid}/`, { json: true }, (err, res, mainBody) => {
          if (err) {
            console.error(err);
            return interaction.editReply({ content: 'An error occurred while fetching user ratings.', ephemeral: true });
          }

          if (res.statusCode === 200) {
            // Fetch rating times to get hours
            request(`https://api.vatsim.net/api/ratings/${cid}/rating_times`, { json: true }, (err, res, body) => {
              if (err) {
                console.error(err);
                return interaction.editReply({ content: 'An error occurred while fetching rating times.', ephemeral: true });
              }

              if (res.statusCode === 200) {
                const userData = body?.pilots?.find(pilot => pilot.cid === Number(cid));
                const controllerData = body?.controllers?.find(controller => controller.cid === Number(cid));

                const hoursControlling = body.atc || 0; // Default to 0 if undefined
                const hoursFlying = body.pilot || 0; // Default to 0 if undefined
                const hoursS1 = body.s1 || 0;
                const hoursS2 = body.s2 || 0;
                const hoursS3 = body.s3 || 0;
                const hoursC1 = body.c1 || 0;
                const hoursC3 = body.c3 || 0;
                const hoursI1 = body.i1 || 0;
                const hoursI3 = body.i3 || 0;
                const hoursSUP = body.sup || 0;

                const joinVatsimDate = memberData?.reg_date ? new Date(memberData.reg_date) : null;
                const joinVatsimFormatted = joinVatsimDate ? `${joinVatsimDate.getDate()}/${joinVatsimDate.getMonth() + 1}/${joinVatsimDate.getFullYear()}` : 'Unknown';

                let suspensionInfo = null;
                if (mainBody.rating === 0) {
                  suspensionInfo = "Permanently Suspended";
                } else if (mainBody.susp_date) {
                  const suspDate = new Date(mainBody.susp_date);
                  suspensionInfo = `Suspended until ${suspDate.getDate()}/${suspDate.getMonth() + 1}/${suspDate.getFullYear()}`;
                }

                const status = parseStatus(userData, controllerData);

                const embed = new EmbedBuilder()
                  .setTitle(`Results for: ${cid}`)
                  .addFields(
                    { name: '**__User Information__**', value: 
                      `> **CID**: \`${cid}\`
                      > **Join VATSIM**: ${joinVatsimFormatted}
                      > **Pilot Rating**: ${mainBody.pilotrating !== undefined ? parsePilotRating(mainBody.pilotrating) : 'No Rating Found in the Database'}
                      > **Military Rating**: ${mainBody.militaryRating !== undefined ? parseMilitaryRating(mainBody.militaryRating) : 'No Military Rating `(M0)`'}
                      > **Suspension Date**: ${suspensionInfo || 'Not Suspended'}
                      > **ATC Rating**: ${parseRating(mainBody.rating)}
                      > **Home Facility**: ${parseRegion(mainBody.region)}, ${parseDivision(mainBody.division)}
                      ${includeEmail ? `> **Email**: ${memberData?.email || 'Not available'}` : ''}` },
                    { name: '**__Hours__**', value: 
                      `> **Total Hours**: ${parseTime(hoursControlling + hoursFlying)}
                      > **Pilot Hours**: ${parseTime(hoursFlying)}
                      > **ATC Hours**: ${parseTime(hoursControlling)}
                      > **S1 Hours**: ${parseTime(hoursS1)}
                      > **S2 Hours**: ${parseTime(hoursS2)}
                      > **S3 Hours**: ${parseTime(hoursS3)}
                      > **C1 Hours**: ${parseTime(hoursC1)}
                      > **C3 Hours**: ${parseTime(hoursC3)}
                      > **I1 Hours**: ${parseTime(hoursI1)}
                      > **I3 Hours**: ${parseTime(hoursI3)}
                      > **SUP Hours**: ${parseTime(hoursSUP)}` },
                    { name: '**__Current Status__**', value: 
                      `**Current Status**: ${status}` },
                  )
                  .setTimestamp()
                  .setFooter({ text: "Not for real-world use. Bot Coded By Bunny. Information Provided by VATSIM and VATSIM API", iconURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhnkzcac6J0K2G9ShDbwDSv20wK_2P6Q-D_Q&s' });

                return interaction.editReply({ embeds: [embed] });
              } else {
                console.log(body);
                return interaction.editReply({ content: 'Failed to fetch rating times.', ephemeral: true });
              }
            });
          } else {
            console.log(mainBody);
            return interaction.editReply({ content: 'Failed to fetch user ratings.', ephemeral: true });
          }
        });
      } else {
        console.log(memberData);
        return interaction.editReply({ content: 'Failed to fetch user data from VATSIM API v2.', ephemeral: true });
      }
    });
  },
};

function parseRegion(region) {
  return region || 'Unknown';
}

function parseDivision(division) {
  return division || 'Unknown';
}

function parseRating(rating) {
  switch (rating) {
    case -1: return "Inactive - `INAC`";
    case 0: return "Suspended - `SUS`";
    case 1: return "Observer - `OBS`";
    case 2: return "Tower Trainee - `S1`";
    case 3: return "Tower Controller - `S2`";
    case 4: return "Senior Student - `S3`";
    case 5: return "Enroute Controller - `C1`";
    case 7: return "Senior Controller - `C3`";
    case 8: return "Instructor - `I1`";
    case 10: return "Senior Instructor - `I3`";
    case 11: return "Supervisor - `SUP`";
    case 12: return "Administrator - `ADM`";
    default: return "No Rating Found in the Database";
  }
}

function parsePilotRating(rating) {
  switch (rating) {
    case 0: return "Basic Member - `NEW`";
    case 1: return "Private Pilot Licence - `PPL`";
    case 3: return "Instrument Rating - `IR`";
    case 7: return "Commercial Multi-Engine License - `CMEL`";
    case 15: return "Airline Transport Pilot License - `ATPL`";
    default: return "No Rating Found in the Database"; // Default to No Rating Found if unknown
  }
}

function parseMilitaryRating(rating) {
  switch (rating) {
    case undefined:
      return "No Military Rating `(M0)`";
    case 21: return "Military Pilot License - `M1`";
    case 22: return "Military Instrument Rating - `M2`";
    case 23: return "Military Multi-Engine Rating - `M3`";
    case 24: return "Military Mission Ready Pilot - `M4`";
    default: return "Unknown";
  }
}


function parseTime(time) {
  const sign = time < 0 ? "-" : "";
  const hour = Math.floor(Math.abs(time));
  const min = Math.floor((Math.abs(time) * 60) % 60);
  return `${sign}${hour < 10 ? '0' : ''}${hour}:${min < 10 ? '0' : ''}${min}`;
}

function parseStatus(userData, controllerData) {
  if (userData && userData.callsign) {
    return `Online as ${userData.callsign}`;
  } else if (controllerData && controllerData.callsign) {
    return `Online as ${controllerData.callsign}`;
  } else {
    return "Offline in the network";
  }
}
