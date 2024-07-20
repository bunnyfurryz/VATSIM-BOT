const { ActivityType } = require('discord.js');
const client = require('..');
const chalk = require('chalk');


client.on("ready", () => {
    const activities = [
        { 
            name: `${client.guilds.cache.size} Members`, 
            type: ActivityType.Streaming, 
            url: 'https://www.twitch.tv/anime' 
        }
    ];
    const status = 'dnd'; // Set status to 'invisible' to appear offline

    let i = 0;
    setInterval(() => {
        if (i >= activities.length) i = 0;
        client.user.setActivity(activities[i].name, { type: activities[i].type, url: activities[i].url });
        i++;
    }, 5000);

    let s = 0;
    setInterval(() => {
        if (s >= status.length) s = 0;
        client.user.setStatus(status);
        s++;
    }, 30000);


    console.log(chalk.red(`Logged in as ${client.user.tag}!`));
});


