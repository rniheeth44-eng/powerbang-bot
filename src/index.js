const path = require("path")

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
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js")

const { QuickDB } = require("quick.db")
const db = new QuickDB()

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

const prefix = "."
const ownerID = "1278638641752707094"

const C = {
  BLUE: 0x5865F2,
  GREEN: 0x57F287,
  RED: 0xED4245,
  YELLOW: 0xFEE75C,
  GOLD: 0xF5C518,
  GREY: 0x2B2D31,
  PURPLE: 0x9B59B6,
  TEAL: 0x1ABC9C,
}

const ok = (title, desc) => new EmbedBuilder().setColor(C.GREEN).setTitle(`✅ ${title}`).setDescription(desc).setTimestamp()
const err = (title, desc) => new EmbedBuilder().setColor(C.RED).setTitle(`❌ ${title}`).setDescription(desc).setTimestamp()
const inf = (title, desc) => new EmbedBuilder().setColor(C.BLUE).setTitle(`📋 ${title}`).setDescription(desc).setTimestamp()

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

const HELP_PAGES = [
  {
    title: "🔍 Bot Help Menu",
    color: C.BLUE,
    description: "Welcome to the Bot help system! Use the buttons below to navigate.\n\n📋 **9 Command Categories Available**\n\n✏️ **How to Use:**\n• Use navigation buttons to browse\n• Only you can use your help menu\n• Buttons work indefinitely!\n\n🔑 **Permission Legend:**\n• **(admin)**: Admin role\n• **(ticket staff)**: Ticket/Admin role\n• **(anyone)**: Everyone",
  },
  {
    title: "🎫 Ticket & Middleman",
    color: C.BLUE,
    description: "**.ticketpanel** - Sends ticket panel\n**.support** - Support request panel\n**.adduser** - Add user to ticket\n**.claim** - Claim ticket\n**.unclaim** - Unclaim ticket\n**.close** - Close ticket\n**.confirm** - Trade confirmation\n**.mmfee** - MM fee info\n**.hitbypbg** - Mercy command\n**.guide** - H1tting guide\n**.mminfo** - How MM works",
  },
  {
    title: "⚙️ Configuration & Setup",
    color: C.PURPLE,
    description: "**.setadminrole** - Set admin role\n**.setticketrole** - Set ticket role\n**.remticketrole** - Remove ticket role\n**.setmercyrole** - Set mercy role\n**.remmercyrole** - Remove mercy role\n**.setserver** - Set server link\n**.change** - Toggle mode\n**.setprofit** - Set user profit\n**.setlimit** - Set user limit\n**.setvouches** - Set vouches\n**.autorole** - Set auto-role\n**.autoroledisable** - Disable auto-role",
  },
  {
    title: "👀 View & Info",
    color: C.TEAL,
    description: "**.viewticketrole** - View ticket roles\n**.viewmercyrole** - View mercy role\n**.viewadminrole** - View admin roles\n**.search** - View user stats\n**.warns** - View warnings\n**.w** - User info\n**.av** - View avatar\n**.vouchcount** - View vouches\n**.debug** - Bot status\n**.autoroleview** - View auto-role\n**.autorolestats** - Auto-role stats\n**.serverinfo** - Server info",
  },
  {
    title: "🤝 Vouch System",
    color: C.GOLD,
    description: "**.vouch** - Vouch for someone\n**.vouchcount** - View vouch count\n**.setvouches** - Set user vouches (admin)",
  },
  {
    title: "⚠️ Warning System",
    color: C.YELLOW,
    description: "**.warn** - Warn user (admin)\n**.removewarn** - Remove warning (admin)\n**.clearwarns** - Clear all warnings (admin)\n**.warns** - View warnings",
  },
  {
    title: "🔧 Utility",
    color: C.GREY,
    description: "**.purge** - Delete messages (admin)\n**.afk** - Set AFK status\n**.announce** - Send announcement (admin)\n**.steal** - Steal emoji",
  },
  {
    title: "👤 User Management",
    color: C.RED,
    description: "**.addrole** - Add role (admin)\n**.ban** - Ban user (admin)\n**.unban** - Unban user (admin)\n**.mute** - Timeout user (admin)\n**.unmute** - Remove timeout (admin)",
  },
  {
    title: "👑 Bot Owner & Support",
    color: C.GOLD,
    description: "**.remove** - Leave server (owner)\n**.approve** - Approve server (owner)\n**.killbug** - Shutdown (owner)\n**.initialize** - Request setup\n**.reapplyautorole** - Reapply auto-role (admin)",
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

function buildHelpButtons(page) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("help_first").setEmoji("⏮️").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId("help_prev").setEmoji("◀️").setStyle(ButtonStyle.Primary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId("help_page").setLabel(`${page + 1}/${HELP_PAGES.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId("help_next").setEmoji("▶️").setStyle(ButtonStyle.Primary).setDisabled(page === HELP_PAGES.length - 1),
    new ButtonBuilder().setCustomId("help_last").setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(page === HELP_PAGES.length - 1),
  )
}

client.once("ready", () => {
  console.log(`✅ Bot Online: ${client.user.tag}`)
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

  const args = message.content.slice(prefix.length).trim().split(/ +/)
  const cmd = args.shift().toLowerCase()
  const guild = message.guild
  const member = message.member

  // ─── TICKET & MIDDLEMAN ───

  if (cmd === "ticketpanel") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("Request An Middleman")
      .setDescription(
        "**Welcome to our server's MM Service!**\n\nIf you are in need of an MM, please read our Middleman ToS first and then tap the **Request Middleman** button.\n\n**📝 Important Rules:**\n• You **must** vouch your middleman after the trade\n• Failing to vouch within **24 hours** = Blacklist\n• Creating troll tickets = Ban\n\n**⚠️ Disclaimer:**\n• We are NOT responsible for anything after trade\n• We are NOT responsible for duped items"
      )
      .setImage(`${IMG_BASE}/ticketpanel2.jpg`)
      .setFooter({ text: "MM Service • Contact staff for questions" })

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("mm_request").setLabel("🎫 Request Middleman").setStyle(ButtonStyle.Primary)
    )

    const recent = await message.channel.messages.fetch({ limit: 50 }).catch(() => null)
    if (recent) {
      const oldPanels = recent.filter(m =>
        m.author.id === client.user.id &&
        m.embeds.length > 0 &&
        m.embeds[0].title === "Request An Middleman"
      )
      for (const [, m] of oldPanels) await m.delete().catch(() => {})
    }

    await message.delete().catch(() => {})
    const panel = await message.channel.send({ embeds: [embed], components: [row] })
    await db.set(`ticketpanel_${guild.id}_${message.channel.id}`, panel.id)
    return
  }

  if (cmd === "support") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "You need **Ticket Staff** or **Admin** to use this.")] })

    const embed = new EmbedBuilder()
      .setColor(C.TEAL)
      .setTitle("🆘 Support Request")
      .setDescription("Need help? Click below to open a support ticket.\n\n**Before opening:**\n• Check #faq first\n• Be ready to explain your issue\n• No spam")
      .setFooter({ text: "Support System" })

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("mm_request").setLabel("🆘 Open Ticket").setStyle(ButtonStyle.Secondary)
    )
    return message.channel.send({ embeds: [embed], components: [row] })
  }

  if (cmd === "adduser") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Ticket Staff or Admin only.")] })
    if (!message.channel.name.startsWith("ticket"))
      return message.reply({ embeds: [err("Not a Ticket", "Use inside ticket channel only.")] })

    const target = message.mentions.members.first()
    if (!target)
      return message.reply({ embeds: [err("No User", "Please @mention the user.")] })

    await message.channel.permissionOverwrites.edit(target, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    })

    return message.reply({ embeds: [ok("User Added", `${target} has been added.`)] })
  }

  if (cmd === "claim") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Ticket Staff or Admin only.")] })
    if (!message.channel.name.startsWith("ticket"))
      return message.reply({ embeds: [err("Not a Ticket", "Use inside ticket channel only.")] })

    const embed = new EmbedBuilder()
      .setColor(C.GREEN)
      .setTitle("🟢 Ticket Claimed")
      .setDescription(`Claimed by ${message.author}.\nPlease wait for the middleman.`)
      .setTimestamp()
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "unclaim") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Ticket Staff or Admin only.")] })

    const embed = new EmbedBuilder()
      .setColor(C.YELLOW)
      .setTitle("🟡 Ticket Unclaimed")
      .setDescription("A middleman will be with you shortly.")
      .setTimestamp()
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "close") {
    if (!message.channel.name.startsWith("ticket")) return
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Ticket Staff or Admin only.")] })

    const embed = new EmbedBuilder()
      .setColor(C.RED)
      .setTitle("🔒 Closing Ticket")
      .setDescription("Deleting in 5 seconds...")
      .setTimestamp()
    await message.channel.send({ embeds: [embed] })
    setTimeout(() => message.channel.delete().catch(() => {}), 5000)
  }

  if (cmd === "confirm") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Ticket Staff or Admin only.")] })

    const embed = new EmbedBuilder()
      .setColor(C.GREEN)
      .setTitle("✅ Trade Confirmed")
      .setDescription(`Confirmed by ${message.author}.\n\nBoth parties please vouch the MM in #vouches! 🎉`)
      .setTimestamp()
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "mmfee") {
    if (!await isTicketStaff(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Ticket Staff or Admin only.")] })

    const embed = new EmbedBuilder()
      .setColor(C.GOLD)
      .setTitle("💰 Middleman Fees")
      .setDescription("Fees based on trade value:")
      .addFields(
        { name: "$0 – $100", value: "**5%** fee", inline: true },
        { name: "$100 – $500", value: "**3%** fee", inline: true },
        { name: "$500+", value: "**2%** fee", inline: true }
      )
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "hitbypbg") {
    if (!message.channel.name.startsWith("ticket"))
      return message.reply({ embeds: [err("Ticket Only", "Use inside ticket channel.")] })

    const mode = await db.get(`scmsg_mode_${guild.id}`) || "role"

    if (mode === "server") {
      const serverLink = await db.get(`scmsg_server_${guild.id}`)
      if (!serverLink)
        return message.reply({ embeds: [err("Not Configured", "Admin needs to use `.setserver`.")] })
      const embed = new EmbedBuilder()
        .setColor(C.GREEN)
        .setTitle("🔗 Server Link")
        .setDescription(`${message.author}, here's your server link:\n${serverLink}`)
        .setTimestamp()
      return message.channel.send({ embeds: [embed] })
    } else {
      const mercyRoleId = await db.get(`mercyrole_${guild.id}`)
      if (!mercyRoleId)
        return message.reply({ embeds: [err("Not Configured", "Admin needs to use `.setmercyrole`.")] })
      await member.roles.add(mercyRoleId).catch(() => {})
      const embed = new EmbedBuilder()
        .setColor(C.GREEN)
        .setTitle("🕊️ Mercy Applied")
        .setDescription(`${message.author} received the mercy role.`)
        .setTimestamp()
      return message.channel.send({ embeds: [embed] })
    }
  }

  if (cmd === "guide") {
    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("__H1TT1NG TUTORIAL__")
      .setDescription("- **What is a h1t?** Using a fake service to scam.\n\n- **Strategy** Find trades, make offers, suggest MM, gain trust, open ticket, MM assists you.\n\n- **Become MM** After 10 successful h1ts or pay for it.")
    return message.channel.send({ embeds: [embed] })
  }

  if (cmd === "mminfo") {
    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("Middleman Info")
      .setDescription("• Seller → MM\n• Buyer pays seller\n• Seller confirms payment\n• MM → Buyer\n• Both vouch MM after\n\nClick a button!")
      .setImage(`${IMG_BASE}/mminfo2.jpg`)
      .setFooter({ text: "Middleman System • Trusted & Secure" })

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("mm_yes").setLabel("✅ I Understand").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("mm_no").setLabel("✖ I Don't Understand").setStyle(ButtonStyle.Danger)
    )
    return message.channel.send({ embeds: [embed], components: [row] })
  }

  // ─── CONFIGURATION ───

  if (cmd === "setadminrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.setadminrole @role`")] })

    await db.set(`adminrole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Admin Role Set", `${role} is now the admin role.`)] })
  }

  if (cmd === "setticketrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.setticketrole @role`")] })

    await db.set(`ticketrole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Ticket Role Set", `${role} is now the ticket staff role.`)] })
  }

  if (cmd === "remticketrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    await db.delete(`ticketrole_${guild.id}`)
    return message.reply({ embeds: [ok("Ticket Role Removed", "Cleared.")] })
  }

  if (cmd === "setmercyrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.setmercyrole @role`")] })

    await db.set(`mercyrole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Mercy Role Set", `${role} set.`)] })
  }

  if (cmd === "remmercyrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    await db.delete(`mercyrole_${guild.id}`)
    return message.reply({ embeds: [ok("Mercy Role Removed", "Cleared.")] })
  }

  if (cmd === "setserver") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const prompt = await message.channel.send({ embeds: [inf("Set Server", "Send the server invite link (30 seconds):")] })
    const filter = m => m.author.id === message.author.id
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] }).catch(() => null)

    if (!collected || collected.size === 0)
      return prompt.edit({ embeds: [err("Timed Out", "No link provided.")] })

    const link = collected.first().content.trim()
    await collected.first().delete().catch(() => {})
    await db.set(`scmsg_server_${guild.id}`, link)
    return prompt.edit({ embeds: [ok("Server Link Saved", "Set!")] })
  }

  if (cmd === "change") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const current = await db.get(`scmsg_mode_${guild.id}`) || "role"
    const next = current === "role" ? "server" : "role"
    await db.set(`scmsg_mode_${guild.id}`, next)

    const desc = next === "server"
      ? "**Mode: Server Link** - Sends invite link"
      : "**Mode: Mercy Role** - Gives mercy role"
    return message.reply({ embeds: [ok("Mode Changed", desc)] })
  }

  if (cmd === "setprofit") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.users.first()
    const amount = parseFloat(args[1])
    if (!target || isNaN(amount))
      return message.reply({ embeds: [err("Invalid", "Usage: `.setprofit @user <amount>`")] })

    await db.set(`profit_${target.id}`, amount)
    return message.reply({ embeds: [ok("Profit Set", `${target}'s profit: $${amount}`)] })
  }

  if (cmd === "setlimit") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.users.first()
    const amount = parseFloat(args[1])
    if (!target || isNaN(amount))
      return message.reply({ embeds: [err("Invalid", "Usage: `.setlimit @user <amount>`")] })

    await db.set(`limit_${target.id}`, amount)
    return message.reply({ embeds: [ok("Limit Set", `${target}'s limit: $${amount}`)] })
  }

  if (cmd === "setvouches") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.users.first()
    const amount = parseInt(args[1])
    if (!target || isNaN(amount))
      return message.reply({ embeds: [err("Invalid", "Usage: `.setvouches @user <amount>`")] })

    await db.set(`vouch_${target.id}`, amount)
    return message.reply({ embeds: [ok("Vouches Set", `${target}'s vouches: ${amount}`)] })
  }

  if (cmd === "autorole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
    if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.autorole @role`")] })

    await db.set(`autorole_${guild.id}`, role.id)
    return message.reply({ embeds: [ok("Auto-Role Set", `New members get ${role}.`)] })
  }

  if (cmd === "autoroledisable") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    await db.delete(`autorole_${guild.id}`)
    return message.reply({ embeds: [ok("Auto-Role Disabled", "Cleared.")] })
  }

  // ─── VIEW & INFO ───

  if (cmd === "viewticketrole") {
    const roleId = await db.get(`ticketrole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Ticket Role", "Not set.")] })
    return message.reply({ embeds: [inf("Ticket Role", `<@&${roleId}>`)] })
  }

  if (cmd === "viewmercyrole") {
    const roleId = await db.get(`mercyrole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Mercy Role", "Not set.")] })
    return message.reply({ embeds: [inf("Mercy Role", `<@&${roleId}>`)] })
  }

  if (cmd === "viewadminrole") {
    const roleId = await db.get(`adminrole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Admin Role", "Using server Administrator.")] })
    return message.reply({ embeds: [inf("Admin Role", `<@&${roleId}>`)] })
  }

  if (cmd === "autoroleview") {
    const roleId = await db.get(`autorole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Auto-Role", "Not set. Use `.autorole @role`")] })
    return message.reply({ embeds: [inf("Auto-Role", `<@&${roleId}>`)] })
  }

  if (cmd === "autorolestats") {
    const roleId = await db.get(`autorole_${guild.id}`)
    if (!roleId) return message.reply({ embeds: [inf("Auto-Role Stats", "No auto-role.")] })

    const role = guild.roles.cache.get(roleId)
    if (!role) return message.reply({ embeds: [err("Not Found", "Role was deleted.")] })

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.TEAL)
        .setTitle("📊 Auto-Role Stats")
        .addFields(
          { name: "Role", value: `${role}`, inline: true },
          { name: "Members", value: `${role.members.size}`, inline: true }
        )
        .setTimestamp()
      ]
    })
  }

  if (cmd === "search") {
    const target = message.mentions.users.first() || message.author
    const profit = (await db.get(`profit_${target.id}`)) ?? "Not set"
    const limit = (await db.get(`limit_${target.id}`)) ?? "Not set"
    const vouches = (await db.get(`vouch_${target.id}`)) || 0

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.TEAL)
        .setTitle(`🔍 ${target.username}'s Stats`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "💰 Profit", value: typeof profit === "number" ? `$${profit}` : profit, inline: true },
          { name: "🔒 Limit", value: typeof limit === "number" ? `$${limit}` : limit, inline: true },
          { name: "⭐ Vouches", value: `${vouches}`, inline: true }
        )
        .setTimestamp()
      ]
    })
  }

  if (cmd === "w") {
    const target = message.mentions.members.first() || member

    const joinedServer = `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`
    const accountCreated = `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`
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
          { name: "Username", value: target.user.tag, inline: true },
          { name: "User ID", value: target.id, inline: true },
          { name: "Account Created", value: accountCreated, inline: false },
          { name: "Joined Server", value: joinedServer, inline: false },
          { name: "Top Roles", value: topRoles, inline: false }
        )
        .setTimestamp()
      ]
    })
  }

  if (cmd === "av") {
    const target = message.mentions.users.first() || message.author
    const embed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle(`${target.username}'s Avatar`)
      .setImage(target.displayAvatarURL({ size: 1024, extension: "png" }))
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
          { name: "Status", value: "🟢 Online", inline: true },
          { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
          { name: "Uptime", value: `${h}h ${m}m ${s}s`, inline: true },
          { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
          { name: "Users", value: `${client.users.cache.size}`, inline: true }
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
          { name: "Owner", value: owner ? `${owner.user}` : "Unknown", inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
          { name: "Locale", value: guild.preferredLocale, inline: true }
        )
        .setTimestamp()
      ]
    })
  }

  // ─── VOUCH SYSTEM ───

  if (cmd === "vouch") {
    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "@mention someone.")] })
    if (target.id === message.author.id) return message.reply({ embeds: [err("Invalid", "Can't vouch yourself.")] })

    const v = (await db.get(`vouch_${target.id}`)) || 0
    await db.set(`vouch_${target.id}`, v + 1)

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.GREEN)
        .setTitle("⭐ Vouch Added")
        .setDescription(`${target} got a vouch from ${message.author}!`)
        .addFields({ name: "Total", value: `${v + 1}⭐`, inline: true })
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
        .setTitle("⭐ Vouches")
        .setDescription(`${target} has ${v} vouch${v !== 1 ? "es" : ""}.`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
      ]
    })
  }

  // ─── WARNING SYSTEM ───

  if (cmd === "warn") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "@mention someone.")] })

    const warns = (await db.get(`warn_${target.id}`)) || 0
    await db.set(`warn_${target.id}`, warns + 1)

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.RED)
        .setTitle("⚠️ User Warned")
        .setDescription(`${target} warned by ${message.author}.`)
        .addFields({ name: "Total", value: `${warns + 1}⚠️`, inline: true })
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
      ]
    })
  }

  if (cmd === "removewarn") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "@mention someone.")] })

    const warns = (await db.get(`warn_${target.id}`)) || 0
    if (warns === 0) return message.reply({ embeds: [inf("No Warnings", "User has no warnings.")] })

    await db.set(`warn_${target.id}`, warns - 1)
    return message.reply({ embeds: [ok("Warning Removed", `${target} now has ${warns - 1} warning${warns - 1 !== 1 ? "s" : ""}.`)] })
  }

  if (cmd === "clearwarns") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.users.first()
    if (!target) return message.reply({ embeds: [err("No User", "@mention someone.")] })

    await db.delete(`warn_${target.id}`)
    return message.reply({ embeds: [ok("Cleared", `${target}'s warnings cleared.`)] })
  }

  if (cmd === "warns") {
    const target = message.mentions.users.first() || message.author
    const warns = (await db.get(`warn_${target.id}`)) || 0

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(warns > 0 ? C.YELLOW : C.GREEN)
        .setTitle("⚠️ Warnings")
        .setDescription(`${target} has ${warns} warning${warns !== 1 ? "s" : ""}.`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setTimestamp()
      ]
    })
  }

  // ─── UTILITY ───

  if (cmd === "purge") {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [err("No Permission", "Manage Messages required.")] })

    const amount = parseInt(args[0])
    if (!amount || amount < 1 || amount > 100)
      return message.reply({ embeds: [err("Invalid", "Enter 1-100.")] })

    await message.channel.bulkDelete(amount, true).catch(() => {})

    const msg = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(C.RED)
        .setTitle("🗑️ Purged")
        .setDescription(`Deleted ${amount} message${amount !== 1 ? "s" : ""}.`)
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
        .setDescription(`${message.author} is AFK.\n**Reason:** ${reason}`)
        .setTimestamp()
      ]
    })
  }

  if (cmd === "announce") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const channel = message.mentions.channels.first()
    const text = args.slice(1).join(" ")
    if (!channel || !text)
      return message.reply({ embeds: [err("Invalid", "Usage: `.announce #channel <message>`")] })

    const embed = new EmbedBuilder()
      .setColor(C.GOLD)
      .setTitle("📢 Announcement")
      .setDescription(text)
      .setFooter({ text: `By ${message.author.username}` })
      .setTimestamp()

    await channel.send({ embeds: [embed] })
    return message.reply({ embeds: [ok("Announced", `Sent to ${channel}.`)] })
  }

  if (cmd === "steal") {
    if (!member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))
      return message.reply({ embeds: [err("No Permission", "Manage Emojis required.")] })

    const emojiMatch = args[0]?.match(/<?a?:?(\w+):(\d+)>?/)
    if (!emojiMatch)
      return message.reply({ embeds: [err("Invalid", "Provide a valid emoji.")] })

    const [, name, id] = emojiMatch
    const animated = args[0].startsWith("<a:")
    const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`

    const newEmoji = await guild.emojis.create({ attachment: url, name }).catch(() => null)
    if (!newEmoji)
      return message.reply({ embeds: [err("Failed", "Couldn't steal emoji.")] })

    return message.reply({ embeds: [ok("Stolen", `Added ${newEmoji}!`)] })
  }

  // ─── USER MANAGEMENT ───

  if (cmd === "addrole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.members.first()
    const role = message.mentions.roles.first()
    if (!target || !role)
      return message.reply({ embeds: [err("Invalid", "Usage: `.addrole @user @role`")] })

    await target.roles.add(role).catch(() => {})
    return message.reply({ embeds: [ok("Role Added", `${role} added to ${target}.`)] })
  }

  if (cmd === "ban") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.users.first()
    const reason = args.slice(1).join(" ") || "No reason"
    if (!target)
      return message.reply({ embeds: [err("No User", "@mention someone.")] })

    await guild.members.ban(target, { reason }).catch(() => {})
    return message.reply({ embeds: [ok("Banned", `${target.tag} banned.\n**Reason:** ${reason}`)] })
  }

  if (cmd === "unban") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const userId = args[0]
    if (!userId)
      return message.reply({ embeds: [err("No ID", "Provide user ID.")] })

    await guild.members.unban(userId).catch(() => {})
    return message.reply({ embeds: [ok("Unbanned", `<@${userId}> unbanned.`)] })
  }

  if (cmd === "mute") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.members.first()
    const minutes = parseInt(args[1]) || 60
    const reason = args.slice(2).join(" ") || "No reason"
    if (!target)
      return message.reply({ embeds: [err("No User", "@mention someone.")] })

    await target.timeout(minutes * 60 * 1000, reason).catch(() => {})
    return message.reply({ embeds: [ok("Muted", `${target} timeout for ${minutes}m.\n**Reason:** ${reason}`)] })
  }

  if (cmd === "unmute") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const target = message.mentions.members.first()
    if (!target)
      return message.reply({ embeds: [err("No User", "@mention someone.")] })

    await target.timeout(null).catch(() => {})
    return message.reply({ embeds: [ok("Unmuted", `${target}'s timeout removed.`)] })
  }

  // ─── BOT OWNER ───

  if (cmd === "remove") {
    if (message.author.id !== ownerID) return
    await message.reply({ embeds: [ok("Leaving", `Leaving ${guild.name}...`)] })
    guild.leave()
  }

  if (cmd === "approve") {
    if (message.author.id !== ownerID) return
    return message.reply({ embeds: [ok("Approved", `${guild.name} approved.`)] })
  }

  if (cmd === "killbug") {
    if (message.author.id !== ownerID) return
    await message.reply({ embeds: [ok("Shutting Down", "Goodbye...")] })
    process.exit(0)
  }

  if (cmd === "initialize") {
    return message.reply({ embeds: [inf("Request Sent", "Owner will review your request.")] })
  }

  if (cmd === "reapplyautorole") {
    if (!await isAdmin(member, guild.id))
      return message.reply({ embeds: [err("No Permission", "Admin only.")] })

    const roleId = await db.get(`autorole_${guild.id}`)
    if (!roleId)
      return message.reply({ embeds: [err("No Role", "Use `.autorole @role` first.")] })

    const processingMsg = await message.reply({ embeds: [inf("Processing", "Applying role...")] })

    const members = await guild.members.fetch()
    let count = 0
    for (const m of members.values()) {
      if (!m.roles.cache.has(roleId)) {
        await m.roles.add(roleId).catch(() => {})
        count++
      }
    }

    return processingMsg.edit({ embeds: [ok("Applied", `Auto-role applied to ${count} member${count !== 1 ? "s" : ""}.`)] })
  }

  // ─── HELP COMMAND ───

  if (cmd === "help") {
    const embed = buildHelpEmbed(0, message.author)
    const buttons = buildHelpButtons(0)

    const msg = await message.channel.send({ embeds: [embed], components: [buttons] })

    // Store session - NO TIMEOUT
    await db.set(`help_${msg.id}`, {
      userId: message.author.id,
      page: 0,
    })

    console.log(`✅ Help created: ${msg.id}`)
    return
  }

  if (cmd === "ping") {
    return message.reply(`🏓 Pong! ${client.ws.ping}ms`)
  }

  if (cmd === "pbgontop") {
    return message.reply("https://discord.gg/knhits")
  }
})

// ─── INTERACTIONS ───

client.on("interactionCreate", async interaction => {
  if (interaction.isButton() && ["help_first", "help_prev", "help_next", "help_last"].includes(interaction.customId)) {
    const session = await db.get(`help_${interaction.message.id}`)

    if (!session) {
      return interaction.reply({
        content: "Help menu expired. Run `.help` again.",
        ephemeral: true,
      })
    }

    if (interaction.user.id !== session.userId) {
      return interaction.reply({
        content: "Only the person who ran `.help` can use this.",
        ephemeral: true,
      })
    }

    let page = session.page || 0

    if (interaction.customId === "help_first") page = 0
    else if (interaction.customId === "help_prev") page = Math.max(0, page - 1)
    else if (interaction.customId === "help_next") page = Math.min(HELP_PAGES.length - 1, page + 1)
    else if (interaction.customId === "help_last") page = HELP_PAGES.length - 1

    session.page = page
    await db.set(`help_${interaction.message.id}`, session)

    await interaction.update({
      embeds: [buildHelpEmbed(page, interaction.user)],
      components: [buildHelpButtons(page)],
    })
    return
  }

  if (!interaction.isButton() && !interaction.isModalSubmit()) return

  if (interaction.customId === "mm_yes") {
    await interaction.channel.send(`${interaction.user} understood ✅`)
    return interaction.reply({ content: "Recorded.", ephemeral: true })
  }

  if (interaction.customId === "mm_no") {
    await interaction.channel.send(`${interaction.user} didn't understand ❌`)
    return interaction.reply({ content: "Recorded.", ephemeral: true })
  }

  if (interaction.customId === "mm_request") {
    const modal = new ModalBuilder().setCustomId("mm_form").setTitle("Request Middleman")

    const tradeInput = new TextInputBuilder()
      .setCustomId("trade")
      .setLabel("Trade details")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("e.g. Garama for dragon")
      .setMaxLength(1000)
      .setRequired(true)

    const otherPartyInput = new TextInputBuilder()
      .setCustomId("other_party")
      .setLabel("Other party")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("@user (optional)")
      .setRequired(false)

    modal.addComponents(
      new ActionRowBuilder().addComponents(tradeInput),
      new ActionRowBuilder().addComponents(otherPartyInput)
    )
    return interaction.showModal(modal)
  }

  if (interaction.isModalSubmit() && interaction.customId === "mm_form") {
    const trade = interaction.fields.getTextInputValue("trade")
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
        ...(ticketRoleId
          ? [
              {
                id: ticketRoleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
              },
            ]
          : []),
      ],
    })

    const ticketEmbed = new EmbedBuilder()
      .setColor(C.BLUE)
      .setTitle("🎫 Middleman Ticket")
      .setDescription("A middleman will be with you shortly.")
      .addFields(
        { name: "Trade Details", value: trade, inline: false },
        { name: "Other Party", value: otherParty, inline: true },
        { name: "Ticket Creator", value: `${interaction.user}`, inline: true }
      )
      .setFooter({ text: "MM Service • Trusted & Secure" })
      .setTimestamp()

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("claim_ticket").setLabel("🟢 Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("adduser_ticket").setLabel("➕ Add User").setStyle(ButtonStyle.Secondary)
    )

    const roleMention = ticketRoleId ? `<@&${ticketRoleId}> ` : ""
    await ticket.send({ content: `${roleMention}${interaction.user}`, embeds: [ticketEmbed], components: [closeRow] })

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.GREEN)
        .setTitle("✅ Ticket Created")
        .setDescription(`Ticket: ${ticket}`)
        .setTimestamp()
      ],
      ephemeral: true,
    })
  }

  if (interaction.customId === "close_ticket") {
    if (!interaction.channel.name.startsWith("ticket"))
      return interaction.reply({ embeds: [err("Not Ticket", "Use inside ticket only.")], ephemeral: true })

    const embed = new EmbedBuilder()
      .setColor(C.RED)
      .setTitle("🔒 Closing")
      .setDescription("Deleting in 5 seconds...")
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
  }

  if (interaction.customId === "claim_ticket") {
    if (!await isTicketStaff(interaction.member, interaction.guild.id))
      return interaction.reply({ content: "❌ Ticket Staff only.", ephemeral: true })

    const updatedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("claim_ticket").setLabel(`✅ Claimed by ${interaction.user.username}`).setStyle(ButtonStyle.Success).setDisabled(true),
      new ButtonBuilder().setCustomId("adduser_ticket").setLabel("➕ Add User").setStyle(ButtonStyle.Secondary)
    )
    await interaction.message.edit({ components: [updatedRow] })

    const embed = new EmbedBuilder()
      .setColor(C.GREEN)
      .setTitle("✅ Claimed")
      .setDescription(`${interaction.user} claimed this ticket.`)
      .setTimestamp()
    return interaction.reply({ embeds: [embed] })
  }

  if (interaction.customId === "adduser_ticket") {
    if (!await isTicketStaff(interaction.member, interaction.guild.id))
      return interaction.reply({ content: "❌ Ticket Staff only.", ephemeral: true })

    const modal = new ModalBuilder().setCustomId("adduser_form").setTitle("Add User")
    const input = new TextInputBuilder()
      .setCustomId("user_id")
      .setLabel("User ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Enter user ID")
      .setRequired(true)
    modal.addComponents(new ActionRowBuilder().addComponents(input))
    return interaction.showModal(modal)
  }

  if (interaction.isModalSubmit() && interaction.customId === "adduser_form") {
    const userId = interaction.fields.getTextInputValue("user_id").replace(/[<@!>]/g, "").trim()
    const target = await interaction.guild.members.fetch(userId).catch(() => null)
    if (!target)
      return interaction.reply({ content: "❌ User not found.", ephemeral: true })

    await interaction.channel.permissionOverwrites.edit(target, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    })

    const embed = new EmbedBuilder()
      .setColor(C.GREEN)
      .setTitle("➕ Added")
      .setDescription(`${target} added.`)
      .setTimestamp()
    return interaction.reply({ embeds: [embed] })
  }

  if (interaction.customId === "scam_join") {
    const mode = await db.get(`scmsg_mode_${interaction.guild.id}`) || "role"

    if (mode === "server") {
      const serverLink = await db.get(`scmsg_server_${interaction.guild.id}`)
      if (!serverLink)
        return interaction.reply({ content: "⚠️ No link set.", ephemeral: true })
      await interaction.channel.send(`${interaction.user} joined us 🤝`)
      return interaction.reply({ content: `✅ Link: ${serverLink}`, ephemeral: true })
    } else {
      const mercyRoleId = await db.get(`mercyrole_${interaction.guild.id}`)
      if (!mercyRoleId)
        return interaction.reply({ content: "⚠️ No role set.", ephemeral: true })
      await interaction.member.roles.add(mercyRoleId).catch(() => {})
      await interaction.channel.send(`${interaction.user} joined us 🤝`)
      return interaction.reply({ content: "✅ Mercy given!", ephemeral: true })
    }
  }

  if (interaction.customId === "scam_leave") {
    await interaction.channel.send(`${interaction.user} left 😂`)
    return interaction.reply({ content: "Goodbye!", ephemeral: true })
  }
})

client.on("error", err => console.error("Error:", err))
process.on("unhandledRejection", err => console.error("Rejection:", err))

client.login(process.env.TOKEN)
