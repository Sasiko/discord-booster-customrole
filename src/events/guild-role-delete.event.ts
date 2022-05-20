import { Guild, Role } from "eris";
import { CustomClient } from "../helpers/CustomClient";
import { CustomRoleService } from "../service/CustomRoleService";

async function execute(guild: Guild, role: Role, client: CustomClient) {
	try {
		await CustomRoleService.handleRoleDelete(guild, role);
	} catch (e) {
		client.logger.error(e);
	}
}

export = {
	name: "guildRoleDelete",
	once: false,
	execute,
};
