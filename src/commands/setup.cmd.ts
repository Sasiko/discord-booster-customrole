import { ApplicationCommandStructure, Constants, Guild } from "eris";
import {
	CustomClient,
	CustomCommandInteraction,
} from "../helpers/CustomClient";
import { DatabaseService } from "../service/DatabaseService";
import {
	getErrorReply,
	getMilliseconds,
	getSuccessReply,
} from "../util/common.util";

const prisma = DatabaseService.getClient();

async function execute(
	interaction: CustomCommandInteraction,
	client: CustomClient
) {
	await interaction.defer(64);

	if (!interaction.guildID || !interaction.member) {
		return interaction.editOriginalMessage(
			getErrorReply("This command can only be used inside servers.")
		);
	}

	const guild = client.guilds.get(interaction.guildID);

	if (!guild) {
		return interaction.editOriginalMessage(
			getErrorReply("Failed to find the server.")
		);
	}

	const hasPermission = interaction.member.permissions.has("administrator");

	if (!hasPermission) {
		return interaction.editOriginalMessage(
			getErrorReply("You don't have permission to run this command!")
		);
	}

	const subcommand = interaction.options.getSubCommand();

	switch (subcommand) {
		case "set-booster-role":
			await setBoosterRole(interaction, guild, client);
			break;

		case "create-embed":
			await createEmbed(interaction, guild, client);
			break;
	}
}

async function setBoosterRole(
	interaction: CustomCommandInteraction,
	guild: Guild,
	_client: CustomClient
) {
	const role = interaction.options.getRole("role", true);

	await prisma.guildBoosterRole.upsert({
		where: { guildID: guild.id },
		update: { roleID: role.id },
		create: { guildID: guild.id, roleID: role.id },
	});

	await interaction.editOriginalMessage(
		getSuccessReply(
			`<@&${role.id}> has been set as the booster role in this server.`
		)
	);
}

async function createEmbed(
	interaction: CustomCommandInteraction,
	guild: Guild,
	client: CustomClient
) {
	const partialChannel = interaction.options.getChannel("channel", true);

	const channel = guild.channels.get(partialChannel.id);
	if (!channel) return;

	const clientMember = guild.members.get(client.user.id);
	if (!clientMember) return;

	const permissions = channel.permissionsOf(clientMember);

	if (!permissions.has("viewChannel") || !permissions.has("sendMessages")) {
		return interaction.editOriginalMessage(
			getErrorReply(
				"Bot doesn't have permission to send messages in that channel. Please select a different one."
			)
		);
	}

	await client.createMessage(channel.id, {
		embed: {
			color: 0x00ff00,
			title: "Create/Edit Your Custom Role",
			description:
				'Please click on "Create/Edit Role" button below to start the process creating/editing your personal role. Do note that the button has dual functions which is creating new role and edit your existing role. Note that bot will ONLY create 1 role.',
		},
		components: [
			{
				type: Constants.ComponentTypes.ACTION_ROW,
				components: [
					{
						type: Constants.ComponentTypes.BUTTON,
						custom_id: "btn-manage-custom-role",
						style: Constants.ButtonStyles.SUCCESS,
						label: "Create/Edit Role",
					},
				],
			},
		],
	});

	await interaction.editOriginalMessage(
		getSuccessReply("Embed has been created.")
	);
}

export = {
	execute,
	options: {
		name: "setup",
		description: "Configure bot for this server",
		options: [
			{
				name: "set-booster-role",
				description: "Booster role of this server",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				options: [
					{
						name: "role",
						description: "Role in the server",
						type: Constants.ApplicationCommandOptionTypes.ROLE,
						required: true,
					},
				],
			},
			{
				name: "create-embed",
				description: "Create an embed to start booster role configuration",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				options: [
					{
						name: "channel",
						description: "Channel in the server",
						type: Constants.ApplicationCommandOptionTypes.CHANNEL,
						channel_types: [Constants.ChannelTypes.GUILD_TEXT],
						required: true,
					},
				],
			},
		],
		type: Constants.ApplicationCommandTypes.CHAT_INPUT,
	} as ApplicationCommandStructure,
};
