import { Guild, Member } from "eris";
import { CustomClient } from "../helpers/CustomClient";
import { MemberService } from "../service/MemberService";

async function execute(
	guild: Guild,
	member: Member | Object,
	client: CustomClient
) {
	try {
		MemberService.handleMemberRemove(guild, member);
	} catch (e) {
		client.logger.error(e);
	}
}

export = {
	name: "guildMemberRemove",
	once: false,
	execute,
};
