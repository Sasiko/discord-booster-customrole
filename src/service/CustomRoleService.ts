import { ComponentInteraction, Constants, Guild, Role } from "eris";
import {
	CustomClient,
	CustomCommandInteraction,
	CustomModalSubmitInteraction,
} from "../helpers/CustomClient";
import { Colors, getErrorReply, getSuccessReply } from "../util/common.util";
import { DatabaseService } from "./DatabaseService";
import { request } from "undici";

const prisma = DatabaseService.getClient();

export class CustomRoleService {
	public static async checkButtonClick(
		interaction: ComponentInteraction,
		client: CustomClient
	) {
		if (interaction.data.component_type !== Constants.ComponentTypes.BUTTON) {
			return;
		}

		if (interaction.data.custom_id === "btn-manage-custom-role") {
			return this.showManageRoleEmbed(interaction, client);
		}

		if (!interaction.data.custom_id.startsWith("btn-customrole-")) {
			return;
		}

		const isCreate = interaction.data.custom_id.endsWith("create");

		await interaction.createModal({
			title: `${isCreate ? "Create" : "Edit"} Custom Role`,
			custom_id: `modal-custom-role-${isCreate ? "create" : "edit"}`,
			components: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.TEXT_INPUT,
							custom_id: "role-name",
							label: "Name",
							required: true,
							style: Constants.TextInputStyles.SHORT,
							max_length: 20,
							min_length: 2,
							placeholder: "Awesome Role",
						},
					],
				},
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.TEXT_INPUT,
							custom_id: "role-color",
							label: "Color",
							min_length: 6,
							max_length: 7,
							required: true,
							style: Constants.TextInputStyles.SHORT,
							placeholder: "#FF00FF",
						},
					],
				},
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.TEXT_INPUT,
							custom_id: "icon-url",
							label: "Icon URL",
							required: false,
							style: Constants.TextInputStyles.SHORT,
							placeholder: "URL of an icon (.png, .jpeg or .jpeg)",
						},
					],
				},
			],
		});
	}

	public static async checkModalSubmission(
		interaction: CustomModalSubmitInteraction,
		client: CustomClient
	) {
		if (
			!interaction.data.custom_id.startsWith("modal-custom-role") ||
			!interaction.guildID ||
			!interaction.member
		) {
			return;
		}

		const guild = client.guilds.get(interaction.guildID);
		if (!guild) return;

		await interaction.defer(64);

		const roleName = interaction.options.getString("role-name", true);
		const iconUrl = interaction.options.getString("icon-url", false);

		let roleColorStr = interaction.options.getString("role-color", true);

		if (!/^#?(([0-9a-fA-F]{2}){3}|([0-9a-fA-F]){3})$/.test(roleColorStr)) {
			return interaction.editOriginalMessage(
				getErrorReply("Please provide a valid hex color code.")
			);
		}

		if (!roleColorStr.startsWith("#")) roleColorStr = "#" + roleColorStr;

		const roleColor = parseInt(roleColorStr.replace("#", "0x"));

		let icon: string | undefined;

		// if icon url is provided, convert it to base64
		if (iconUrl) {
			const allowedExts = ["png", "jpg", "jpeg"];
			const ext = iconUrl.split(".").pop() || "none";

			if (!allowedExts.includes(ext)) {
				return interaction.editOriginalMessage(
					getErrorReply(
						"Please provide a valid icon URL. Only .png, .jpg and .jpeg files are supported."
					)
				);
			}

			try {
				const res = await request(iconUrl);
				const data = Buffer.from(await res.body.arrayBuffer());
				icon =
					"data:" +
					res.headers["content-type"] +
					";base64," +
					data.toString("base64");
			} catch (e) {
				client.logger.error(e);
				return interaction.editOriginalMessage(
					getErrorReply("Something went wrong trying to read your icon.")
				);
			}
		}

		const existingRecord = await prisma.guildCustomRole.findFirst({
			where: { guildID: guild.id, memberID: interaction.member.id },
		});

		if (existingRecord) {
			await guild.editRole(existingRecord.roleID, {
				name: roleName,
				color: roleColor,
				icon,
			});

			await interaction.editOriginalMessage(
				getSuccessReply("Your custom role has been updated.")
			);
			return;
		}

		const boosterRoleID = (
			await prisma.guildBoosterRole.findFirst({ where: { guildID: guild.id } })
		)?.roleID;
		if (!boosterRoleID) return;

		const boosterRole = guild.roles.get(boosterRoleID);
		if (!boosterRole) return;

		const role = await client.createRole(guild.id, {
			name: roleName,
			color: roleColor,
			permissions: 0,
			icon,
		});

		try {
			await role.editPosition(boosterRole.position + 1);

			await interaction.member.addRole(role.id);

			await prisma.guildCustomRole.create({
				data: {
					guildID: guild.id,
					memberID: interaction.member.id,
					roleID: role.id,
					assignedDate: new Date(),
				},
			});
		} catch (e) {
			client.logger.error(e);
			await role.delete();
		}

		await interaction.editOriginalMessage(
			getSuccessReply("Your custom role has been created.")
		);
	}

	public static async handleRoleDelete(guild: Guild, role: Role) {
		await prisma.guildCustomRole.deleteMany({
			where: {
				guildID: guild.id,
				roleID: role.id,
			},
		});
	}

	public static async showManageRoleEmbed(
		interaction: CustomCommandInteraction | ComponentInteraction,
		client: CustomClient
	) {
		if (
			interaction instanceof ComponentInteraction &&
			interaction.data.custom_id !== "btn-manage-custom-role"
		) {
			return;
		}

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
}
