// Variable pour stocker le nom de la commande
let autoTagCommand = "autotag"; // nom par défaut

// Commande pour définir le nom
if (command === "setcmd") {
    if (!isOwner) return conn.sendMessage(from, { text: "❌ Seul le propriétaire peut modifier le nom de la commande." });

    if (!args[0]) return conn.sendMessage(from, { text: "⚠️ Donne le nouveau nom, exemple : !setcmd appelarmée" });

    autoTagCommand = args[0].toLowerCase();
    return conn.sendMessage(from, { text: `✅ Nouvelle commande définie : *!${autoTagCommand}*` });
}

// Commande auto-tag dynamique
if (command === autoTagCommand) {

    const members = groupMetadata.participants.map(p => p.id);

    let message = "🔥 𝐋𝐚 𝐃𝐢𝐚𝐛𝐥𝐞𝐬𝐬𝐞 𝐢𝐧𝐯𝐨𝐪𝐮𝐞 𝐥𝐞 𝐠𝐫𝐨𝐮𝐩𝐞 🔥\n\n";
    message += members.map(u => `@${u.split("@")[0]}`).join(" ");

    await conn.sendMessage(from, { text: message, mentions: members });
}

 
