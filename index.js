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

client.on('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) return; // ignore DM si tu veux

  if (message.content.startsWith('!plainte')) {
    const plainte = message.content.slice(8).trim();
    if (!plainte) return message.reply("Merci de préciser ta plainte après la commande !");

    try {
      const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
      await webhookClient.send({
        content: `📢 Nouvelle plainte de **${message.author.tag}** :\n${plainte}`,
        username: 'Bot Plaintes'
      });
      await message.reply("Ta plainte a bien été enregistrée, merci !");
    } catch (error) {
      console.error('Erreur lors de l’envoi de la plainte :', error);
      await message.reply("Une erreur est survenue, merci de réessayer plus tard.");
    }
  }
});

client.login(process.env.BOT_TOKEN);
