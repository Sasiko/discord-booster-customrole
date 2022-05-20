import {
	ApplicationCommandStructure,
	Client,
	ClientOptions,
	CommandInteraction,
	Interaction,
	ModalSubmitInteraction,
} from "eris";
import { resolve } from "path";
import { getDirFiles } from "../util/common.util";
import { existsSync } from "fs";
import { getBotConfig } from "../util/config.util";
import { CommandInteractionOptionResolver } from "./CommandInteractionOptionResolver";
import { LogService } from "../service/LogService";
import { ModalSubmitInteractionOptionResolver } from "./ModalSubmitInteractionOptionResolver";
const config = getBotConfig();

export interface CustomCommandInteraction extends CommandInteraction {
	options: CommandInteractionOptionResolver;
}

export interface CustomModalSubmitInteraction extends ModalSubmitInteraction {
	options: ModalSubmitInteractionOptionResolver;
}

export type CustomApplicationCommand = {
	execute: (interaction: CommandInteraction, client: Client) => Promise<any>;
	options: ApplicationCommandStructure;
};

export class CustomClient extends Client {
	public readonly logger = LogService.getLogger();

	private commands: Map<string, CustomApplicationCommand>;

	constructor(token: string, options: ClientOptions) {
		super(token, options);
		this.commands = new Map();
		this.registerEventListeners().catch((e) => {
			this.logger.error(e);
		});
	}

	private registerEventListeners = async () => {
		const eventListeners: any = {
			once: {
				ready: [{ execute: this.handleOnReady }],
			},
			on: {
				interactionCreate: [{ execute: this.handleInteractionCreate }],
				error: [{ execute: this.handleOnError }],
			},
		};

		const eventsDirPath = resolve(`${__dirname}/../events`);

		let eventFiles: string[] = [];

		if (existsSync(eventsDirPath)) {
			eventFiles = await getDirFiles(eventsDirPath, [".js", ".ts"]);
		}

		for (const f of eventFiles) {
			const event = await import(f).catch((e) => {
				this.logger.error(e);
			});
			if (!event) continue;

			const eventType = event.once ? "once" : "on";

			if (eventListeners[eventType][event.name]) {
				eventListeners[eventType][event.name].push(event);
			} else {
				eventListeners[eventType][event.name] = [event];
			}
		}

		for (const eventType of Object.keys(eventListeners)) {
			for (const eventName of Object.keys(eventListeners[eventType])) {
				//@ts-ignore
				this[eventType](eventName, (...args) => {
					for (const event of eventListeners[eventType][eventName]) {
						if (!event.execute) {
							this.logger.error(
								`failed to find execute() for [${eventType}][${eventName}]->${event}.event`
							);
						}

						event?.execute(...args, this)?.catch((e: any) => {
							this.logger.error(e);
						});
					}
				});
			}
		}
	};

	private loadCommands = async () => {
		const commandsDirPath = resolve(`${__dirname}/../commands`);

		let commandFiles: string[] = [];

		if (existsSync(commandsDirPath)) {
			commandFiles = await getDirFiles(commandsDirPath, [".js", ".ts"]);
		}

		const commands: ApplicationCommandStructure[] = [];

		for (const f of commandFiles) {
			const command = await import(f).catch((e) => {
				this.logger.error(e);
			});

			if (!command) continue;

			commands.push(command.options);
			this.commands.set(command.options.name, command);
		}

		if (config.PRODUCTION) {
			await this.bulkEditCommands(commands);
		} else {
			await this.bulkEditGuildCommands(config["TEST GUILD ID"], commands);
		}

		this.logger.info(
			`custom-client: loaded ${this.commands.size} application commands`
		);
	};

	private handleOnReady = async () => {
		this.editStatus(config["STATUS"], {
			name: config["ACTIVITY NAME"],
			type: config["ACTIVITY TYPE"],
		});

		await this.loadCommands();

		let devServerName = "";

		if (!config.PRODUCTION) {
			devServerName =
				this.guilds.get(config["TEST GUILD ID"])?.name || "unknown";
		}

		this.logger.info(
			`bot: ready [${this.user.username}#${this.user.discriminator}] [${
				config.PRODUCTION ? "PRODUCTION" : `DEVELOPMENT (${devServerName})`
			}]`
		);
	};

	private handleInteractionCreate = async (interaction: Interaction) => {
		try {
			if (interaction instanceof ModalSubmitInteraction) {
				(interaction as CustomModalSubmitInteraction).options =
					new ModalSubmitInteractionOptionResolver(interaction.data);
			}

			if (interaction instanceof CommandInteraction) {
				(interaction as CustomCommandInteraction).options =
					new CommandInteractionOptionResolver(
						this,
						interaction.data.options,
						interaction.data.resolved
					);

				const command = this.commands.get(interaction.data.name);
				if (!command) return;

				await command.execute(interaction, this);
			}
		} catch (e) {
			this.logger.error(e);
		}
	};

	private handleOnError = async (e: any) => {
		this.logger.error(e);
	};
}
