import { CustomClient } from "./helpers/CustomClient";
import { getBotConfig } from "./util/config.util";

const config = getBotConfig();

async function initializeBot() {
	const client = new CustomClient(`Bot ${config["TOKEN"]}`, {
		intents: ["guilds", "guildMembers"],
	});

	await client.connect();
}

initializeBot();
