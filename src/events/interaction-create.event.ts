import {
	ComponentInteraction,
	Interaction,
	ModalSubmitInteraction,
} from "eris";
import { CustomClient } from "../helpers/CustomClient";
import { CustomRoleService } from "../service/CustomRoleService";

async function execute(interaction: Interaction, client: CustomClient) {
	try {
		if (interaction instanceof ComponentInteraction) {
			await CustomRoleService.checkButtonClick(interaction);
		}

		if (interaction instanceof ModalSubmitInteraction) {
			await CustomRoleService.checkModalSubmission(interaction as any, client);
		}
	} catch (e) {
		client.logger.error(e);
	}
}

export = {
	name: "interactionCreate",
	once: false,
	execute,
};
