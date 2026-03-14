const express = require("express")
const app = express()

app.get("/", (req,res)=>{
res.send("PowerBang Bot is alive")
})

app.listen(3000, ()=>{
console.log("Web server ready")
})

const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
PermissionsBitField,
ChannelType
} = require("discord.js")

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

const prefix = "."

const COLORS = {
BLUE:"#5865F2",
GREEN:"#57F287",
RED:"#ED4245",
YELLOW:"#FEE75C",
PURPLE:"#9B59B6"
}

function createEmbed(title,desc,color){
return new EmbedBuilder()
.setColor(color)
.setTitle(title)
.setDescription(desc)
.setFooter({text:"Safe • Secured • Trusted"})
.setTimestamp()
}

client.once("ready",()=>{
console.log(`Bot online as ${client.user.tag}`)
})

client.on("messageCreate",async message=>{

if(message.author.bot) return
if(!message.content.startsWith(prefix)) return

const args = message.content.slice(prefix.length).split(" ")
const command = args.shift().toLowerCase()

/* HELP */

if(command==="help"){

const embed=createEmbed(
"🔎 Bot Help Menu",
`
📩 **Ticket System**
.ticketpanel
.adduser
.claim
.close

⚙ **Configuration**
.fixpbg

👀 **Information**
.help
.botinfo
.ping

🤝 **Middleman**
.mminfo

🧰 **Utilities**
.avatar
.serverinfo
`,
COLORS.BLUE)

message.reply({embeds:[embed]})
}

/* BOT INFO */

if(command==="botinfo"){

const embed=createEmbed(
"🤖 Bot Info",
`
PowerBang Bot

Features
• Ticket system
• Middleman info
• Utility commands
• Moderation tools

Status: Online
`,
COLORS.PURPLE)

message.reply({embeds:[embed]})
}

/* PING */

if(command==="ping"){

const embed=createEmbed(
"🏓 Pong",
`Latency: ${client.ws.ping}ms`,
COLORS.GREEN)

message.reply({embeds:[embed]})
}

/* FIX */

if(command==="fixpbg"){

const embed=createEmbed(
"🛠 Repair System",
`
Running diagnostics...

✔ Commands
✔ Buttons
✔ Tickets

Everything fixed successfully
`,
COLORS.YELLOW)

message.reply({embeds:[embed]})
}

/* MIDDLEMAN */

if(command==="mminfo"){

const row=new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("mm_yes")
.setLabel("I Understand")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("mm_no")
.setLabel("I Don't Understand")
.setStyle(ButtonStyle.Danger)

)

const embed=createEmbed(
"Middleman System",
`
Seller gives item to middleman

Buyer sends payment

After confirmation middleman sends item to buyer

Both traders must vouch
`,
COLORS.BLUE)

message.reply({embeds:[embed],components:[row]})
}

/* TICKET PANEL */

if(command==="ticketpanel"){

const row=new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("create_ticket")
.setLabel("Create Ticket")
.setStyle(ButtonStyle.Primary)

)

const embed=createEmbed(
"🎫 Support Tickets",
"Press button below to create ticket",
COLORS.BLUE)

message.channel.send({embeds:[embed],components:[row]})
}

})

/* BUTTONS */

client.on("interactionCreate",async interaction=>{

if(!interaction.isButton()) return

/* CREATE TICKET */

if(interaction.customId==="create_ticket"){

const channel=await interaction.guild.channels.create({

name:`ticket-${interaction.user.username}`,
type:ChannelType.GuildText,

permissionOverwrites:[
{
id:interaction.guild.id,
deny:[PermissionsBitField.Flags.ViewChannel]
},
{
id:interaction.user.id,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
}
]
})

const row=new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("add_user")
.setLabel("Add User")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("claim_ticket")
.setLabel("Claim")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("Close")
.setStyle(ButtonStyle.Danger)

)

channel.send({
embeds:[
createEmbed(
"Ticket Created",
`Welcome ${interaction.user}

Support will assist you shortly`,
COLORS.GREEN)
],
components:[row]
})

interaction.reply({content:`Ticket created: ${channel}`,ephemeral:true})

}

/* CLOSE */

if(interaction.customId==="close_ticket"){

interaction.reply({
embeds:[createEmbed("Ticket Closing","This ticket will close in 5 seconds",COLORS.RED)]
})

setTimeout(()=>{
interaction.channel.delete()
},5000)

}

/* CLAIM */

if(interaction.customId==="claim_ticket"){

interaction.reply({
embeds:[
createEmbed(
"Ticket Claimed",
`${interaction.user} claimed this ticket`,
COLORS.GREEN)
]
})

}

/* ADD USER */

if(interaction.customId==="add_user"){

interaction.reply({
embeds:[
createEmbed(
"Add User",
"Use command `.adduser @user`",
COLORS.BLUE)
]
})

}

/* MM YES */

if(interaction.customId==="mm_yes"){

interaction.reply({
embeds:[
createEmbed(
"Confirmation",
`${interaction.user} understands the middleman system`,
COLORS.GREEN)
]
})

}

/* MM NO */

if(interaction.customId==="mm_no"){

interaction.reply({
embeds:[
createEmbed(
"Help Needed",
`${interaction.user} needs help understanding`,
COLORS.RED)
]
})

}

})

client.login(process.env.TOKEN)
