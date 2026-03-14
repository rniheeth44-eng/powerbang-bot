const express = require("express")
const app = express()

app.get("/", (req, res) => {
  res.send("Bot is running")
})

app.listen(3000, () => {
  console.log("Web server running on port 3000")
})

const path = require("path");

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
  ChannelType
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

const GITHUB_IMG = "https://raw.githubusercontent.com/rniheeth44-eng/powerbang-bot/main/assets"
const IMG_BASE = GITHUB_IMG

if (!process.env.TOKEN) {
  console.error("âŒ ERROR: TOKEN not set!")
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

const ok = (title, desc) => new EmbedBuilder().setColor(C.GREEN).setTitle(`âœ… ${title}`).setDescription(desc).setTimestamp()
const err = (title, desc) => new EmbedBuilder().setColor(C.RED).setTitle(`âŒ ${title}`).setDescription(desc).setTimestamp()
const inf = (title, desc) => new EmbedBuilder().setColor(C.BLUE).setTitle(`ðŸ“‹ ${title}`).setDescription(desc).setTimestamp()

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

// â”€â”€â”€ HELP PAGES â”€â”€â”€
const HELP_PAGES = [
  {
    title: "ðŸ” Bot Help Menu",
    color: C.BLUE,
    description: "Welcome to the Bot help system! Use the buttons below to navigate between command categories.\n\nðŸ“‹ **Categories Available:**\n1. ðŸŽ« Ticket & Middleman\n2. âš™ï¸ Configuration & Setup\n3. ðŸ‘€ View & Info Commands\n4. ðŸ¤ Vouch System\n5. âš ï¸ Warning System\n6. ðŸ”§ Utility Commands\n7. ðŸ‘¤ User Management\n8. ðŸ‘‘ Bot Owner Only\n9. ðŸŒ Support System\n\nðŸ–Šï¸ **How to Use:**\nâ€¢ Use the navigation buttons to browse categories\nâ€¢ Only the person who used `.help` can use the buttons\nâ€¢ Click âŒ to close this menu\nâ€¢ Commands automatically time out after 60 seconds\n\nðŸ”‘ **Permission Legend:**\nâ€¢ **(admin)**: Requires admin role\nâ€¢ **(ticket staff)**: Requires ticket/admin role\nâ€¢ **(anyone)**: Everyone can use",
  },
  {
    title: "ðŸŽ« Ticket & Middleman",
    color: C.BLUE,
    description: "`.ticketpanel` â€” Post ticket panel *(ticket staff)*\n`.support` â€” Post support panel *(ticket staff)*\n`.adduser` â€” Add user to ticket *(ticket staff)*\n`.claim` â€” Claim a ticket *(ticket staff)*\n`.unclaim` â€” Unclaim a ticket *(ticket staff)*\n`.close` â€” Close a ticket *(ticket staff)*\n`.confirm` â€” Confirm trade *(ticket staff)*\n`.mmfee` â€” Show MM fees *(ticket staff)*\n`.hitbypbg` â€” Show scam recovery *(anyone)*\n`.guide` â€” Show hitting guide *(anyone)*\n`.mminfo` â€” Show MM info *(anyone)*\n`.scmsg` â€” Show scam message *(ticket staff)*",
  },
  {
    title: "âš™ï¸ Configuration & Setup",
    color: C.PURPLE,
    description: "`.setadminrole @role` â€” Set admin role *(admin)*\n`.setticketrole @role` â€” Set ticket staff role *(admin)*\n`.remticketrole` â€” Remove ticket role *(admin)*\n`.setmercyrole @role` â€” Set mercy role *(admin)*\n`.remmercyrole` â€” Remove mercy role *(admin)*\n`.setserver` â€” Set server invite link *(admin)*\n`.change` â€” Toggle role/server mode *(admin)*\n`.setprofit @user <amount>` â€” Set profit *(admin)*\n`.setlimit @user <amount>` â€” Set limit *(admin)*\n`.setvouches @user <amount>` â€” Set vouches *(admin)*\n`.autorole @role` â€” Set auto-role *(admin)*\n`.autoroledisable` â€” Disable auto-role *(admin)*",
  },
  {
    title: "ðŸ‘€ View & Info Commands",
    color: C.TEAL,
    description: "`.viewticketrole` â€” View ticket role *(anyone)*\n`.viewmercyrole` â€” View mercy role *(anyone)*\n`.viewadminrole` â€” View admin role *(anyone)*\n`.search [@user]` â€” View user stats *(anyone)*\n`.warns [@user]` â€” View warnings *(anyone)*\n`.w [@user]` â€” User info *(anyone)*\n`.av [@user]` â€” View avatar *(anyone)*\n`.vouchcount [@user]` â€” View vouches *(anyone)*\n`.debug` â€” Bot status *(anyone)*\n`.autoroleview` â€” View auto-role *(anyone)*\n`.autorolestats` â€” Auto-role stats *(anyone)*\n`.serverinfo` â€” Server info *(anyone)*",
  },
  {
    title: "ðŸ¤ Vouch System",
    color: C.GOLD,
    description: "`.vouch @user` â€” Vouch a user *(anyone)*\n`.vouchcount [@user]` â€” View vouch count *(anyone)*\n`.setvouches @user <amount>` â€” Set vouches *(admin)*",
  },
  {
    title: "âš ï¸ Warning System",
    color: C.YELLOW,
    description: "`.warn @user` â€” Warn a user *(admin)*\n`.removewarn @user` â€” Remove a warning *(admin)*\n`.clearwarns @user` â€” Clear all warnings *(admin)*\n`.warns [@user]` â€” View warnings *(anyone)*",
  },
  {
    title: "ðŸ”§ Utility Commands",
    color: C.GREY,
    description: "`.purge <1-100>` â€” Delete messages *(admin)*\n`.afk [reason]` â€” Set AFK status *(anyone)*\n`.announce #channel <msg>` â€” Send announcement *(admin)*\n`.steal <emoji>` â€” Steal an emoji *(Manage Emojis)*",
  },
  {
    title: "ðŸ‘¤ User Management",
    color: C.RED,
    description: "`.addrole @user @role` â€” Add role to user *(admin)*\n`.ban @user [reason]` â€” Ban a user *(admin)*\n`.unban <userID>` â€” Unban a user *(admin)*\n`.mute @user [minutes] [reason]` â€” Timeout user *(admin)*\n`.unmute @user` â€” Remove timeout *(admin)*",
  },
  {
    title: "ðŸ‘‘ Bot Owner Only",
    color: C.GOLD,
    description: "`.remove` â€” Make bot leave server *(owner)*\n`.approve` â€” Approve a server *(owner)*\n`.killbug` â€” Shutdown bot *(owner)*\n`.initialize` â€” Request bot setup *(anyone)*\n`.reapplyautorole` â€” Reapply auto-role to all *(admin)*",
  },
  {
    title: "ðŸŒ Support System",
    color: C.TEAL,
    description: "`.ping` â€” Check bot ping *(anyone)*\n`.pbgontop` â€” Discord invite *(anyone)*\n`.help` â€” Show this menu *(anyone)*",
  },
]

function buildHelpEmbed(page, requester) {
  const data = HELP_PAGES[page]
  return new EmbedBuilder()
    .setColor(data.color)
    .setTitle(data.title)
    .setDescription(data.description)
    .setFooter({ text: `Requested by ${requester.username} â€¢ Page ${page + 1}/${HELP_PAGES.length} | Today at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` })
    .setTimestamp()
}

function buildHelpButtons(page) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("help_first").setEmoji("â®ï¸").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId("help_prev").setEmoji("â—€ï¸").setStyle(ButtonStyle.Primary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId("help_page").setLabel(`${page + 1}/${HELP_PAGES.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId("help_next").setEmoji("â–¶ï¸").setStyle(ButtonStyle.Primary).setDisabled(page === HELP_PAGES.length - 1),
    new ButtonBuilder().setCustomId("help_last").setEmoji("â­ï¸").setStyle(ButtonStyle.Secondary).setDisabled(page === HELP_PAGES.length - 1),
  )
}

// â”€â”€â”€ READY EVENT â”€â”€â”€
client.once("ready", () => {
  console.log(`âœ… Bot Online: ${client.user.tag}`)
  client.user.setActivity("PowerBang âš¡", { type: "WATCHING" })
})

// â”€â”€â”€ AUTO-ROLE â”€â”€â”€
client.on("guildMemberAdd", async member => {
  const roleId = await db.get(`autorole_${member.guild.id}`)
  if (!roleId) return
  member.roles.add(roleId).catch(() => {})
})

// â”€â”€â”€ MESSAGE CREATE â”€â”€â”€
client.on("messageCreate", async message => {
  if (message.author.bot) return
  if (!message.guild) return

  // AFK mentions
  for (const user of message.mentions.users.values()) {
    const afkReason = await db.get(`afk_${user.id}`)
    if (afkReason) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(C.YELLOW).setDescription(`ðŸ’¤ **${user.username}** is AFK: ${afkReason}`)] }).catch(() => {})
    }
  }

  // Remove AFK when user chats
  if (!message.content.startsWith(prefix + "afk")) {
    const afkReason = await db.get(`afk_${message.author.id}`)
    if (afkReason) {
      await db.delete(`afk_${message.author.id}`)
      await message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`ðŸ‘‹ Welcome back! AFK removed.`)] }).catch(() => {})
    }
  }

  if (!message.content.startsWith(prefix)) return

  const args = message.content.slice(prefix.length).trim().split(/ +/)
  const cmd = args.shift().toLowerCase()
  if (!cmd) return

  const guild = message.guild
  const member = message.member

  try {

    // â”€â”€â”€ TICKETS â”€â”€â”€
    if (cmd === "ticketpanel") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})

      const embed = new EmbedBuilder()
        .setColor(C.BLUE)
        .setTitle("Request An Middleman")
        .setDescription("**Welcome to MM Service!**\n\nRead ToS then click **Request Middleman**.\n\n**Rules:**\nâ€¢ Vouch MM after trade\nâ€¢ No vouch = Blacklist\nâ€¢ Troll tickets = Ban\n\n**Disclaimer:**\nNot responsible for post-trade issues or duped items")
        .setImage(`${IMG_BASE}/ticketpanel2.jpg`)
        .setFooter({ text: "MM Service â€¢ Contact staff" })

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("mm_request").setLabel("ðŸŽ« Request MM").setStyle(ButtonStyle.Primary)
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
      await message.channel.send({ embeds: [embed], components: [row] })
      return
    }

    if (cmd === "support") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})

      const embed = new EmbedBuilder()
        .setColor(C.TEAL)
        .setTitle("ðŸ†˜ Support")
        .setDescription("Need help? Click below.\n\n**Before opening:**\nâ€¢ Check #faq\nâ€¢ Explain clearly\nâ€¢ No spam")

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("mm_request").setLabel("ðŸ†˜ Open Ticket").setStyle(ButtonStyle.Secondary)
      )
      return message.channel.send({ embeds: [embed], components: [row] })
    }

    if (cmd === "adduser") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})
      if (!message.channel.name.startsWith("ticket"))
        return message.reply({ embeds: [err("Not a Ticket", "Use in ticket channel")] }).catch(() => {})

      const target = message.mentions.members.first()
      if (!target)
        return message.reply({ embeds: [err("No User", "@mention someone")] }).catch(() => {})

      await message.channel.permissionOverwrites.edit(target, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })

      return message.reply({ embeds: [ok("Added", `${target} added to ticket`)] }).catch(() => {})
    }

    if (cmd === "claim") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})
      if (!message.channel.name.startsWith("ticket"))
        return message.reply({ embeds: [err("Not a Ticket", "Use in ticket channel")] }).catch(() => {})

      return message.channel.send({
        embeds: [new EmbedBuilder().setColor(C.GREEN).setTitle("ðŸŸ¢ Claimed").setDescription(`${message.author} claimed this.`).setTimestamp()]
      })
    }

    if (cmd === "unclaim") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})

      return message.channel.send({
        embeds: [new EmbedBuilder().setColor(C.YELLOW).setTitle("ðŸŸ¡ Unclaimed").setDescription("Waiting for a middleman...").setTimestamp()]
      })
    }

    if (cmd === "close") {
      if (!message.channel.name.startsWith("ticket")) return
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})

      await message.channel.send({
        embeds: [new EmbedBuilder().setColor(C.RED).setTitle("ðŸ”’ Closing").setDescription("Deleting in 5s...").setTimestamp()]
      })
      setTimeout(() => message.channel.delete().catch(() => {}), 5000)
      return
    }

    if (cmd === "confirm") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})

      return message.channel.send({
        embeds: [new EmbedBuilder().setColor(C.GREEN).setTitle("âœ… Confirmed").setDescription(`${message.author} confirmed!\n\nBoth vouch MM! ðŸŽ‰`).setTimestamp()]
      })
    }

    if (cmd === "mmfee") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(C.GOLD)
          .setTitle("ðŸ’° Fees")
          .addFields(
            { name: "$0â€“$100", value: "5%", inline: true },
            { name: "$100â€“$500", value: "3%", inline: true },
            { name: "$500+", value: "2%", inline: true }
          )
        ]
      })
    }

    // â”€â”€â”€ HITBYPBG (upgraded) â”€â”€â”€
    if (cmd === "hitbypbg") {
      if (!message.channel.name.startsWith("ticket"))
        return message.reply({ embeds: [err("Ticket Only", "Use in ticket")] }).catch(() => {})

      // Store the invoker so Yes handler can DM them
      await db.set(`hitbypbg_invoker_${message.channel.id}`, {
        userId: message.author.id,
        username: message.author.username,
      })

      const embed = new EmbedBuilder()
        .setColor(C.GOLD)
        .setTitle("âš¡ Welcome To Our Hitting Era")
        .setDescription("Here We Make People Rich by scamming others.\n\n**Would You Like to Join us and become richer than you ever were?**\n\n> Join us Now, **BECOME Richer** than you ever were!\n\n*Choose wisely â€” there is no going back.*")
        .setFooter({ text: "PowerBang â€¢ Hitting Era" })
        .setTimestamp()

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hitbypbg_yes_${message.channel.id}`).setLabel("âœ… Yes, Join").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`hitbypbg_no_${message.channel.id}`).setLabel("âœ– No").setStyle(ButtonStyle.Danger),
      )

      return message.channel.send({ embeds: [embed], components: [row] })
    }

    // â”€â”€â”€ SCMSG (upgraded) â”€â”€â”€
    if (cmd === "scmsg") {
      if (!await isTicketStaff(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Ticket Staff only")] }).catch(() => {})

      // Store the invoker for this channel
      await db.set(`scmsg_invoker_${message.channel.id}`, {
        userId: message.author.id,
        username: message.author.username,
      })

      const embed = new EmbedBuilder()
        .setColor(C.RED)
        .setTitle("Uh Oh! Unfortunately you got scammed")
        .setDescription(
          "You can recover your loss by letting the MM know if you want join us or no.\n\n" +
          "You can earn **2x or 3x** of what you lost.\n" +
          "ðŸ”— For the server link vouch the MM first as they tell you.\n" +
          "ðŸ’° If you scam anyone's items, you will take **60%** of the scam and MM takes **40%..**\n" +
          "ðŸš« Or you can go home crying with nothing in your pocket."
        )
        .setImage(`${IMG_BASE}/scmsg.jpg`)
        .setFooter({ text: "MM Service â€¢ Contact staff" })
        .setTimestamp()

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`scmsg_join_${message.channel.id}`).setLabel("Join Us").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`scmsg_leave_${message.channel.id}`).setLabel("Leave").setStyle(ButtonStyle.Danger),
      )

      await message.delete().catch(() => {})
      return message.channel.send({ embeds: [embed], components: [row] })
    }

    if (cmd === "guide") {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(C.BLUE)
          .setTitle("H1TTING TUTORIAL")
          .setDescription("**What is it?** Using fake service to scam.\n\n**Strategy:** Find trades â†’ offer â†’ suggest MM â†’ gain trust â†’ open ticket â†’ MM assists â†’ profit split\n\n**MM Status:** After 10 h1ts or pay for it")
        ]
      })
    }

    // â”€â”€â”€ MMINFO (upgraded) â”€â”€â”€
    if (cmd === "mminfo") {
      const embed = new EmbedBuilder()
        .setColor(C.BLUE)
        .setTitle("Middleman Info")
        .setDescription(
          "â€¢ Seller gives the items to the middleman.\n\n" +
          "â€¢ Buyer pays the seller.\n\n" +
          "â€¢ Once the seller confirms the payment, the middleman passes the items to the buyer.\n\n" +
          "â€¢ Both traders must vouch the middleman after use.\n\n" +
          "If you have questions, click a button below!"
        )
        .setImage(`${IMG_BASE}/mminfo2.jpg`)
        .setFooter({ text: "Middleman System â€¢ Trusted & Secure" })
        .setTimestamp()

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("mm_understand").setLabel("âœ… I Understand").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("mm_dontunderstand").setLabel("âœ– I Don't Understand").setStyle(ButtonStyle.Danger),
      )

      return message.reply({ embeds: [embed], components: [row] })
    }

    // â”€â”€â”€ CONFIG â”€â”€â”€
    if (cmd === "setadminrole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
      if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.setadminrole @role`")] }).catch(() => {})

      await db.set(`adminrole_${guild.id}`, role.id)
      return message.reply({ embeds: [ok("Set", `${role} is admin`)] }).catch(() => {})
    }

    if (cmd === "setticketrole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
      if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.setticketrole @role`")] }).catch(() => {})

      await db.set(`ticketrole_${guild.id}`, role.id)
      return message.reply({ embeds: [ok("Set", `${role} is ticket staff`)] }).catch(() => {})
    }

    if (cmd === "remticketrole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      await db.delete(`ticketrole_${guild.id}`)
      return message.reply({ embeds: [ok("Removed", "Ticket role cleared")] }).catch(() => {})
    }

    if (cmd === "setmercyrole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
      if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.setmercyrole @role`")] }).catch(() => {})

      await db.set(`mercyrole_${guild.id}`, role.id)
      return message.reply({ embeds: [ok("Set", `${role} is mercy`)] }).catch(() => {})
    }

    if (cmd === "remmercyrole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      await db.delete(`mercyrole_${guild.id}`)
      return message.reply({ embeds: [ok("Removed", "Mercy role cleared")] }).catch(() => {})
    }

    if (cmd === "setserver") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const prompt = await message.channel.send({ embeds: [inf("Set", "Send link (30s):")] })
      const filter = m => m.author.id === message.author.id
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] }).catch(() => null)

      if (!collected || collected.size === 0)
        return prompt.edit({ embeds: [err("Timeout", "No link")] })

      const link = collected.first().content.trim()
      await collected.first().delete().catch(() => {})
      await db.set(`scmsg_server_${guild.id}`, link)
      return prompt.edit({ embeds: [ok("Saved", "Link set")] })
    }

    if (cmd === "change") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const current = await db.get(`scmsg_mode_${guild.id}`) || "role"
      const next = current === "role" ? "server" : "role"
      await db.set(`scmsg_mode_${guild.id}`, next)

      const desc = next === "server" ? "**Server Link Mode**" : "**Mercy Role Mode**"
      return message.reply({ embeds: [ok("Changed", desc)] }).catch(() => {})
    }

    if (cmd === "setprofit") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.users.first()
      const amount = parseFloat(args[1])
      if (!target || isNaN(amount))
        return message.reply({ embeds: [err("Invalid", "Usage: `.setprofit @user <amount>`")] }).catch(() => {})

      await db.set(`profit_${target.id}`, amount)
      return message.reply({ embeds: [ok("Set", `${target} profit: $${amount}`)] }).catch(() => {})
    }

    if (cmd === "setlimit") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.users.first()
      const amount = parseFloat(args[1])
      if (!target || isNaN(amount))
        return message.reply({ embeds: [err("Invalid", "Usage: `.setlimit @user <amount>`")] }).catch(() => {})

      await db.set(`limit_${target.id}`, amount)
      return message.reply({ embeds: [ok("Set", `${target} limit: $${amount}`)] }).catch(() => {})
    }

    if (cmd === "setvouches") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.users.first()
      const amount = parseInt(args[1])
      if (!target || isNaN(amount))
        return message.reply({ embeds: [err("Invalid", "Usage: `.setvouches @user <amount>`")] }).catch(() => {})

      await db.set(`vouch_${target.id}`, amount)
      return message.reply({ embeds: [ok("Set", `${target} vouches: ${amount}`)] }).catch(() => {})
    }

    if (cmd === "autorole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const role = message.mentions.roles.first() || guild.roles.cache.get(args[0])
      if (!role) return message.reply({ embeds: [err("No Role", "Usage: `.autorole @role`")] }).catch(() => {})

      await db.set(`autorole_${guild.id}`, role.id)
      return message.reply({ embeds: [ok("Set", `Auto-role: ${role}`)] }).catch(() => {})
    }

    if (cmd === "autoroledisable") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      await db.delete(`autorole_${guild.id}`)
      return message.reply({ embeds: [ok("Disabled", "Auto-role cleared")] }).catch(() => {})
    }

    // â”€â”€â”€ VIEW â”€â”€â”€
    if (cmd === "viewticketrole") {
      const roleId = await db.get(`ticketrole_${guild.id}`)
      return message.reply({ embeds: [inf("Ticket Role", roleId ? `<@&${roleId}>` : "Not set")] }).catch(() => {})
    }

    if (cmd === "viewmercyrole") {
      const roleId = await db.get(`mercyrole_${guild.id}`)
      return message.reply({ embeds: [inf("Mercy Role", roleId ? `<@&${roleId}>` : "Not set")] }).catch(() => {})
    }

    if (cmd === "viewadminrole") {
      const roleId = await db.get(`adminrole_${guild.id}`)
      return message.reply({ embeds: [inf("Admin Role", roleId ? `<@&${roleId}>` : "Server Admin")] }).catch(() => {})
    }

    if (cmd === "autoroleview") {
      const roleId = await db.get(`autorole_${guild.id}`)
      return message.reply({ embeds: [inf("Auto-Role", roleId ? `<@&${roleId}>` : "Not set")] }).catch(() => {})
    }

    if (cmd === "autorolestats") {
      const roleId = await db.get(`autorole_${guild.id}`)
      if (!roleId) return message.reply({ embeds: [inf("Stats", "No auto-role")] }).catch(() => {})

      const role = guild.roles.cache.get(roleId)
      if (!role) return message.reply({ embeds: [err("Not Found", "Role deleted")] }).catch(() => {})

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.TEAL).setTitle("ðŸ“Š Stats").addFields(
          { name: "Role", value: `${role}`, inline: true },
          { name: "Members", value: `${role.members.size}`, inline: true }
        ).setTimestamp()]
      })
    }

    if (cmd === "search") {
      const target = message.mentions.users.first() || message.author
      const profit = (await db.get(`profit_${target.id}`)) ?? "Not set"
      const limit = (await db.get(`limit_${target.id}`)) ?? "Not set"
      const vouches = (await db.get(`vouch_${target.id}`)) || 0

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.TEAL).setTitle(`ðŸ” ${target.username}`).setThumbnail(target.displayAvatarURL({ size: 256 })).addFields(
          { name: "Profit", value: typeof profit === "number" ? `$${profit}` : profit, inline: true },
          { name: "Limit", value: typeof limit === "number" ? `$${limit}` : limit, inline: true },
          { name: "Vouches", value: `${vouches}`, inline: true }
        ).setTimestamp()]
      })
    }

    if (cmd === "w") {
      const target = message.mentions.members.first() || member
      const joined = `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`
      const created = `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`
      const roles = target.roles.cache.filter(r => r.id !== guild.id).sort((a, b) => b.position - a.position).first(5).map(r => `${r}`).join(", ") || "None"

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.BLUE).setTitle(`ðŸ‘¤ ${target.user.username}`).setThumbnail(target.user.displayAvatarURL({ size: 256 })).addFields(
          { name: "Username", value: target.user.tag, inline: true },
          { name: "ID", value: target.id, inline: true },
          { name: "Created", value: created, inline: false },
          { name: "Joined", value: joined, inline: false },
          { name: "Roles", value: roles, inline: false }
        ).setTimestamp()]
      })
    }

    if (cmd === "av") {
      const target = message.mentions.users.first() || message.author
      return message.channel.send({
        embeds: [new EmbedBuilder().setColor(C.BLUE).setTitle(`${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 1024, extension: "png" })).setTimestamp()]
      })
    }

    if (cmd === "debug") {
      const uptime = process.uptime()
      const h = Math.floor(uptime / 3600)
      const m = Math.floor((uptime % 3600) / 60)
      const s = Math.floor(uptime % 60)

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.GREEN).setTitle("ðŸ¤– Status").addFields(
          { name: "Status", value: "ðŸŸ¢ Online", inline: true },
          { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
          { name: "Uptime", value: `${h}h ${m}m ${s}s`, inline: true },
          { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
          { name: "Users", value: `${client.users.cache.size}`, inline: true }
        ).setTimestamp()]
      })
    }

    if (cmd === "serverinfo") {
      const owner = await guild.fetchOwner().catch(() => null)
      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.BLUE).setTitle(`ðŸ“Š ${guild.name}`).setThumbnail(guild.iconURL({ size: 256 })).addFields(
          { name: "Owner", value: owner ? `${owner.user}` : "Unknown", inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true }
        ).setTimestamp()]
      })
    }

    // â”€â”€â”€ VOUCH â”€â”€â”€
    if (cmd === "vouch") {
      const target = message.mentions.users.first()
      if (!target) return message.reply({ embeds: [err("No User", "@mention")] }).catch(() => {})
      if (target.id === message.author.id) return message.reply({ embeds: [err("Invalid", "Can't vouch yourself")] }).catch(() => {})

      const v = (await db.get(`vouch_${target.id}`)) || 0
      await db.set(`vouch_${target.id}`, v + 1)

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.GREEN).setTitle("â­ Vouch").setDescription(`${target} got a vouch from ${message.author}!`).addFields(
          { name: "Total", value: `${v + 1}â­`, inline: true }
        ).setThumbnail(target.displayAvatarURL({ size: 256 })).setTimestamp()]
      })
    }

    if (cmd === "vouchcount") {
      const target = message.mentions.users.first() || message.author
      const v = (await db.get(`vouch_${target.id}`)) || 0

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.GOLD).setTitle("â­ Vouches").setDescription(`${target} has ${v} vouch${v !== 1 ? "es" : ""}`).setThumbnail(target.displayAvatarURL({ size: 256 })).setTimestamp()]
      })
    }

    // â”€â”€â”€ WARNS â”€â”€â”€
    if (cmd === "warn") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.users.first()
      if (!target) return message.reply({ embeds: [err("No User", "@mention")] }).catch(() => {})

      const warns = (await db.get(`warn_${target.id}`)) || 0
      await db.set(`warn_${target.id}`, warns + 1)

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.RED).setTitle("âš ï¸ Warned").setDescription(`${target} warned by ${message.author}`).addFields(
          { name: "Total", value: `${warns + 1}âš ï¸`, inline: true }
        ).setThumbnail(target.displayAvatarURL({ size: 256 })).setTimestamp()]
      })
    }

    if (cmd === "removewarn") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.users.first()
      if (!target) return message.reply({ embeds: [err("No User", "@mention")] }).catch(() => {})

      const warns = (await db.get(`warn_${target.id}`)) || 0
      if (warns === 0) return message.reply({ embeds: [inf("None", "No warnings")] }).catch(() => {})

      await db.set(`warn_${target.id}`, warns - 1)
      return message.reply({ embeds: [ok("Removed", `${target} now has ${warns - 1} warn${warns - 1 !== 1 ? "s" : ""}`)] }).catch(() => {})
    }

    if (cmd === "clearwarns") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.users.first()
      if (!target) return message.reply({ embeds: [err("No User", "@mention")] }).catch(() => {})

      await db.delete(`warn_${target.id}`)
      return message.reply({ embeds: [ok("Cleared", `${target} warnings cleared`)] }).catch(() => {})
    }

    if (cmd === "warns") {
      const target = message.mentions.users.first() || message.author
      const warns = (await db.get(`warn_${target.id}`)) || 0

      return message.reply({
        embeds: [new EmbedBuilder().setColor(warns > 0 ? C.YELLOW : C.GREEN).setTitle("âš ï¸ Warnings").setDescription(`${target} has ${warns} warn${warns !== 1 ? "s" : ""}`).setThumbnail(target.displayAvatarURL({ size: 256 })).setTimestamp()]
      })
    }

    // â”€â”€â”€ UTILITY â”€â”€â”€
    if (cmd === "purge") {
      if (!member.permissions.has(PermissionFlagsBits.ManageMessages))
        return message.reply({ embeds: [err("No Permission", "Manage Messages")] }).catch(() => {})

      const amount = parseInt(args[0])
      if (!amount || amount < 1 || amount > 100)
        return message.reply({ embeds: [err("Invalid", "1-100")] }).catch(() => {})

      await message.channel.bulkDelete(amount, true).catch(() => {})

      const msg = await message.channel.send({
        embeds: [new EmbedBuilder().setColor(C.RED).setTitle("ðŸ—‘ï¸ Purged").setDescription(`Deleted ${amount} msg${amount !== 1 ? "s" : ""}`).setTimestamp()]
      })
      setTimeout(() => msg.delete().catch(() => {}), 4000)
      return
    }

    if (cmd === "afk") {
      const reason = args.join(" ") || "AFK"
      await db.set(`afk_${message.author.id}`, reason)

      return message.reply({
        embeds: [new EmbedBuilder().setColor(C.YELLOW).setTitle("ðŸ’¤ AFK").setDescription(`${message.author} is AFK.\n**Reason:** ${reason}`).setTimestamp()]
      })
    }

    if (cmd === "announce") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const channel = message.mentions.channels.first()
      const text = args.slice(1).join(" ")
      if (!channel || !text)
        return message.reply({ embeds: [err("Invalid", "`.announce #channel <msg>`")] }).catch(() => {})

      const embed = new EmbedBuilder().setColor(C.GOLD).setTitle("ðŸ“¢ Announcement").setDescription(text).setFooter({ text: `By ${message.author.username}` }).setTimestamp()

      await channel.send({ embeds: [embed] })
      return message.reply({ embeds: [ok("Sent", `To ${channel}`)] }).catch(() => {})
    }

    if (cmd === "steal") {
      if (!member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))
        return message.reply({ embeds: [err("No Permission", "Manage Emojis")] }).catch(() => {})

      const emojiMatch = args[0]?.match(/<?a?:?(\w+):(\d+)>?/)
      if (!emojiMatch)
        return message.reply({ embeds: [err("Invalid", "Provide valid emoji")] }).catch(() => {})

      const [, name, id] = emojiMatch
      const animated = args[0].startsWith("<a:")
      const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`

      const newEmoji = await guild.emojis.create({ attachment: url, name }).catch(() => null)
      if (!newEmoji)
        return message.reply({ embeds: [err("Failed", "Can't steal")] }).catch(() => {})

      return message.reply({ embeds: [ok("Stolen", `Added ${newEmoji}!`)] }).catch(() => {})
    }

    // â”€â”€â”€ ROLES â”€â”€â”€
    if (cmd === "addrole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.members.first()
      const role = message.mentions.roles.first()
      if (!target || !role)
        return message.reply({ embeds: [err("Invalid", "`.addrole @user @role`")] }).catch(() => {})

      await target.roles.add(role).catch(() => {})
      return message.reply({ embeds: [ok("Added", `${role} added to ${target}`)] }).catch(() => {})
    }

    if (cmd === "ban") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.users.first()
      const reason = args.slice(1).join(" ") || "No reason"
      if (!target)
        return message.reply({ embeds: [err("No User", "@mention")] }).catch(() => {})

      await guild.members.ban(target, { reason }).catch(() => {})
      return message.reply({ embeds: [ok("Banned", `${target.tag}\n**Reason:** ${reason}`)] }).catch(() => {})
    }

    if (cmd === "unban") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const userId = args[0]
      if (!userId)
        return message.reply({ embeds: [err("No ID", "Provide user ID")] }).catch(() => {})

      await guild.members.unban(userId).catch(() => {})
      return message.reply({ embeds: [ok("Unbanned", `<@${userId}> unbanned`)] }).catch(() => {})
    }

    if (cmd === "mute") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.members.first()
      const minutes = parseInt(args[1]) || 60
      const reason = args.slice(2).join(" ") || "No reason"
      if (!target)
        return message.reply({ embeds: [err("No User", "@mention")] }).catch(() => {})

      await target.timeout(minutes * 60 * 1000, reason).catch(() => {})
      return message.reply({ embeds: [ok("Muted", `${target} - ${minutes}m\n**Reason:** ${reason}`)] }).catch(() => {})
    }

    if (cmd === "unmute") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const target = message.mentions.members.first()
      if (!target)
        return message.reply({ embeds: [err("No User", "@mention")] }).catch(() => {})

      await target.timeout(null).catch(() => {})
      return message.reply({ embeds: [ok("Unmuted", `${target} timeout removed`)] }).catch(() => {})
    }

    // â”€â”€â”€ OWNER â”€â”€â”€
    if (cmd === "remove") {
      if (message.author.id !== ownerID) return
      await message.reply({ embeds: [ok("Leaving", `Leaving ${guild.name}...`)] }).catch(() => {})
      guild.leave()
      return
    }

    if (cmd === "approve") {
      if (message.author.id !== ownerID) return
      return message.reply({ embeds: [ok("Approved", `${guild.name} approved`)] }).catch(() => {})
    }

    if (cmd === "killbug") {
      if (message.author.id !== ownerID) return
      await message.reply({ embeds: [ok("Shutdown", "Goodbye...")] }).catch(() => {})
      process.exit(0)
    }

    if (cmd === "initialize") {
      return message.reply({ embeds: [inf("Request", "Sent to owner")] }).catch(() => {})
    }

    if (cmd === "reapplyautorole") {
      if (!await isAdmin(member, guild.id))
        return message.reply({ embeds: [err("No Permission", "Admin only")] }).catch(() => {})

      const roleId = await db.get(`autorole_${guild.id}`)
      if (!roleId)
        return message.reply({ embeds: [err("No Role", "Use `.autorole @role`")] }).catch(() => {})

      const processingMsg = await message.reply({ embeds: [inf("Processing", "Applying...")] })

      const members = await guild.members.fetch()
      let count = 0
      for (const m of members.values()) {
        if (!m.roles.cache.has(roleId)) {
          await m.roles.add(roleId).catch(() => {})
          count++
        }
      }

      return processingMsg.edit({ embeds: [ok("Applied", `${count} member${count !== 1 ? "s" : ""}`)] })
    }

    // â”€â”€â”€ HELP â”€â”€â”€
    if (cmd === "help") {
      const embed = buildHelpEmbed(0, message.author)
      const buttons = buildHelpButtons(0)

      const msg = await message.channel.send({ embeds: [embed], components: [buttons] })

      await db.set(`help_${msg.id}`, {
        userId: message.author.id,
        page: 0,
      })

      console.log(`âœ… Help created: ${msg.id}`)
      return
    }

    // â”€â”€â”€ MISC â”€â”€â”€
    if (cmd === "ping") {
      return message.reply(`ðŸ“ ${client.ws.ping}ms`)
    }

    if (cmd === "pbgontop") {
      return message.reply("https://discord.gg/knhits")
    }

  } catch (error) {
    console.error("Command error:", error)
    return message.reply({ embeds: [err("Error", "Something went wrong")] }).catch(() => {})
  }
})

// â”€â”€â”€ INTERACTIONS â”€â”€â”€
client.on("interactionCreate", async interaction => {
  try {

    // â”€â”€â”€ HELP BUTTONS â”€â”€â”€
    if (interaction.isButton() && ["help_first", "help_prev", "help_next", "help_last"].includes(interaction.customId)) {
      const session = await db.get(`help_${interaction.message.id}`)

      if (!session)
        return interaction.reply({ content: "Help expired. Run `.help`", ephemeral: true })

      if (interaction.user.id !== session.userId)
        return interaction.reply({ content: "Only creator can use", ephemeral: true })

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

    // â”€â”€â”€ MMINFO BUTTONS â”€â”€â”€
    if (interaction.customId === "mm_understand") {
      await interaction.channel.send(`${interaction.user} has understood âœ…`)
      await interaction.reply({ content: "âœ… Recorded!", ephemeral: true })
      return
    }

    if (interaction.customId === "mm_dontunderstand") {
      const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes from now
      const expiresTimestamp = Math.floor(expiresAt / 1000)

      const changeMindRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`mm_changemind_${interaction.user.id}`)
          .setLabel("âœ… I Changed My Mind â€” I Understand Now")
          .setStyle(ButtonStyle.Success)
      )

      await interaction.reply({
        content: `âŒ No worries. You have until <t:${expiresTimestamp}:T> (<t:${expiresTimestamp}:R>) to change your mind if you want.`,
        components: [changeMindRow],
        ephemeral: true
      })
      return
    }

    if (interaction.customId.startsWith("mm_changemind_")) {
      const originalUserId = interaction.customId.replace("mm_changemind_", "")
      if (interaction.user.id !== originalUserId)
        return interaction.reply({ content: "This button is not for you.", ephemeral: true })

      await interaction.channel.send(`${interaction.user} has understood âœ…`)
      await interaction.update({ content: "âœ… Great! Recorded that you now understand.", components: [] })
      return
    }

    // â”€â”€â”€ HITBYPBG BUTTONS â”€â”€â”€
    if (interaction.customId.startsWith("hitbypbg_yes_")) {
      const channelId = interaction.customId.replace("hitbypbg_yes_", "")
      const invoker = await db.get(`hitbypbg_invoker_${channelId}`)

      // Public message in channel
      await interaction.channel.send(
        `${interaction.user} **Ask Any of Our Staff Members for tips and tricks to become a Master** ðŸ¤`
      )

      // DM the person who ran .hitbypbg
      if (invoker) {
        try {
          const invokerUser = await client.users.fetch(invoker.userId)
          await invokerUser.send(
            `**${interaction.user.username}** (<@${interaction.user.id}>) has accepted and wants to join! Ask them for tips and tricks to become a Master. ðŸ¤\n\n*From channel: ${interaction.channel.name}*`
          )
        } catch (e) {
          // DM failed silently
        }
      }

      await interaction.reply({ content: "âœ… Welcome to the team!", ephemeral: true })
      return
    }

    if (interaction.customId.startsWith("hitbypbg_no_")) {
      const expiresAt = Date.now() + 5 * 60 * 1000
      const expiresTimestamp = Math.floor(expiresAt / 1000)
      const channelId = interaction.customId.replace("hitbypbg_no_", "")

      const changeMindRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`hitbypbg_changemind_${channelId}_${interaction.user.id}`)
          .setLabel("âœ… I Changed My Mind â€” Yes, I'll Join")
          .setStyle(ButtonStyle.Success)
      )

      await interaction.reply({
        content: `You chose No. You have until <t:${expiresTimestamp}:T> (<t:${expiresTimestamp}:R>) to change your mind.`,
        components: [changeMindRow],
        ephemeral: true
      })
      return
    }

    if (interaction.customId.startsWith("hitbypbg_changemind_")) {
      const parts = interaction.customId.split("_")
      const originalUserId = parts[parts.length - 1]
      const channelId = parts.slice(2, parts.length - 1).join("_")

      if (interaction.user.id !== originalUserId)
        return interaction.reply({ content: "This button is not for you.", ephemeral: true })

      const invoker = await db.get(`hitbypbg_invoker_${channelId}`)

      // Public message in channel
      await interaction.channel.send(
        `${interaction.user} **Ask Any of Our Staff Members for tips and tricks to become a Master** ðŸ¤`
      )

      // DM the person who ran .hitbypbg
      if (invoker) {
        try {
          const invokerUser = await client.users.fetch(invoker.userId)
          await invokerUser.send(
            `**${interaction.user.username}** (<@${interaction.user.id}>) changed their mind and wants to join! Ask them for tips and tricks to become a Master. ðŸ¤\n\n*From channel: ${interaction.channel.name}*`
          )
        } catch (e) {
          // DM failed silently
        }
      }

      await interaction.update({ content: "âœ… Welcome to the team! Glad you changed your mind.", components: [] })
      return
    }

    // â”€â”€â”€ SCMSG BUTTONS â”€â”€â”€
    if (interaction.customId.startsWith("scmsg_join_")) {
      const channelId = interaction.customId.replace("scmsg_join_", "")
      const invoker = await db.get(`scmsg_invoker_${channelId}`)

      await interaction.channel.send(`@${interaction.user.username} has accepted his faith, and wanted to join us. ðŸ¤`)

      if (invoker) {
        try {
          const invokerUser = await client.users.fetch(invoker.userId)
          await invokerUser.send(
            `**${interaction.user.username}** (<@${interaction.user.id}>) has accepted and wants to join! ðŸ¤\n\n*From channel: ${interaction.channel.name}*`
          )
        } catch (e) {
          // DM failed silently
        }
      }

      await interaction.reply({ content: "âœ… Welcome!", ephemeral: true })
      return
    }

    if (interaction.customId.startsWith("scmsg_leave_")) {
      await interaction.channel.send(`${interaction.user} has left. ðŸ˜‚`)
      await interaction.reply({ content: "Bye!", ephemeral: true })
      return
    }

    // â”€â”€â”€ MM REQUEST BUTTON â”€â”€â”€
    if (interaction.customId === "mm_request") {
      const modal = new ModalBuilder().setCustomId("mm_form").setTitle("Request MM")

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

    // â”€â”€â”€ MM FORM SUBMIT â”€â”€â”€
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
        .setTitle("ðŸŽ« Ticket")
        .setDescription("A MM will be here soon.")
        .addFields(
          { name: "Trade", value: trade, inline: false },
          { name: "Party", value: otherParty, inline: true },
          { name: "Creator", value: `${interaction.user}`, inline: true }
        )
        .setFooter({ text: "MM Service" })
        .setTimestamp()

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close_ticket").setLabel("ðŸ”’ Close").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("claim_ticket").setLabel("ðŸŸ¢ Claim").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("adduser_ticket").setLabel("âž• Add").setStyle(ButtonStyle.Secondary)
      )

      const roleMention = ticketRoleId ? `<@&${ticketRoleId}> ` : ""
      await ticket.send({ content: `${roleMention}${interaction.user}`, embeds: [ticketEmbed], components: [closeRow] })

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(C.GREEN).setTitle("âœ… Created").setDescription(`${ticket}`).setTimestamp()],
        ephemeral: true,
      })
    }

    // â”€â”€â”€ TICKET BUTTONS â”€â”€â”€
    if (interaction.customId === "close_ticket") {
      if (!interaction.channel.name.startsWith("ticket"))
        return interaction.reply({ embeds: [err("Not Ticket", "Use in ticket")], ephemeral: true })

      await interaction.reply({ embeds: [new EmbedBuilder().setColor(C.RED).setTitle("ðŸ”’ Closing").setDescription("5s...").setTimestamp()] })
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
      return
    }

    if (interaction.customId === "claim_ticket") {
      const member = interaction.member
      const ticketRoleId = await db.get(`ticketrole_${interaction.guild.id}`)
      const isStaff = member.id === ownerID || member.permissions.has(PermissionFlagsBits.Administrator) || (ticketRoleId && member.roles.cache.has(ticketRoleId))

      if (!isStaff)
        return interaction.reply({ content: "âŒ Staff only", ephemeral: true })

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close_ticket").setLabel("ðŸ”’ Close").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("claim_ticket").setLabel(`âœ… ${interaction.user.username}`).setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId("adduser_ticket").setLabel("âž• Add").setStyle(ButtonStyle.Secondary)
      )
      await interaction.message.edit({ components: [updatedRow] })

      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(C.GREEN).setTitle("âœ… Claimed").setDescription(`${interaction.user} claimed`).setTimestamp()]
      })
      return
    }

    if (interaction.customId === "adduser_ticket") {
      const member = interaction.member
      const ticketRoleId = await db.get(`ticketrole_${interaction.guild.id}`)
      const isStaff = member.id === ownerID || member.permissions.has(PermissionFlagsBits.Administrator) || (ticketRoleId && member.roles.cache.has(ticketRoleId))

      if (!isStaff)
        return interaction.reply({ content: "âŒ Staff only", ephemeral: true })

      const modal = new ModalBuilder().setCustomId("adduser_form").setTitle("Add User")
      const input = new TextInputBuilder()
        .setCustomId("user_id")
        .setLabel("User ID")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("ID here")
        .setRequired(true)
      modal.addComponents(new ActionRowBuilder().addComponents(input))
      return interaction.showModal(modal)
    }

    if (interaction.isModalSubmit() && interaction.customId === "adduser_form") {
      const userId = interaction.fields.getTextInputValue("user_id").replace(/[<@!>]/g, "").trim()
      const target = await interaction.guild.members.fetch(userId).catch(() => null)
      if (!target)
        return interaction.reply({ content: "âŒ Not found", ephemeral: true })

      await interaction.channel.permissionOverwrites.edit(target, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(C.GREEN).setTitle("âž• Added").setDescription(`${target} added`).setTimestamp()]
      })
    }

    // â”€â”€â”€ MM YES/NO (legacy mminfo buttons) â”€â”€â”€
    if (interaction.customId === "mm_yes") {
      await interaction.deferReply({ ephemeral: true })
      await interaction.channel.send(`${interaction.user} understood âœ…`)
      await interaction.editReply({ content: "Recorded" })
      return
    }

    if (interaction.customId === "mm_no") {
      await interaction.deferReply({ ephemeral: true })
      await interaction.channel.send(`${interaction.user} didn't understand âŒ, ask staff`)
      await interaction.editReply({ content: "Recorded" })
      return
    }

  } catch (error) {
    console.error("Interaction error:", error)
    try {
      if (interaction.isRepliable() && !interaction.replied)
        await interaction.reply({ content: "Error", ephemeral: true }).catch(() => {})
    } catch (e) {}
  }
})

client.on("error", err => console.error("Client error:", err))
process.on("unhandledRejection", err => console.error("Rejection:", err))

client.login(process.env.TOKEN)
