import { Guild, Member, Message } from "eris";
import { CustomClient } from "../helpers/CustomClient";
import { MemberService } from "../service/MemberService";

async function execute(
	guild: Guild,
	member: Member,
	oldMember: Member | Object,
	client: CustomClient
) {
	try {
		await MemberService.handleUpdate(guild, member, oldMember);
	} catch (e) {
		client.logger.error(e);
	}
}

export = {
	name: "guildMemberUpdate",
	once: false,
	execute,
};
