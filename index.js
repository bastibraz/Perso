require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, WebhookClient } = require('discord.js');

// ---------------------------------------------------
// Fake serveur pour Render (évite les erreurs de port)
// ---------------------------------------------------
const app = express();
app.get('/', (req, res) => res.send('Bot is running.'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fake webserver running on port ${PORT}`));

// ---------------------------------------------------
// Discord Client
// ---------------------------------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ---------------------------------------------------
// Charger le JSON correctement
// ---------------------------------------------------
const reponsesPath = path.join(__dirname, 'reponses.json');
let reponses = {};

try {
    const raw = fs.readFileSync(reponsesPath, 'utf8');
    reponses = JSON.parse(raw).reponses;
} catch (err) {
    console.error("❌ Impossible de charger reponses.json :", err);
}

// Liste des catégories valides
const categories = ['travail', 'études', 'personnel', 'amour', 'autre'];

// ---------------------------------------------------
// Fonction : Créer/récupérer salon + webhook
// ---------------------------------------------------
async function getPlaintesWebhook(guild) {

    let channel = guild.channels.cache.find(c =>
        c.name === 'plaintes' && c.type === 0
    );

    // Créer le salon si nécessaire
    if (!channel) {
        channel = await guild.channels.create({
            name: 'plaintes',
            type: 0,
            topic: 'Salon pour déposer vos plaintes',
            reason: 'Creation automatique'
        });
    }

    // Chercher webhook existant
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(w => w.name === 'Bot Plaintes');

    // Créer webhook si absent
    if (!webhook) {
        webhook = await channel.createWebhook({
            name: 'Bot Plaintes',
            avatar: guild.client.user.displayAvatarURL(),
            reason: 'Webhook auto'
        });
    }

    return webhook;
}

// ---------------------------------------------------
// Fonction : réponse aléatoire
// ---------------------------------------------------
function getRandomResponse(cat) {
    if (!reponses[cat]) cat = "autre";
    const list = reponses[cat];
    return list[Math.floor(Math.random() * list.length)];
}

// ---------------------------------------------------
// Bot Ready
// ---------------------------------------------------
client.on('ready', () => {
    console.log(`✅ Bot connecté : ${client.user.tag}`);
});

// ---------------------------------------------------
// Commande !plainte
// ---------------------------------------------------
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.content.startsWith('!plainte')) {

        // Exemple : !plainte amour Mon crush m’a ghost
        const args = message.content.slice(8).trim().split(' ');
        const category = args[0]?.toLowerCase();
        const plainte = args.slice(1).join(' ').trim();

        if (!categories.includes(category)) {
            return message.reply(`⚠️ Catégorie invalide. Choisis parmi : ${categories.join(', ')}`);
        }

        if (!plainte) {
            return message.reply("⚠️ Mets une plainte après la catégorie !");
        }

        try {
            // Récupération Webhook
            const webhook = await getPlaintesWebhook(message.guild);
            const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });

            // Envoi de la plainte
            const plainteMsg = await webhookClient.send({
                content: `📢 Nouvelle plainte **(${category})** de **${message.author.tag}** :\n${plainte}`,
                username: "Bot Plaintes",
                wait: true
            });

            // Réponse aléatoire perso
            const randomResponse = getRandomResponse(category);
            await message.reply(randomResponse);

            // ---- Création du sondage ----
            const poll = await webhookClient.send({
                content: `📊 **Sondage :** Que pensez-vous de cette plainte ?`,
                username: "Sondage",
                wait: true
            });

            const channel = message.guild.channels.cache.get(webhook.channelId);
            const pollMessage = await channel.messages.fetch(poll.id);
            await pollMessage.react('👍');
            await pollMessage.react('👎');

        } catch (err) {
            console.error("❌ Erreur :", err);
            message.reply("Une erreur est survenue en envoyant la plainte.");
        }
    }
});

client.login(process.env.BOT_TOKEN);
