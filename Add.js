 Diablesse 🍒 v0.1 — Commande Add
// Ajoute un membre dans le groupe avec élégance royale 👠💅

// Créateur : Matsu

export const name = "add";

export async function execute(sock, msg, args) {
  try {
    const from = msg.key.remoteJid;

    // Vérifie si c’est un groupe
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { 
        text: "🩸 *Tsk...* Cette magie ne fonctionne que dans les royaumes publics (groupes)." 
      }, { quoted: msg });
    }

    // Num du user qui invoque
    const sender = msg.key.fromMe ? sock.user.id : msg.key.participant;
    const senderNum = sender.split("@")[0].replace(/[^0-9]/g, "");

    // Vérification permissions
    const allowed = [...(global.owners || [])];
    if (!allowed.includes(senderNum)) {
      return await sock.sendMessage(from, { 
        text: "🚫 *Tsk...* Tu n’as pas le sang noble nécessaire pour invoquer cette magie." 
      }, { quoted: msg });
    }

    // Numéro à ajouter
    if (!args[0]) {
      return await sock.sendMessage(from, { 
        text: "💅 Usage : *.add 237XXXXXXXX*" 
      }, { quoted: msg });
    }

    let number = args[0].replace(/[^0-9]/g, "");
    if (number.length < 8) {
      return await sock.sendMessage(from, { 
        text: "❌ *Numéro pathétique, essaie à nouveau.*" 
      }, { quoted: msg });
    }

    const jid = number + "@s.whatsapp.net";

    // 👠 Début du rituel
    await sock.sendMessage(from, { 
      text: `🌺 *La Diablesse prépare le trône...*\nAjout imminent de @${number} dans le royaume.` ,
      mentions: [jid] 
    }, { quoted: msg });

    await sock.groupParticipantsUpdate(from, [jid], "add");

    // ✅ Confirmation royale
    await sock.sendMessage(from, { 
      text: `🍒 *Succès !* @${number} est maintenant soumis à la volonté de la Diablesse 😈`,
      mentions: [jid] 
    }, { quoted: msg });

  } catch (e) {
    console.log("💥 Erreur add (Diablesse) :", e);
    await sock.sendMessage(msg.key.remoteJid, { 
      text: "❌ *Tch... Même la Diablesse peut se tromper.* Impossible d’ajouter ce numéro." 
    }, { quoted: msg });
  }
  }
