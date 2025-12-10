// 🌺 Diablesse V0.1🍒
// === INDEX PRINCIPAL DU BOT ===
// Version : v1.0.0 (𝐃𝐢𝐚𝐛𝗹𝐞𝘀𝘀𝗲 Build Private Lock)

import makeWASocket, {
useMultiFileAuthState,
fetchLatestBaileysVersion,
DisconnectReason,
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import readline from "readline";
import dotenv from "dotenv";
import { Boom } from "@hapi/boom";

dotenv.config();

// === Interface console ===
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// === Config globale ===
const PREFIX = process.env.PREFIX || ".";
const MODE_FILE = "./mode.json";

// === Gestion du mode (public / private) ===
function getMode() {
if (!fs.existsSync(MODE_FILE)) {
fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: "private" }, null, 2));
}
const data = JSON.parse(fs.readFileSync(MODE_FILE));
return data.mode || "private";
}

function setMode(newMode) {
fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: newMode }, null, 2));
}

// === Helpers universels ===
function normalizeJid(jid) {
if (!jid) return null;
return jid.split(":")[0].replace("@lid", "@s.whatsapp.net");
}
function getBareNumber(input) {
if (!input) return "";
return String(input).split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
}
function unwrapMessage(m) {
return (
m?.ephemeralMessage?.message ||
m?.viewOnceMessageV2?.message ||
m?.documentWithCaptionMessage?.message ||
m
);
}
function pickText(m) {
return (
m?.conversation ||
m?.extendedTextMessage?.text ||
m?.imageMessage?.caption ||
m?.videoMessage?.caption ||
null
);
}
function loadSudo() {
const file = "./sudo.json";
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ sudo: [] }, null, 2));
return JSON.parse(fs.readFileSync(file)).sudo;
}

// === Fonction principale ===
async function startDiablesse() {
const { state, saveCreds } = await useMultiFileAuthState("./session");
const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({
version,
printQRInTerminal: false,
logger: pino({ level: "silent" }),
auth: state,
browser: ["Ubuntu", "Chrome", "𝐃𝐢𝐚𝐛𝗹𝐞𝘀𝘀𝗲"],
});

// === Appairage automatique ===
try {
if (!state?.creds?.registered) {
let number = (process.env.OWNER_NUMBER || "").trim();
if (!number && process.stdin.isTTY) {
number = (await ask(chalk.cyan("📱 Entre ton numéro WhatsApp (ex: 2420XXXXXXXX): "))).trim();
}

  if (!number) {
    console.log(chalk.red("❌ Aucun numéro saisi."));
  } else {
    const resp = await sock.requestPairingCode(number);
    const code = typeof resp === "string" ? resp : resp?.code || null;
    if (code) {
      console.log(chalk.green("\n✅ Code d’appairage : ") + chalk.yellow(code.split("").join(" ")));
    } else {
      console.log(chalk.red("⚠️ Aucun code reçu. Essaie de redémarrer."));
    }
  }
}

} catch (e) {
console.log(chalk.red("❌ Erreur appairage:"), e);
}

// === Chargement automatique des commandes ===
const commands = {};
const cmdPath = path.join(process.cwd(), "commands");
if (!fs.existsSync(cmdPath)) fs.mkdirSync(cmdPath, { recursive: true });

for (const file of fs.readdirSync(cmdPath).filter((f) => f.endsWith(".js"))) {
try {
const cmd = await import(path.join(cmdPath, file));
if (cmd.name && typeof cmd.execute === "function") {
commands[cmd.name.toLowerCase()] = cmd;
console.log(chalk.greenBright("⚡ Commande chargée : ${cmd.name}"));
}
} catch (err) {
console.log(chalk.red("Erreur chargement ${file}:"), err);
}
}

// Watcher pour recharger automatiquement les nouvelles commandes
fs.watch(cmdPath, { recursive: false }, async (eventType, filename) => {
if (filename && filename.endsWith(".js")) {
console.log("🔄 Détection de modification / ajout de commande: ${filename}");
}
});

// === Gestion des connexions ===
sock.ev.on("connection.update", async (update) => {
const { connection, lastDisconnect, qr } = update;

if (qr) console.log(chalk.yellow("📸 Scanne le QR code vite !"));
if (connection === "open") {
  console.log(chalk.greenBright("🌺 Démarrage Diablesse V0.1 🌺🍒"));
  console.log(chalk.cyanBright("✅ Connecté à WhatsApp avec succès !"));

  const ownerId = normalizeJid(sock.user?.id);
  const ownerBare = getBareNumber(ownerId);
  const ownerLid = sock.user?.lid ? getBareNumber(sock.user.lid) : null;

  global.owners = [ownerBare];
  if (ownerLid) global.owners.push(ownerLid);

  if (!fs.existsSync("./.boot")) {
    fs.writeFileSync("./.boot", "ok");
    console.log(chalk.magentaBright("⚠️ Premier lancement détecté → redémarrage dans 5s..."));
    setTimeout(() => process.exit(1), 5000);
  }
} else if (connection === "close") {
  const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
  console.log(chalk.red("💀 Déconnecté — Code:", reason));
  if (reason !== DisconnectReason.loggedOut) {
    console.log(chalk.yellow("🔁 Tentative de reconnexion dans 5s..."));
    setTimeout(startDiablesse, 5000);
  } else {
    console.log(chalk.red("🚫 Session expirée → Supprime ./session et relance."));
  }
}

});

sock.ev.on("creds.update", saveCreds);

// === Gestion des messages ===
sock.ev.on("messages.upsert", async ({ messages }) => {
for (const msg of messages) {
if (!msg.message) continue;
const from = msg.key.remoteJid;
const isGroup = from.endsWith("@g.us");
let sender = msg.key.fromMe ? sock.user.id : msg.key.participant || from;
sender = normalizeJid(sender);
const senderNum = getBareNumber(sender);
const text = pickText(unwrapMessage(msg.message));
if (!text) continue;

  const mode = getMode();
  const sudo = loadSudo().map((x) => String(x).replace(/[^0-9]/g, ""));
  const allowed = [...(global.owners || []), ...sudo];

  if (mode === "private" && !allowed.includes(senderNum)) return;

  // === ANTI-LINK SYSTEM 🌺 ===
  const antiLinkConfig = fs.existsSync("./antilink.json") 
    ? JSON.parse(fs.readFileSync("./antilink.json")) 
    : { status: "off", warnings: {} };
  const antiLinkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|bit\.ly|tinyurl\.com)/i;

  if (antiLinkConfig.status === "on" && isGroup && antiLinkRegex.test(text)) {
    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants
      .filter(p => p.admin)
      .map(p => getBareNumber(p.id));

    const isAdmin = admins.includes(senderNum);

    if (!global.owners.includes(senderNum) && !sudo.includes(senderNum) && !isAdmin) {
      await sock.sendMessage(from, { react: { text: "🍒", key: msg.key } });
      await sock.sendMessage(from, { delete: { remoteJid: from, id: msg.key.id, participant: sender } });

      if (!antiLinkConfig.warnings[senderNum]) antiLinkConfig.warnings[senderNum] = 0;
      antiLinkConfig.warnings[senderNum] += 1;
      fs.writeFileSync("./antilink.json", JSON.stringify(antiLinkConfig, null, 2));

      const warn = antiLinkConfig.warnings[senderNum];
      if (warn < 3) {
        await sock.sendMessage(from, { text: `🍒 Lien détecté !\n⚠️ @${senderNum} → Avertissement ${warn}/3`, mentions: [sender] });
      } else {
        await sock.groupParticipantsUpdate(from, [sender], "remove");
        await sock.sendMessage(from, { text: `🍒 @${senderNum} expulsé après 3 warnings`, mentions: [sender] });
        delete antiLinkConfig.warnings[senderNum];
        fs.writeFileSync("./antilink.json", JSON.stringify(antiLinkConfig, null, 2));
      }
    }
  }

  // === AUTO TAG SYSTEM 🌺 ===
  const autoTagConfig = fs.existsSync("./autotag.json") 
    ? JSON.parse(fs.readFileSync("./autotag.json")) 
    : { status: "off", users: [] };
  if (autoTagConfig.status === "on" && isGroup) {
    for (let user of autoTagConfig.users) {
      user = String(user).replace(/[^0-9]/g, "");
      if (user === senderNum) {
        await sock.sendMessage(from, { text: `🌺 Mention automatique : @${senderNum}`, mentions: [sender] });
      }
    }
  }

  // === ANTI MESSAGE SYSTEM 🍒 ===
  const antiMsgConfig = fs.existsSync("./antimsg.json") 
    ? JSON.parse(fs.readFileSync("./antimsg.json")) 
    : { status: "off", messages: [] };
  if (antiMsgConfig.status === "on" && isGroup) {
    for (let blockedMsg of antiMsgConfig.messages) {
      if (text.toLowerCase().includes(blockedMsg.toLowerCase())) {
        await sock.sendMessage(from, { react: { text: "🌺", key: msg.key } });
        await sock.sendMessage(from, { delete: { remoteJid: from, id: msg.key.id, participant: sender } });
        await sock.sendMessage(from, { text: `🌺 Message interdit détecté et supprimé !` });
      }
    }
  }

  if (!text.startsWith(PREFIX)) return;

  const args = text.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "mode" && allowed.includes(senderNum)) {
    const newMode = args[0];
    if (!["public", "private"].includes(newMode)) {
      await sock.sendMessage(from, { text: "⚙️ Usage : .mode public / private" }, { quoted: msg });
      return;
    }
    setMode(newMode);
    await sock.sendMessage(from, { text: `✅ Mode changé → *${newMode.toUpperCase()}*` }, { quoted: msg });
    console.log(chalk.blue(`🔁 Mode changé par ${senderNum} → ${newMode}`));
    return;
  }

  if (commands[cmd]) {
    try {
      await commands[cmd].execute(sock, msg, args);
      console.log(chalk.green(`✅ Commande exécutée : ${cmd}`));
    } catch (err) {
      console.log(chalk.red(`Erreur ${cmd}:`), err);
      await sock.sendMessage(from, { text: "⚠️ Une erreur est survenue." }, { quoted: msg });
    }
  }
}

});
}

// === Lancement ===
startDiablesse().catch((e) => {
console.log(chalk.red("❌ Erreur fatale:"), e);
try { rl.close(); } catch {}
process.exit(1);
});
