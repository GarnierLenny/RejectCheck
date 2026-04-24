"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = require("dotenv");
const challenge_generation_prompt_1 = require("../src/challenge/challenge-generation-prompt");
(0, dotenv_1.config)();
const prisma = new client_1.PrismaClient();
async function main() {
    const rows = await prisma.dailyChallenge.findMany({
        select: { id: true, date: true, title: true, snippet: true, issues: true },
        orderBy: { date: 'asc' },
    });
    const bad = [];
    for (const row of rows) {
        try {
            (0, challenge_generation_prompt_1.validateGeneratedSnippet)(row.snippet, row.issues);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.log(`[${row.date.toISOString().slice(0, 10)}] #${row.id} "${row.title}" — ${message}`);
            bad.push(row);
        }
    }
    if (bad.length === 0) {
        console.log('All challenges pass the validator. Nothing to clean.');
        return;
    }
    const { count } = await prisma.dailyChallenge.deleteMany({
        where: { id: { in: bad.map((r) => r.id) } },
    });
    console.log(`\nDeleted ${count} bad challenge(s). Run \`npm run seed:challenges\` to backfill.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=clean-bad-challenges.js.map