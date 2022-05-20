import { ApplicationCommandStructure, Constants, Guild } from "eris";
import {
	CustomClient,
	CustomCommandInteraction,
} from "../helpers/CustomClient";
import { DatabaseService } from "../service/DatabaseService";
import { Colors, getErrorReply } from "../util/common.util";

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

	const boosterRole = await prisma.guildBoosterRole.findFirst({
		where: { guildID: guild.id },
	});

	if (!boosterRole) {
		return interaction.editOriginalMessage(
			getErrorReply(
				"This server doesn't have a booster role set. Please inform the server staff."
			)
		);
	}

	if (!interaction.member.roles.includes(boosterRole.roleID)) {
		return interaction.editOriginalMessage(
			getErrorReply(
				`Sorry. Only members with <@&${boosterRole.roleID}> can manage custom roles.`
			)
		);
	}

	const memberCustomRole = await prisma.guildCustomRole.findFirst({
		where: {
			guildID: guild.id,
			memberID: interaction.member.id,
		},
	});

	await interaction.editOriginalMessage({
		embeds: [
			{
				color: Colors.BLURPLE,
				title: "Manage Custom Role",
				description: memberCustomRole
					? `Your current custom role is: <@&${memberCustomRole.roleID}>`
					: "You don't have a custom role configured.",
			},
		],
		components: [
			{
				type: Constants.ComponentTypes.ACTION_ROW,
				components: [
					{
						type: Constants.ComponentTypes.BUTTON,
						custom_id: `btn-customrole-${interaction.member.id}-${
							memberCustomRole ? "edit" : "create"
						}`,
						style: Constants.ButtonStyles.PRIMARY,
						label: memberCustomRole ? "Edit" : "Create",
					},
				],
			},
		],
	});
}

export = {
	execute,
	options: {
		name: "role",
		description: "Create or edit a custom role for yourself",
		type: Constants.ApplicationCommandTypes.CHAT_INPUT,
	} as ApplicationCommandStructure,
};
