import { Channel, ComponentInteraction } from "eris";
import EventEmitter from "events";

type InteractionFilter = (interaction: ComponentInteraction) => boolean;

type InteractionCollectorOptions = {
	timeout?: number;
	count?: number;
	filter?: InteractionFilter;
};

const InteractionCollectorDefaultOptions: InteractionCollectorOptions = {
	timeout: 10000,
	count: undefined,
	filter: (interaction) => true,
};

export class InteractionCollector extends EventEmitter {
	private channel: Channel;
	private timeout: number;
	private count: number | undefined;
	private filter: InteractionFilter;
	private running = false;

	public collected: ComponentInteraction[] = [];

	constructor(channel: Channel, options: InteractionCollectorOptions) {
		super();

		const opt: any = Object.assign(InteractionCollectorDefaultOptions, options);

		this.channel = channel;
		this.timeout = opt.timeout;
		this.count = opt.count;
		this.filter = opt.filter;
	}

	public start = (): Promise<this> => {
		this.running = true;
		return new Promise((resolve) => {
			this.channel.client.setMaxListeners(this.getMaxListeners() + 1);
			this.channel.client.on("interactionCreate", this.onInteractionCreate);

			this.setMaxListeners(this.getMaxListeners() + 1);
			this.on("collect", this.onCollect);

			if (this.timeout) setTimeout(() => this.stop(), this.timeout);

			this.once("stop", () => resolve(this));
		});
	};

	public stop = () => {
		this.running = false;
		this.channel.client.setMaxListeners(this.getMaxListeners() - 1);
		this.channel.client.off("interactionCreate", this.onInteractionCreate);

		this.setMaxListeners(this.getMaxListeners() - 1);
		this.off("collect", this.onCollect);

		this.emit("stop");
		return this;
	};

	private onInteractionCreate = (interaction: ComponentInteraction) => {
		if (!this.running) return;
		if (this.channel.id !== interaction.channel.id) return;
		if (!this.filter(interaction)) return;
		this.emit("collect", interaction);
	};

	private onCollect = (interaction: ComponentInteraction) => {
		this.collected.push(interaction);
		if (this.count && this.collected.length === this.count) this.stop();
	};
}
