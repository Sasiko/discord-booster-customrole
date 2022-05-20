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
		],
		type: Constants.ApplicationCommandTypes.CHAT_INPUT,
	} as ApplicationCommandStructure,
};
