-- CreateTable
CREATE TABLE "GuildCustomRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildID" TEXT NOT NULL,
    "memberID" TEXT NOT NULL,
    "roleID" TEXT NOT NULL,
    "assignedDate" DATETIME,
    "createdDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GuildBoosterRole" (
    "guildID" TEXT NOT NULL PRIMARY KEY,
    "roleID" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GuildCustomRoleMaxIdleDuration" (
    "guildID" TEXT NOT NULL PRIMARY KEY,
    "duration" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildCustomRole_guildID_memberID_key" ON "GuildCustomRole"("guildID", "memberID");
