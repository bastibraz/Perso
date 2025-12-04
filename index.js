// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, WebhookClient } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const WEBHOOK_URL = process.env.WEBHOOK_URL;
if (!process.env.BOT_TOKEN) {
  console.error('Erreur : BOT_TOKEN non défini dans les variables d’environnement.');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

// Charger les réponses depuis le JSON
const reponsesPath = path.join(__dirname, 'reponses.json');
let reponses = [];

try {
    const data = fs.readFileSync(reponsesPath, 'utf8');
    reponses = JSON.parse(data).reponses;
} catch (err) {
    console.error('Erreur lors du chargement des réponses :', err);
}

const categories = ['travail', 'études', 'personnel', 'amour', 'autre'];

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return; // ignore DM

    if (message.content.startsWith('!plainte')) {
        const args = message.content.slice(8).trim().split(' ');
        const category = args[0].toLowerCase();

        if (!categories.includes(category)) {
            return message.reply(`Merci de préciser une catégorie valide : ${categories.join(', ')}`);
        }

        const plainte = args.slice(1).join(' ').trim();
        if (!plainte) return message.reply("Merci de préciser ta plainte après la catégorie !");

        try {
            const webhookClient = new WebhookClient({ url: WEBHOOK_URL });

            await webhookClient.send({
                content: `📢 Nouvelle plainte (${category}) de **${message.author.tag}** :\n${plainte}`,
                username: 'Bot Plaintes'
            });

            // Choisir un message aléatoire dans la liste
            const randomMessage = reponses[Math.floor(Math.random() * reponses.length)];
            await message.reply(randomMessage);

            // ----------------------------
            // Création du sondage via webhook
            // ----------------------------
            const pollMessage = await webhookClient.send({
                content: `📊 **Sondage** : Que pensez-vous de cette plainte ?\n_${plainte}_`,
                username: 'Sondage Bot'
            });

            // Ajouter réactions pour voter
            // Note : Pour ajouter les réactions, il faut récupérer le message dans le client Discord
            const channel = message.channel;
            const msg = await channel.messages.fetch(pollMessage.id);
            await pollMessage.react('✅');
            await pollMessage.react('❌');

        } catch (error) {
            console.error('Erreur lors de l’envoi de la plainte :', error);
            await message.reply("Une erreur est survenue, merci de réessayer plus tard.");
        }
    }
});

client.login(process.env.BOT_TOKEN);
