import { Dirent, readFileSync } from "fs";
import YAML from "yaml";
import { resolve } from "path";
import { readdir } from "fs/promises";

export function parseYAML(filePath: string) {
	return YAML.parse(readFileSync(filePath, "utf8"));
}

/**
 * get all files in a directory recursively
 */
export async function getDirFiles(
	dirPath: string,
	exts: string[]
): Promise<Array<string>> {
	const dirents = await readdir(dirPath, { withFileTypes: true });
	const files = await Promise.all(
		dirents.map((dirent: Dirent) => {
			const res = resolve(dirPath, dirent.name);
			return dirent.isDirectory() ? getDirFiles(res, exts) : res;
		})
	);
	return Array.prototype.concat(...files).filter((f: string) => {
		const ext = `.${f.split(".").pop() || ""}`;
		return exts.includes(ext);
	});
}

export const Colors = {
	DEFAULT: 0x000000,
	WHITE: 0xffffff,
	AQUA: 0x1abc9c,
	GREEN: 0x57f287,
	BLUE: 0x3498db,
	YELLOW: 0xfee75c,
	PURPLE: 0x9b59b6,
	LUMINOUS_VIVID_PINK: 0xe91e63,
	FUCHSIA: 0xeb459e,
	GOLD: 0xf1c40f,
	ORANGE: 0xe67e22,
	RED: 0xed4245,
	GREY: 0x95a5a6,
	NAVY: 0x34495e,
	DARK_AQUA: 0x11806a,
	DARK_GREEN: 0x1f8b4c,
	DARK_BLUE: 0x206694,
	DARK_PURPLE: 0x71368a,
	DARK_VIVID_PINK: 0xad1457,
	DARK_GOLD: 0xc27c0e,
	DARK_ORANGE: 0xa84300,
	DARK_RED: 0x992d22,
	DARK_GREY: 0x979c9f,
	DARKER_GREY: 0x7f8c8d,
	LIGHT_GREY: 0xbcc0c0,
	DARK_NAVY: 0x2c3e50,
	BLURPLE: 0x5865f2,
	GREYPLE: 0x99aab5,
	DARK_BUT_NOT_BLACK: 0x2c2f33,
	NOT_QUITE_BLACK: 0x23272a,
};

export function getDefaultReply(text: string) {
	return {
		embeds: [
			{
				description: text,
				color: Colors.BLURPLE,
			},
		],
	};
}

export function getErrorReply(text: string) {
	return {
		embeds: [
			{
				description: text,
				color: Colors.RED,
			},
		],
	};
}

export function getSuccessReply(text: string) {
	return {
		embeds: [
			{
				description: text,
				color: Colors.GREEN,
			},
		],
	};
}

export function getMilliseconds(duration: number, unit: string) {
	switch (unit) {
		case "s":
			return duration * 1000;
		case "m":
			return duration * 60000;
		case "h":
			return duration * 3.6e6;
		case "d":
			return duration * 8.64e7;
		case "w":
			return duration * 6.048e8;
	}
	return 0;
}
