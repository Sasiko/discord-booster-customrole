import { Guild, Member, User } from "eris";
import { DatabaseService } from "./DatabaseService";

const prisma = DatabaseService.getClient();

export class MemberService {
	public static async handleUpdate(
		guild: Guild,
		member: Member,
		oldMember: Member | Object
	) {
		if (member.bot) return;

		// if roles haven't changed, ignore
		if (oldMember instanceof Member) {
			let sameRoles = oldMember.roles.length === member.roles.length;

			for (const roleID of oldMember.roles) {
				if (!member.roles.includes(roleID)) {
					sameRoles = false;
					break;
				}
			}

			if (sameRoles) return;
		}

		await this.checkMemberRoles(guild, member);
	}

	public static async checkMemberRoles(guild: Guild, member: Member) {
		// check if member has custom role and lost booster role
		const [guildBoosterRoleID, memberCustomRoleID] = await Promise.all([
			(
				await prisma.guildBoosterRole.findFirst({
					where: {
						guildID: guild.id,
					},
				})
			)?.roleID,
			(
				await prisma.guildCustomRole.findFirst({
					where: {
						guildID: guild.id,
						memberID: member.id,
					},
				})
			)?.roleID,
		]);

		// no records in db
		if (!guildBoosterRoleID || !memberCustomRoleID) return;

		// member has booster role
		if (member.roles.includes(guildBoosterRoleID)) return;

		// delete custom role
		await guild.deleteRole(memberCustomRoleID).catch((_) => {});

		// delete record
		await prisma.guildCustomRole
			.delete({
				where: {
					guildID_memberID: {
						guildID: guild.id,
						memberID: member.id,
					},
				},
			})
			.catch((_) => {});
	}

	public static async handleMemberRemove(
		guild: Guild,
		member: Member | Object
	) {
		if ("user" in member === false) return;

		const user = (member as any).user as User;

		const customRoleRecord = await prisma.guildCustomRole.findFirst({
			where: {
				guildID: guild.id,
				memberID: user.id,
			},
		});

		if (!customRoleRecord) return;

		await guild.deleteRole(customRoleRecord.roleID).catch((_) => {});
	}
}