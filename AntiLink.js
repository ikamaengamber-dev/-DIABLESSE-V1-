import fs from "fs";

export const name = "antilink";

export async function execute(sock, msg, args) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const text = args[0];

  if (!["on", "off"].includes(text)) {
    await sock.sendMessage(from, {
      text: "🌺 *Usage correct, esclave :* .antilink on / off\n🍷 Active ou désactive la chasse aux liens. Choisis avec sagesse.",
    }, { quoted: msg });
    return;
  }

  const config = JSON.parse(fs.readFileSync("./antilink.json"));
  config.status = text;
  fs.writeFileSync("./antilink.json", JSON.stringify(config, null, 2));

  await sock.sendMessage(from, {
    text: `🍒 *AntiLink activé par la Diablesse :* ${text.toUpperCase()}\n🚫 Gare à ceux qui oseront défier mes règles.`,
  }, { quoted: msg });
}
