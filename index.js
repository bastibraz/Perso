require('dotenv').config();
const { Client, GatewayIntentBits, WebhookClient, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Charger les réponses depuis le JSON
const reponsesPath = path.join(__dirname, 'reponses.json');
let reponses = [];
try {
    const data = fs.readFileSync(reponsesPath, 'utf8');
    reponses = JSON.parse(data).reponses;
} catch (err) {
    console.error('Erreur lors du chargement des réponses :', err);
}

// Catégories disponibles
const categories = ['travail', 'études', 'personnel', 'autre'];

// Fonction pour récupérer ou créer le channel "plaintes" et son webhook
async function getPlaintesWebhook(guild) {
    // Chercher le channel
    let channel = guild.channels.cache.find(c => c.name === 'plaintes' && c.type === 0); // 0 = GUILD_TEXT
    if (!channel) {
        // Créer le channel si inexistant
        channel = await guild.channels.create({
            name: 'plaintes',
            type: 0,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ManageChannels]
                }
            ]
        });
    }

    // Chercher un webhook existant
    let webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(w => w.name === 'Bot Plaintes');
    if (!webhook) {
        // Créer le webhook si inexistant
        webhook = await channel.createWebhook({
            name: 'Bot Plaintes',
            avatar: client.user.displayAvatarURL()
        });
    }

    return webhook;
}

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return; // ignore DM

    if (message.content.startsWith('!plainte')) {
        const args = message.content.slice(8).trim().split(' ');
        const category = args[0].toLowerCase();
        const plainte = args.slice(1).join(' ').trim();

        if (!categories.includes(category)) {
            return message.reply(`Merci de préciser une catégorie valide : ${categories.join(', ')}`);
        }
        if (!plainte) return message.reply("Merci de préciser ta plainte après la catégorie !");

        try {
            // Récupérer ou créer le channel et webhook
            const webhook = await getPlaintesWebhook(message.guild);
            const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });

            // Envoyer la plainte via le webhook
            const sentMessage = await webhookClient.send({
                content: `📢 Nouvelle plainte (${category}) de **${message.author.tag}** :\n${plainte}`,
                username: 'Bot Plaintes',
                wait: true
            });

            // Réponse aléatoire à l'utilisateur
            const randomMessage = reponses[Math.floor(Math.random() * reponses.length)];
            await message.reply(randomMessage);

            // ----------------------------
            // Créer le sondage via webhook
            // ----------------------------
            const pollMessage = await webhookClient.send({
                content: `📊 **Sondage** : Que pensez-vous de cette plainte ?\n_${plainte}_`,
                username: 'Sondage Bot',
                wait: true
            });

            // Ajouter réactions pour voter
            const channel = message.guild.channels.cache.get(webhook.channelId);
            const msg = await channel.messages.fetch(pollMessage.id);
            await msg.react('👍');
            await msg.react('👎');

        } catch (error) {
            console.error('Erreur lors de l’envoi de la plainte :', error);
            await message.reply("Une erreur est survenue, merci de réessayer plus tard.");
        }
    }
});

client.login(process.env.BOT_TOKEN);
