import {
	Client,
	Collection,
	Constants,
	InteractionDataOptions,
	Member,
	Message,
	PartialChannel,
	Role,
	User,
} from "eris";

type Resolved = {
	users?: Collection<User>;
	members?: Collection<Omit<Member, "user" | "deaf" | "mute">>;
	roles?: Collection<Role>;
	channels?: Collection<PartialChannel>;
	messages?: Collection<Message>;
};

export class CommandInteractionOptionResolver {
	public readonly client: Client;
	public readonly data: InteractionDataOptions[];
	public readonly resolved: Resolved;

	private _group: string | null = null;
	private _subcommand: string | null = null;
	private _hoistedOptions: InteractionDataOptions[];
	private _resolved: Resolved;

	constructor(
		client: Client,
		options: InteractionDataOptions[] = [],
		resolved: Resolved = {}
	) {
		this.client = client;
		this._hoistedOptions = options;
		this._resolved = Object.freeze(resolved);
		this.data = options;
		this.resolved = Object.freeze(resolved);

		if (
			this._hoistedOptions[0]?.type ===
			Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP
		) {
			this._group = this._hoistedOptions[0].name;
			this._hoistedOptions = this._hoistedOptions[0].options ?? [];
		}

		if (
			this._hoistedOptions[0]?.type ===
			Constants.ApplicationCommandOptionTypes.SUB_COMMAND
		) {
			this._subcommand = this._hoistedOptions[0].name;
			this._hoistedOptions = this._hoistedOptions[0].options ?? [];
		}
	}

	public get(name: string, required: boolean = false) {
		//@ts-ignore
		const option = this._hoistedOptions.find((opt) => {
			return opt.name === name;
		});

		if (!option) {
			if (required) {
				throw new TypeError("COMMAND_INTERACTION_OPTION_NOT_FOUND");
			}
			return null;
		}
		return option;
	}

	public getSubCommand(required = false) {
		if (required && !this._subcommand) {
			throw new TypeError("COMMAND_INTERACTION_OPTION_NO_SUB_COMMAND");
		}
		return this._subcommand;
	}

	public getSubcommandGroup(required = false) {
		if (required && !this._group) {
			throw new TypeError("COMMAND_INTERACTION_OPTION_NO_SUB_COMMAND_GROUP");
		}
		return this._group;
	}

	public getBoolean(name: string, required?: false): boolean | null;
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string, required?: boolean) {
		const option: any = this._getTypedOption(
			name,
			Constants.ApplicationCommandOptionTypes.BOOLEAN,
			["value"],
			required || false
		);

		if (required && !option) throw "";

		return option?.value;
	}

	public getString(name: string, required?: false): string | null;
	public getString(name: string, required: true): string;
	public getString(name: string, required?: boolean) {
		const option: any = this._getTypedOption(
			name,
			Constants.ApplicationCommandOptionTypes.STRING,
			["value"],
			required || false
		);

		return option?.value;
	}

	public getInteger(name: string, required?: false): number | null;
	public getInteger(name: string, required: true): number;
	public getInteger(name: string, required?: boolean) {
		const option: any = this._getTypedOption(
			name,
			Constants.ApplicationCommandOptionTypes.INTEGER,
			["value"],
			required || false
		);

		return option?.value && parseInt(option.value);
	}

	public getNumber(name: string, required?: false): number | null;
	public getNumber(name: string, required: true): number;
	public getNumber(name: string, required?: boolean) {
		const option: any = this._getTypedOption(
			name,
			Constants.ApplicationCommandOptionTypes.NUMBER,
			["value"],
			required || false
		);

		return option?.value && parseFloat(option.value);
	}

	public getChannel(name: string, required?: false): PartialChannel | null;
	public getChannel(name: string, required: true): PartialChannel;
	public getChannel(name: string, required?: boolean) {
		const option: any = this._getTypedOption(
			name,
			Constants.ApplicationCommandOptionTypes.CHANNEL,
			["value"],
			required || false
		);

		return option?.value;
	}

	public getUser(name: string, required?: false): User | null;
	public getUser(name: string, required: true): User;
	public getUser(name: string, required?: boolean) {
		const option: any = this._getTypedOption(
			name,
			Constants.ApplicationCommandOptionTypes.USER,
			["value"],
			required || false
		);

		return option?.value;
	}

	public getMember(name: string, required?: false): Member | null;
	public getMember(name: string, required: true): Member;
	public getMember(name: string, required?: boolean) {
		const option: any = this._getTypedOption(
			name,
			Constants.ApplicationCommandOptionTypes.USER,
			["value"],
			required || false
		);
		return option?.value && this._resolved.members?.get(option.value.id);
	}

	public getRole(name: string, required?: false): Role | null;
	public getRole(name: string, required: true): Role;
	public getRole(name: string, required?: boolean) {
		try {
			const option: any = this._getTypedOption(
				name,
				Constants.ApplicationCommandOptionTypes.ROLE,
				["value"],
				required || false
			);

			return option?.value;
		} catch (e) {
			console.log(e);
		}
	}

	private _getTypedOption(
		name: string,
		type: Constants["ApplicationCommandOptionTypes"][keyof Constants["ApplicationCommandOptionTypes"]],
		properties: any,
		required: boolean
	) {
		const option = this.get(name, required);

		if (!option) {
			return null;
		} else if (option.type !== type) {
			throw new TypeError("COMMAND_INTERACTION_OPTION_TYPE");
		} else if (
			required &&
			properties.every(
				//@ts-ignore
				(prop) => option[prop] === null || typeof option[prop] === "undefined"
			)
		) {
			throw new TypeError("COMMAND_INTERACTION_OPTION_EMPTY");
		}

		switch (option.type) {
			case Constants.ApplicationCommandOptionTypes.ROLE:
				//@ts-ignore
				option.value = this._resolved.roles.get(option.value);
				break;
			case Constants.ApplicationCommandOptionTypes.CHANNEL:
				//@ts-ignore
				option.value = this._resolved.channels.get(option.value);
				break;
			case Constants.ApplicationCommandOptionTypes.USER:
				//@ts-ignore
				option.value = this._resolved.users.get(option.value);
				break;
		}

		return option;
	}
}
