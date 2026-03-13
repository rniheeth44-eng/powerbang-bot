
const path = require("path");

// WEB SERVER FOR 24/7 UPTIME
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(3000, () => {
  console.log("Web server running.");
});

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js")

const { QuickDB } = require("quick.db")
const db = new QuickDB()

const ASSETS = path.join(__dirname, "../assets")

// Images are served from GitHub raw URLs (works on any host, no server needed)
const GITHUB_IMG = "https://raw.githubusercontent.com/rniheeth44-eng/powerbang-bot/main/assets"
const IMG_BASE = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/images`
  : GITHUB_IMG

if (!process.env.TOKEN) {
  console.error("ERROR: TOKEN environment variable is not set.")
  process.exit(1)
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
})

const prefix  = "."
const ownerID = "1278638641752707094"

const C = {
  BLUE:   0x5865F2,
  GREEN:  0x57F287,
  RED:    0xED4245,
  YELLOW: 0xFEE75C,
  GOLD:   0xF5C518,
  GREY:   0x2B2D31,
  PURPLE: 0x9B59B6,
  TEAL:   0x1ABC9C,
}

const ok  = (title, desc) => new EmbedBuilder().setColor(C.GREEN) .setTitle(`✅ ${title}`).setDescription(desc).setTimestamp()
const err = (title, desc) => new EmbedBuilder().setColor(C.RED)   .setTitle(`❌ ${title}`).setDescription(desc).setTimestamp()
const inf = (title, desc) => new EmbedBuilder().setColor(C.BLUE)  .setTitle(`📋 ${title}`).setDescription(desc).setTimestamp()

async function isAdmin(member, guildId) {
  if (member.id === ownerID) return true
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true
  const adminRoleId = await db.get(`adminrole_${guildId}`)
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true
  return false
}

async function isTicketStaff(member, guildId) {
  if (await isAdmin(member, guildId)) return true
  const ticketRoleId = await db.get(`ticketrole_${guildId}`)
  if (ticketRoleId && member.roles.cache.has(ticketRoleId)) return true
  return false
}

const helpSessions = new Map()

const HELP_PAGES = [
  {
    title: "🔍 Bot Help Menu",
    color: C.BLUE,
    description:
      "Welcome to the Bot help system! Use the buttons below to navigate between command categories.\n\n" +
      "📋 **Categories Available:**\n" +
      "1. 🎫 Ticket & Middleman\n" +
      "2. ⚙️ Configuration & Setup\n" +
      "3. 👀 View & Info Commands\n" +
      "4. 🤝 Vouch System\n" +
      "5. ⚠️ Warning System\n" +
      "6. 🔧 Utility Commands\n" +
      "7. 👤 User Management\n" +
      "8. 👑 Bot Owner Only\n" +
      "9. 🎮 Support System\n\n" +
      "✏️ **How to Use:**\n" +
      "• Use the navigation buttons to browse categories\n" +
      "• Only the person who used `.help` can use the buttons\n" +
      "• Click ❌ to close this menu\n" +
      "• Commands automatically time out after 60 seconds\n\n" +
      "🔑 **Permission Legend:**\n" +
      "• **(admin)**: Requires admin role\n" +
      "• **(ticket staff)**: Requires ticket role or admin role\n" +
      "• **(anyone)**: Everyone can use",
  },
  {
    title: "🎫 Ticket & Middleman Commands",
    color: C.BLUE,
    description:
      "**Ticket Staff = Admin role or Ticket role**\n\n" +
      "**.ticketpanel** (ticket staff)\nSends the ticket panel\n\n" +
      "**.support** (ticket staff)\nSends the support request panel\n\n" +
      "**.adduser** (ticket staff)\nAdd user to ticket\n\n" +
      "**.claim** (ticket staff)\nClaim a ticket\n\n" +
      "**.unclaim** (ticket staff)\nUnclaim a ticket\n\n" +
      "**.close** (ticket staff)\nClose a ticket\n\n" +
      "**.confirm** (ticket staff)\nTrade confirmation\n\n" +
      "**.mmfee** (ticket staff)\nMM fee options\n\n" +
      "**.hitbyjp** (anyone)\nMercy command (ticket only)\n\n" +
      "**.guide** (anyone)\nHitting guide\n\n" +
      "**.mminfo** (anyone)\nHow MM works",
  },
  {
    title: "⚙️ Configuration & Setup Commands",
    color: C.PURPLE,
    description:
      "**.setadminrole** (admin)\nSet admin role\n\n" +
      "**.setticketrole** (admin)\nAdd ticket role\n\n" +
      "**.remticketrole** (admin)\nRemove ticket role\n\n" +
      "**.setmercyrole** (admin)\nSet mercy role\n\n" +
      "**.remmercyrole** (admin)\nRemove mercy role\n\n" +
      "**.setprofit** (admin)\nSet user profit\n\n" +
      "**.setlimit** (admin)\nSet user limit\n\n" +
      "**.setvouches** (admin)\nSet user vouches\n\n" +
      "**.autorole** (admin)\nSet auto-role\n\n" +
      "**.autoroledisable** (admin)\nDisable auto-role",
  },
  {
    title: "👀 View & Info Commands",
    color: C.TEAL,
    description:
      "**.viewticketrole** (anyone)\nView ticket roles\n\n" +
      "**.viewmercyrole** (anyone)\nView mercy role\n\n" +
      "**.viewadminrole** (anyone)\nView admin roles\n\n" +
      "**.search** (anyone)\nView user profit/limit\n\n" +
      "**.warns** (anyone)\nView user warnings\n\n" +
      "**.w** (anyone)\nUser info\n\n" +
      "**.av** (anyone)\nView avatar/banner\n\n" +
      "**.vouchcount** (anyone)\nView user vouches\n\n" +
      "**.debug** (anyone)\nCheck bot status\n\n" +
      "**.autoroleview** (anyone)\nView auto-role\n\n" +
      "**.autorolestats** (anyone)\nAuto-role stats\n\n" +
      "**.serverinfo** (anyone)\nServer information",
  },
  {
    title: "🤝 Vouch System",
    color: C.GOLD,
    description:
      "**.vouch** (anyone)\nVouch for someone\n\n" +
      "**.vouchcount** (anyone)\nView vouch count\n\n" +
      "**.setvouches** (admin)\nSet user vouches",
  },
  {
    title: "⚠️ Warning System",
    color: C.YELLOW,
    description:
      "**.warn** (admin)\nWarn a user\n\n" +
      "**.removewarn** (admin)\nRemove a warning\n\n" +
      "**.clearwarns** (admin)\nClear all warnings\n\n" +
      "**.warns** (anyone)\nView warnings",
  },
  {
    title: "🔧 Utility Commands",
    color: C.GREY,
    description:
      "**.purge** (admin)\nDelete messages (1–100)\n\n" +
      "**.afk** (anyone)\nSet AFK status\n\n" +
      "**.announce** (admin)\nSend an announcement embed\n\n" +
      "**.steal** (anyone)\nSteal/add emoji to server (requires Manage Emojis)",
  },
  {
    title: "👤 User Management",
    color: C.RED,
    description:
      "**.addrole** (admin)\nAdd role to user\n\n" +
      "**.ban** (admin)\nBan user\n\n" +
      "**.unban** (admin)\nUnban user\n\n" +
      "**.mute** (admin)\nTimeout user\n\n" +
      "**.unmute** (admin)\nRemove timeout",
  },
  {
    title: "👑 Bot Owner Only",
    color: C.GOLD,
    description:
      "**.remove** (bot owner)\nRemove bot from server\n\n" +
      "**.approve** (bot owner)\nApprove server initialization\n\n" +
      "**.killbug** (bot owner)\nKill bot in server\n\n" +
      "**.initialize** (anyone)\nRequest bot initialization",
  },
  {
    title: "🎮 Support System",
    color: C.GREEN,
    description:
      "**Auto-role automatically assigns a role to all new members**\n\n" +
      "**.autorole @role** (admin)\nSet auto-role\n\n" +
      "**.autoroleview** (anyone)\nView current auto-role\n\n" +
      "**.autoroledisable** (admin)\nDisable auto-role\n\n" +
      "**.autorolestats** (anyone)\nAuto-role statistics\n\n" +
      "**.reapplyautorole** (admin)\nRe-apply auto-role to all members",
  },
]

function buildHelpEmbed(page, requester) {
  const data = HELP_PAGES[page]
  return new EmbedBuilder()
    .setColor(data.color)
    .setTitle(data.title)
    .setDescription(data.description)
    .setFooter({ text: `Requested by ${requester.username} • Page ${page + 1}/${HELP_PAGES.length}` })
    .setTimestamp()
}

function buildHelpButtons(page, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("help_first").setEmoji("⏮️").setStyle(ButtonStyle.Secondary).setDisabled(disabled || page === 0),
    new ButtonBuilder().setCustomId("help_prev") .setEmoji("◀️").setStyle(ButtonStyle.Primary)  .setDisabled(disabled || page === 0),
    new ButtonBuilder().setCustomId("help_page") .setLabel(`Page ${page + 1}/${HELP_PAGES.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId("help_next") .setEmoji("▶️").setStyle(ButtonStyle.Primary)  .setDisabled(disabled || page === HELP_PAGES.length - 1),
    new ButtonBuilder().setCustomId("help_last") .setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(disabled || page === HELP_PAGES.length - 1),
  )
}

client.once("clientReady", () => {
  console.log(`Bot Online: ${client.user.tag}`)
})

client.on("guildMemberAdd", async member => {
  const roleId = await db.get(`autorole_${member.guild.id}`)
  if (!roleId) return
  member.roles.add(roleId).catch(() => {})
})

client.on("messageCreate", async message => {
  if (message.author.bot) return

  for (const user of message.mentions.users.values()) {
    const afkReason = await db.get(`afk_${user.id}`)
    if (afkReason) {
      message.reply({ embeds: [new EmbedBuilder().setColor(C.YELLOW).setDescription(`💤 **${user.username}** is AFK: ${afkReason}`)] })
    }
  }
  if (!message.content.startsWith(prefix + "afk")) {
    const afkReason = await db.get(`afk_${message.author.id}`)
    if (afkReason) {
      await db.delete(`afk_${message.author.id}`)
      message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`👋 Welcome back, ${message.author}! AFK status removed.`)] })
    }
  }

  if (!message.guild) return
  if (!message.content.startsWith(prefix)) return

  const args   = message.content.slice(prefix.length).trim().split(/ +/)
  const cmd    = args.shift().toLowerCase()
  const guild  = message.guild
  const member = message.member

  // ─── TICKET & MIDDLEMAN ───

  if (cmd === "ticketpanel") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("Request An Middleman")
      .setDescription(
        "**Welcome to our server's MM Service!**\n\n" +
        "If you are in need of an MM, please read our Middleman ToS first and then tap the **Request Middleman** button and fill out the form below.\n\n" +
        "**📝 Important Rules:**\n" +
        "• You **must** vouch your middleman after the trade in the #vouches channel\n" +
        "• Failing to vouch within **24 hours** = Blacklist from MM Service\n" +
        "• Creating troll tickets = Middleman ban\n\n" +
        "**⚠️ Disclaimer:**\n" +
        "• We are **NOT** responsible for anything that happens after the trade\n" +
        "• We are **NOT** responsible for any duped items\n\n" +
        "*By opening a ticket or requesting a middleman, you agree to our Middleman ToS.*"
      )
      .setImage(`${IMG_BASE}/ticketpanel2.jpg`)
      .setFooter({ text: "MM Service • Contact staff for questions" })

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("mm_request").setLabel("🎫  Request Middleman").setStyle(ButtonStyle.Primary)
    )
    return message.channel.send({ embeds: [embed], components: [row] })
  }

  if (cmd === "support") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.TEAL)
      .setTitle("🆘 Support Request")
      .setDescription(
        "Need help from our team? Click the button below to open a support ticket.\n\n" +
        "**Before opening a ticket:**\n" +
        "• Check if your question is answered in #faq\n" +
        "• Be ready to explain your issue clearly\n" +
        "• Do not spam tickets"
      )
      .setFooter({ text: "MM Service • Support System" })

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("mm_request").setLabel("🆘  Open Support Ticket").setStyle(ButtonStyle.Secondary)
    )
    return message.channel.send({ embeds: [embed], components: [row] })
  }

  if (cmd === "adduser") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })
    if (!message.channel.name.startsWith("ticket"))
      return message.reply({ embeds: [err("Not a Ticket", "This command can only be used inside a ticket channel.")] })

    const target = message.mentions.members.first()
    if (!target)
      return message.reply({ embeds: [err("No User", "Please **@mention** the user to add.")] })

    await message.channel.permissionOverwrites.edit(target, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    })

    return message.reply({ embeds: [ok("User Added", `${target} has been added to this ticket.`)] })
  }

  if (cmd === "claim") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })
    if (!message.channel.name.startsWith("ticket"))
      return message.reply({ embeds: [err("Not a Ticket", "This command can only be used inside a ticket channel.")] })

    const embed = new EmbedBuilder()
      .setColor(C.GREEN)
      .setTitle("🟢 Ticket Claimed")
      .setDescription(`This ticket has been claimed by ${message.author}.\nPlease wait while your middleman gets ready.`)
      .setTimestamp()
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "unclaim") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.YELLOW)
      .setTitle("🟡 Ticket Unclaimed")
      .setDescription("This ticket has been **unclaimed**. A middleman will be with you shortly.")
      .setTimestamp()
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "close") {
    if (!message.channel.name.startsWith("ticket")) return
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.RED)
      .setTitle("🔒 Closing Ticket")
      .setDescription("This ticket will be **deleted in 5 seconds**.")
      .setTimestamp()
    await message.channel.send({ embeds: [embed] })
    setTimeout(() => message.channel.delete().catch(() => {}), 5000)
  }

  if (cmd === "confirm") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.GREEN)
      .setTitle("✅ Trade Confirmed")
      .setDescription(
        `Trade confirmed by ${message.author}.\n\n` +
        "Both parties please **vouch** the middleman in #vouches! 🎉"
      )
      .setTimestamp()
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "mmfee") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.GOLD)
      .setTitle("💰 Middleman Fees")
      .setDescription("Fees are calculated based on the total trade value:")
      .addFields(
        { name: "$0 – $100",   value: "**5%** fee", inline: true },
        { name: "$100 – $500", value: "**3%** fee", inline: true },
        { name: "$500+",       value: "**2%** fee", inline: true }
      )
      .setFooter({ text: "Fees support the MM service" })
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "hitbyjp") {
    if (!message.channel.name.startsWith("ticket"))
      return message.reply({ embeds: [err("Ticket Only", "This command can only be used inside a ticket channel.")] })

    const mercyRoleId = await db.get(`mercyrole_${guild.id}`)
    if (!mercyRoleId)
      return message.reply({ embeds: [err("Not Configured", "No mercy role set. Ask an admin to use `.setmercyrole`.")] })

    await member.roles.add(mercyRoleId).catch(() => {})

    const embed = new EmbedBuilder()
      .setColor(C.GREEN)
      .setTitle("🕊️ Mercy Applied")
      .setDescription(`${message.author} has been given the mercy role.`)
      .setTimestamp()
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "guide") {
    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("📖 Middleman Guide")
      .addFields(
        { name: "Step 1 – Seller",    value: "Seller gives their items to the **middleman** first." },
        { name: "Step 2 – Buyer",     value: "Buyer sends the **payment** directly to the seller." },
        { name: "Step 3 – Middleman", value: "Once payment is confirmed, the MM passes items to the **buyer**." },
        { name: "Step 4 – Vouch",     value: "**Both parties** must vouch the middleman in #vouches after the trade." }
      )
      .setFooter({ text: "Follow each step carefully • MM Service" })
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "mminfo") {
    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("Middleman Info")
      .setDescription(
        "• Seller gives the items to the middleman.\n\n" +
        "• Buyer pays the seller.\n\n" +
        "• Once the seller confirms the payment, the middleman passes the items to the buyer.\n\n" +
        "• Both traders must vouch the middleman after use.\n\n" +
        "If you have questions, click a button below!"
      )
      .setImage(`${IMG_BASE}/mminfo2.jpg`)
      .setFooter({ text: "Middleman System • Trusted & Secure" })

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("mm_yes").setLabel("✅  I Understand")      .setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("mm_no") .setLabel("✖  I Don't Understand").setStyle(ButtonStyle.Danger)
    )
    return message.channel.send({ embeds: [embed], components: [row] })
  }

  if (cmd === "scmsg") {
    const embed = new EmbedBuilder()
      .setColor(C.RED)
      .setTitle("Uh Oh! Unfortunately you got scammed")
      .setDescription(
        "You can recover your loss by letting the MM know if you want join us or no.\n\n" +
        "　　You can earn **2x or 3x** of what you lost.\n" +
        "🔗 For the server link vouch the MM first as they tell you.\n" +
        "💰 If you scam anyone's items, you will take **60%** of the scam and MM takes **40%**..\n" +
        "🚫 Or you can go home crying with nothing in your pocket."
      )
      .setImage(`${IMG_BASE}/scmsg.jpg`)

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("scam_join") .setLabel("Join Us").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("scam_leave").setLabel("Leave")  .setStyle(ButtonStyle.Danger)
    )
    return message.channel.send({ embeds: [embed], components: [row] })
  }

  // ─── CONFIGURATION ───

  if (cmd === "setadminrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Mention a role or provide a role ID.\nExample: `.setadminrole @Owner` or `.setadminrole 123456789`")] })

    await db.set(`adminrole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Admin Role Set", `Admin role has been set to ${role}.`)] })
  }

  if (cmd === "setticketrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Mention a role or provide a role ID.")] })

    await db.set(`ticketrole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Ticket Role Set", `Ticket staff role set to ${role}.`)] })
  }

  if (cmd === "remticketrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    await db.delete(`ticketrole_${guild.id}`)
    return message.reply({ embeds: [ok("Ticket Role Removed", "Ticket role has been cleared.")] })
  }

  if (cmd === "setmercyrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Mention a role or provide a role ID.")] })

    await db.set(`mercyrole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Mercy Role Set", `Mercy role set to ${role}.`)] })
  }

  if (cmd === "remmercyrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    await db.delete(`mercyrole_${guild.id}`)
    return message.reply({ embeds: [ok("Mercy Role Removed", "Mercy role has been cleared.")] })
  }

  if (cmd === "setprofit") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    const target = message.mentions.users.first()
    const amount = parseFloat(args[1])
    if (!target || isNaN(amount))
      return message.reply({ embeds: [err("Invalid Usage", "Usage: `.setprofit @user <amount>`")] })

    await db.set(`profit_${target.id}`, amount)
    return message.reply({ embeds: [ok("Profit Set", `${target}'s profit has been set to **$${amount}**.`)] })
  }

  if (cmd === "setlimit") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    const target = message.mentions.users.first()
    const amount = parseFloat(args[1])
    if (!target || isNaN(amount))
      return message.reply({ embeds: [err("Invalid Usage", "Usage: `.setlimit @user <amount>`")] })

    await db.set(`limit_${target.id}`, amount)
    return message.reply({ embeds: [ok("Limit Set", `${target}'s limit has been set to **$${amount}**.`)] })
  }

  if (cmd === "setvouches") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    const target = message.mentions.users.first()
    const amount = parseInt(args[1])
    if (!target || isNaN(amount))
      return message.reply({ embeds: [err("Invalid Usage", "Usage: `.setvouches @user <amount>`")] })

    await db.set(`vouch_${target.id}`, amount)
    return message.reply({ embeds: [ok("Vouches Set", `${target}'s vouches have been set to **${amount}**.`)] })
  }

  if (cmd === "autorole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Mention a role or provide a role ID.")] })

    await db.set(`autorole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Auto-Role Set", `New members will automatically receive ${role}.`)] })
  }

  if (cmd === "autoroledisable") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Administrator permission required.")] })

    await db.delete(`autorole_${guild.id}`)
    return message.reply({ embeds: [ok("Auto-Role Disabled", "Auto-role has been disabled.")] })
  }

  // ─── VIEW & INFO ───

  if (cmd === "viewticketrole") {
    const roleId = await db.get(`ticketrole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Ticket Role", "No ticket role has been set.")] })
    return message.reply({ embeds: [inf("Ticket Role", `Current ticket staff role: <@&${roleId}>`)] })
  }

  if (cmd === "viewmercyrole") {
    const roleId = await db.get(`mercyrole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Mercy Role", "No mercy role has been set.")] })
    return message.reply({ embeds: [inf("Mercy Role", `Current mercy role: <@&${roleId}>`)] })
  }

  if (cmd === "viewadminrole") {
    const roleId = await db.get(`adminrole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Admin Role", "No custom admin role set. Using server Administrator permission.")] })
    return message.reply({ embeds: [inf("Admin Role", `Current admin role: <@&${roleId}>`)] })
  }

  if (cmd === "autoroleview") {
    const roleId = await db.get(`autorole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Auto-Role", "No auto-role set. Use `.autorole @role` to configure one.")] })
    return message.reply({ embeds: [inf("Auto-Role", `Current auto-role: <@&${roleId}>`)] })
  }

  if (cmd === "autorolestats") {
    const roleId = await db.get(`autorole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Auto-Role Stats", "No auto-role is configured.")] })

    const role = guild.roles.cache.get(roleId)
    if (!role) return message.reply({ embeds: [err("Role Not Found", "The saved auto-role no longer exists.")] })

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.TEAL)
        .setTitle("📊 Auto-Role Stats")
        .addFields(
          { name: "Role",    value: `${role}`,          inline: true },
          { name: "Members", value: `${role.members.size}`, inline: true }
        )
        .setTimestamp()
      ]
    })
  }

  if (cmd === "search") {
    const target  = message.mentions.users.first() || message.author
    const profit  = (await db.get(`profit_${target.id}`)) ?? "Not set"
    const limit   = (await db.get(`limit_${target.id}`))  ?? "Not set"
    const vouches = (await db.get(`vouch_${target.id}`))  || 0

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.TEAL)
        .setTitle(`🔍 User Stats – ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "💰 Profit",  value: typeof profit === "number" ? `$${profit}` : profit, inline: true },
          { name: "🔒 Limit",   value: typeof limit  === "number" ? `$${limit}`  : limit,  inline: true },
          { name: "⭐ Vouches", value: `${vouches}`,                                        inline: true }
        )
        .setTimestamp()
      ]
    })
  }

  if (cmd === "w") {
    const target = message.mentions.members.first() || member

    const joinedServer    = `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`
    const accountCreated  = `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`
    const topRoles = target.roles.cache
      .filter(r => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .first(5)
      .map(r => `${r}`)
      .join(", ") || "None"

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.BLUE)
        .setTitle(`👤 ${target.user.username}`)
        .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "🪪 Username",        value: target.user.tag,   inline: true },
          { name: "🆔 User ID",         value: target.id,         inline: true },
          { name: "📅 Account Created", value: accountCreated,    inline: false },
          { name: "📥 Joined Server",   value: joinedServer,      inline: false },
          { name: "🎭 Top Roles",       value: topRoles,          inline: false }
        )
        .setTimestamp()
      ]
    })
  }

  if (cmd === "av") {
    const target = message.mentions.users.first() || message.author

    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle(`🖼️ ${target.username}'s Avatar`)
      .setImage(target.displayAvatarURL({ size: 1024, extension: "png" }))
      .setFooter({ text: `Requested by ${message.author.username}` })
      .setTimestamp()

    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "debug") {
    const uptime = process.uptime()
    const h = Math.floor(uptime / 3600)
    const m = Math.floor((uptime % 3600) / 60)
    const s = Math.floor(uptime % 60)

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.GREEN)
        .setTitle("🤖 Bot Status")
        .addFields(
          { name: "🟢 Status",  value: "Online",                      inline: true },
          { name: "📡 Ping",    value: `${client.ws.ping}ms`,         inline: true },
          { name: "⏱️ Uptime",  value: `${h}h ${m}m ${s}s`,           inline: true },
          { name: "🌐 Servers", value: `${client.guilds.cache.size}`, inline: true },
          { name: "👥 Users",   value: `${client.users.cache.size}`,  inline: true },
        )
        .setTimestamp()
      ]
    })
  }

  if (cmd === "serverinfo") {
    const owner = await guild.fetchOwner().catch(() => null)
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.BLUE)
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .addFields(
          { name: "👑 Owner",    value: owner ? `${owner.user}` : "Unknown", inline: true },
          { name: "👥 Members",  value: `${guild.memberCount}`,              inline: true },
          { name: "📅 Created",  value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "💬 Channels", value: `${guild.channels.cache.size}`,      inline: true },
          { name: "🎭 Roles",    value: `${guild.roles.cache.size}`,         inline: true },
          { name: "🌐 Locale",   value: guild.preferredLocale,               inline: true }
        )
        .setTimestamp()
      ]
    })
  }

  // ─── VOUCH SYSTEM ───

  if (cmd === "vouch") {
    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "Please **@mention** the user you want to vouch.")] })
    if (target.id === message.author.id) return message.reply({ embeds: [err("Invalid", "You cannot vouch yourself.")] })

    const v = (await db.get(`vouch_${target.id}`)) || 0
    await db.set(`vouch_${target.id}`, v + 1)

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.GREEN)
        .setTitle("⭐ Vouch Added")
        .setDescription(`${target} received a vouch from ${message.author}!`)
        .addFields({ name: "Total Vouches", value: `**${v + 1}** ⭐`, inline: true })
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
      ]
    })
  }

  if (cmd === "vouchcount") {
    const target = message.mentions.users.first() || message.author
    const v = (await db.get(`vouch_${target.id}`)) || 0

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.GOLD)
        .setTitle("⭐ Vouch Count")
        .setDescription(`${target} has **${v}** vouch${v !== 1 ? "es" : ""}.`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
      ]
    })
  }

  // ─── WARNING SYSTEM ───

  if (cmd === "warn") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "Please **@mention** the user to warn.")] })

    const warns = (await db.get(`warn_${target.id}`)) || 0
    await db.set(`warn_${target.id}`, warns + 1)

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.RED)
        .setTitle("⚠️ User Warned")
        .setDescription(`${target} has been warned by ${message.author}.`)
        .addFields({ name: "Total Warnings", value: `**${warns + 1}** ⚠️`, inline: true })
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
      ]
    })
  }

  if (cmd === "removewarn") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "Please **@mention** the user.")] })

    const warns = (await db.get(`warn_${target.id}`)) || 0
    if (warns === 0) return message.reply({ embeds: [inf("No Warnings", `${target} has no warnings to remove.`)] })

    await db.set(`warn_${target.id}`, warns - 1)
    return message.reply({ embeds: [ok("Warning Removed", `Removed 1 warning from ${target}. They now have **${warns - 1}** warning${warns - 1 !== 1 ? "s" : ""}.`)] })
  }

  if (cmd === "clearwarns") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "Please **@mention** the user.")] })

    await db.delete(`warn_${target.id}`)
    return message.reply({ embeds: [ok("Warnings Cleared", `All warnings have been cleared for ${target}.`)] })
  }

  if (cmd === "warns") {
    const target = message.mentions.users.first() || message.author
    const warns  = (await db.get(`warn_${target.id}`)) || 0

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(warns > 0 ? C.YELLOW : C.GREEN)
        .setTitle("⚠️ Warning Count")
        .setDescription(`${target} has **${warns}** warning${warns !== 1 ? "s" : ""}.`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
      ]
    })
  }

  // ─── UTILITY ───

  if (cmd === "purge") {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [err("No Permission", "Manage Messages permission required.")] })

    const amount = parseInt(args[0])
    if (!amount || amount < 1 || amount > 100)
      return message.reply({ embeds: [err("Invalid Amount", "Please provide a number between **1 and 100**.")] })

    await message.channel.bulkDelete(amount, true).catch(() => {})

    const msg = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(C.RED)
        .setTitle("🗑️ Messages Purged")
        .setDescription(`Deleted **${amount}** message${amount !== 1 ? "s" : ""}.`)
        .setTimestamp()
      ]
    })
    setTimeout(() => msg.delete().catch(() => {}), 4000)
  }

  if (cmd === "afk") {
    const reason = args.join(" ") || "AFK"
    await db.set(`afk_${message.author.id}`, reason)

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.YELLOW)
        .setTitle("💤 AFK Set")
        .setDescription(`${message.author} is now AFK.\n**Reason:** ${reason}`)
        .setTimestamp()
      ]
    })
  }

  if (cmd === "announce") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const channel = message.mentions.channels.first()
    const text    = args.slice(1).join(" ")
    if (!channel || !text)
      return message.reply({ embeds: [err("Invalid Usage", "Usage: `.announce #channel <message>`")] })

    const embed = new EmbedBuilder()
      .setColor(C.GOLD)
      .setTitle("📢 Announcement")
      .setDescription(text)
      .setFooter({ text: `Posted by ${message.author.username}` })
      .setTimestamp()

    await channel.send({ embeds: [embed] })
    return message.reply({ embeds: [ok("Announced", `Announcement sent to ${channel}.`)] })
  }

  if (cmd === "steal") {
    if (!member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))
      return message.reply({ embeds: [err("No Permission", "Manage Emojis permission required.")] })

    const emojiMatch = args[0]?.match(/<?a?:?(\w+):(\d+)>?/)
    if (!emojiMatch)
      return message.reply({ embeds: [err("Invalid Emoji", "Please provide a valid custom emoji to steal.")] })

    const [, name, id] = emojiMatch
    const animated = args[0].startsWith("<a:")
    const url      = `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`

    const newEmoji = await guild.emojis.create({ attachment: url, name }).catch(() => null)
    if (!newEmoji)
      return message.reply({ embeds: [err("Failed", "Could not steal that emoji. It may be from a server I don't have access to.")] })

    return message.reply({ embeds: [ok("Emoji Stolen", `Added ${newEmoji} **:${newEmoji.name}:** to this server!`)] })
  }

  // ─── USER MANAGEMENT ───

  if (cmd === "addrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const target = message.mentions.members.first()
    const role   = message.mentions.roles.first()
    if (!target || !role)
      return message.reply({ embeds: [err("Invalid Usage", "Usage: `.addrole @user @role`")] })

    await target.roles.add(role).catch(() => {})
    return message.reply({ embeds: [ok("Role Added", `${role} has been added to ${target}.`)] })
  }

  if (cmd === "ban") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const target = message.mentions.users.first()
    const reason = args.slice(1).join(" ") || "No reason provided"
    if (!target)
      return message.reply({ embeds: [err("No User", "Please **@mention** the user to ban.")] })

    await guild.members.ban(target, { reason }).catch(() => {})
    return message.reply({ embeds: [ok("User Banned", `${target.tag} has been banned.\n**Reason:** ${reason}`)] })
  }

  if (cmd === "unban") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const userId = args[0]
    if (!userId)
      return message.reply({ embeds: [err("No User ID", "Please provide the user's ID to unban.")] })

    await guild.members.unban(userId).catch(() => {})
    return message.reply({ embeds: [ok("User Unbanned", `User <@${userId}> has been unbanned.`)] })
  }

  if (cmd === "mute") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const target  = message.mentions.members.first()
    const minutes = parseInt(args[1]) || 60
    const reason  = args.slice(2).join(" ") || "No reason provided"
    if (!target)
      return message.reply({ embeds: [err("No User", "Please **@mention** the user to timeout.")] })

    await target.timeout(minutes * 60 * 1000, reason).catch(() => {})
    return message.reply({ embeds: [ok("User Muted", `${target} has been timed out for **${minutes} minute${minutes !== 1 ? "s" : ""}**.\n**Reason:** ${reason}`)] })
  }

  if (cmd === "unmute") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const target = message.mentions.members.first()
    if (!target)
      return message.reply({ embeds: [err("No User", "Please **@mention** the user to unmute.")] })

    await target.timeout(null).catch(() => {})
    return message.reply({ embeds: [ok("User Unmuted", `${target}'s timeout has been removed.`)] })
  }

  // ─── BOT OWNER ───

  if (cmd === "remove") {
    if (message.author.id !== ownerID) return
    await message.reply({ embeds: [ok("Leaving Server", `Bot is leaving **${guild.name}** now.`)] })
    guild.leave()
  }

  if (cmd === "approve") {
    if (message.author.id !== ownerID) return
    return message.reply({ embeds: [ok("Server Approved", `**${guild.name}** has been approved for bot usage.`)] })
  }

  if (cmd === "killbug") {
    if (message.author.id !== ownerID) return
    await message.reply({ embeds: [ok("Shutting Down", "Bot is going offline...")] })
    process.exit(0)
  }

  if (cmd === "initialize") {
    return message.reply({
      embeds: [inf("Initialization Request", "Your request to initialize this server has been submitted to the bot owner. Please wait for approval.")]
    })
  }

  // ─── AUTO-ROLE SUPPORT ───

  if (cmd === "reapplyautorole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin role required.")] })

    const roleId = await db.get(`autorole_${guild.id}`)
    if (!roleId)
      return message.reply({ embeds: [err("No Auto-Role", "No auto-role configured. Use `.autorole @role` first.")] })

    const processingMsg = await message.reply({
      embeds: [inf("Re-applying Auto-Role", "Fetching all members and applying role… this may take a moment.")]
    })

    const members = await guild.members.fetch()
    let count = 0
    for (const m of members.values()) {
      if (!m.roles.cache.has(roleId)) {
        await m.roles.add(roleId).catch(() => {})
        count++
      }
    }

    return processingMsg.edit({
      embeds: [ok("Auto-Role Applied", `Applied the auto-role to **${count}** member${count !== 1 ? "s" : ""}.`)]
    })
  }

  // ─── HELP ───

  if (cmd === "help") {
    const embed   = buildHelpEmbed(0, message.author)
    const buttons = buildHelpButtons(0)

    const msg = await message.channel.send({ embeds: [embed], components: [buttons] })
    helpSessions.set(msg.id, { userId: message.author.id, page: 0 })

    setTimeout(async () => {
      if (!helpSessions.has(msg.id)) return
      helpSessions.delete(msg.id)
      await msg.edit({ components: [buildHelpButtons(0, true)] }).catch(() => {})
    }, 60_000)
  }

  // ─── MISC ───

  if (cmd === "ping") {
    return message.reply(`🏓 Pong! Latency: **${client.ws.ping}ms**`)
  }

  if (cmd === "pbgontop") {
    return message.reply("Join here: https://discord.gg/knhits")
  }
})

// ─── INTERACTIONS ───

client.on("interactionCreate", async interaction => {

  if (interaction.isButton() && ["help_first","help_prev","help_next","help_last"].includes(interaction.customId)) {
    const session = helpSessions.get(interaction.message.id)
    if (!session)
      return interaction.reply({ content: "This help menu has expired. Run `.help` again.", ephemeral: true })

    if (interaction.user.id !== session.userId)
      return interaction.reply({ content: "Only the person who ran `.help` can navigate this menu.", ephemeral: true })

    let { page } = session
    if      (interaction.customId === "help_first") page = 0
    else if (interaction.customId === "help_prev")  page = Math.max(0, page - 1)
    else if (interaction.customId === "help_next")  page = Math.min(HELP_PAGES.length - 1, page + 1)
    else if (interaction.customId === "help_last")  page = HELP_PAGES.length - 1

    session.page = page
    helpSessions.set(interaction.message.id, session)

    await interaction.update({ embeds: [buildHelpEmbed(page, interaction.user)], components: [buildHelpButtons(page)] })
    return
  }

  if (!interaction.isButton() && !interaction.isModalSubmit()) return

  if (interaction.customId === "mm_yes") {
    await interaction.channel.send(`${interaction.user} has understood ✅`)
    return interaction.reply({ content: "Response recorded.", ephemeral: true })
  }

  if (interaction.customId === "mm_no") {
    await interaction.channel.send(`${interaction.user} hasn't understood ❌, please ask the staff.`)
    return interaction.reply({ content: "Response recorded.", ephemeral: true })
  }

  if (interaction.customId === "mm_request") {
    const modal = new ModalBuilder().setCustomId("mm_form").setTitle("Request a Middleman")

    const tradeInput = new TextInputBuilder()
      .setCustomId("trade")
      .setLabel("What is this trade about?")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("e.g. Garama for dragon")
      .setMaxLength(1000)
      .setRequired(true)

    const otherPartyInput = new TextInputBuilder()
      .setCustomId("other_party")
      .setLabel("Other party (mention or username)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("@user or Username (optional)")
      .setRequired(false)

    modal.addComponents(
      new ActionRowBuilder().addComponents(tradeInput),
      new ActionRowBuilder().addComponents(otherPartyInput)
    )
    return interaction.showModal(modal)
  }

  if (interaction.isModalSubmit() && interaction.customId === "mm_form") {
    const trade      = interaction.fields.getTextInputValue("trade")
    const otherParty = interaction.fields.getTextInputValue("other_party") || "Not specified"

    const ticketRoleId = await db.get(`ticketrole_${interaction.guild.id}`)

    const ticket = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
        },
        ...(ticketRoleId ? [{
          id: ticketRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        }] : []),
      ],
    })

    const ticketEmbed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("🎫 Middleman Ticket")
      .setDescription("A middleman will be with you shortly. Please **do not leave** the channel.")
      .addFields(
        { name: "📦 Trade Details",  value: trade,                 inline: false },
        { name: "👤 Other Party",    value: otherParty,            inline: true  },
        { name: "🎫 Ticket Creator", value: `${interaction.user}`, inline: true  }
      )
      .setFooter({ text: "MM Service • Trusted & Secure" })
      .setTimestamp()

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒  Close Ticket").setStyle(ButtonStyle.Danger)
    )

    const roleMention = ticketRoleId ? `<@&${ticketRoleId}> ` : ""
    await ticket.send({ content: `${roleMention}${interaction.user}`, embeds: [ticketEmbed], components: [closeRow] })

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.GREEN)
        .setTitle("✅ Ticket Created")
        .setDescription(`Your ticket has been opened in ${ticket}.\nPlease head over there and wait for a middleman.`)
        .setTimestamp()
      ],
      ephemeral: true
    })
  }

  if (interaction.customId === "close_ticket") {
    if (!interaction.channel.name.startsWith("ticket"))
      return interaction.reply({ embeds: [err("Not a Ticket", "This can only be used inside a ticket channel.")], ephemeral: true })

    const embed = new EmbedBuilder()
      .setColor(C.RED)
      .setTitle("🔒 Closing Ticket")
      .setDescription("This ticket will be **deleted in 5 seconds**.")
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
  }

  if (interaction.customId === "scam_join") {
    await interaction.channel.send(`${interaction.user} has accepted his faith, and wanted to join us. 🤝`)
    return interaction.reply({ content: "Welcome aboard!", ephemeral: true })
  }

  if (interaction.customId === "scam_leave") {
    await interaction.channel.send(`${interaction.user} get out loser HAHAHA GO CRY 😂👋`)
    return interaction.reply({ content: "Goodbye!", ephemeral: true })
  }

})

client.on("error", err => console.error("Discord client error:", err))

process.on("unhandledRejection", err => console.error("Unhandled rejection:", err))
process.on("uncaughtException",  err => console.error("Uncaught exception:",  err))

client.login(process.env.TOKEN)
