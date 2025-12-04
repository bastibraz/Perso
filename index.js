
const { Client, GatewayIntentBits, WebhookClient } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1445935021440503900/qQ4uu0LINmhDoWCRg5_jx5AS0H5mZ6tonLbJnM_vTQXUjiy6xdcLHqrnGT0XG_CIdmA9';

client.on('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async message => {

  if (message.author.bot) return;

  if (message.content.startsWith('!plainte')) {
    const plainte = message.content.slice(8).trim();

    if (!plainte) {
      return message.reply("Merci de préciser ta plainte après la commande !");
    }

    try {
      const webhookClient = new WebhookClient({ url: WEBHOOK_URL });

      await webhookClient.send({
        content: `📢 Nouvelle plainte de **${message.author.tag}** :\n${plainte}`,
        username: 'Bot Plaintes'
      });

      await message.reply("Ta plainte a bien été enregistrée, merci !");
    } catch (error) {
      console.error(error);
      await message.reply("Une erreur est survenue, merci de réessayer plus tard.");
    }
  }
});

client.login('MTQ0NTkyNjA4NDMyMjI2NzE5MA.GpvOTC.31SRqZc0efKcT_6DCmrInPODLuQ-NBMXStV9uU');
