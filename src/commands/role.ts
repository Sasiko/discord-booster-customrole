import { ApplicationCommandStructure, Constants } from "eris";
import {
	CustomClient,
	CustomCommandInteraction,
} from "../helpers/CustomClient";
import { CustomRoleService } from "../service/CustomRoleService";

async function execute(
	interaction: CustomCommandInteraction,
	client: CustomClient
) {
	await CustomRoleService.showManageRoleEmbed(interaction, client);
}

export = {
	execute,
	options: {
		name: "role",
		description: "Create or edit a custom role for yourself",
		type: Constants.ApplicationCommandTypes.CHAT_INPUT,
	} as ApplicationCommandStructure,
};
