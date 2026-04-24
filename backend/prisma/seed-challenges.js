"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const dotenv_1 = require("dotenv");
const challenge_dto_1 = require("../src/challenge/dto/challenge.dto");
const challenge_generation_prompt_1 = require("../src/challenge/challenge-generation-prompt");
const focus_tags_1 = require("../src/challenge/focus-tags");
(0, dotenv_1.config)();
const prisma = new client_1.PrismaClient();
const MODEL_NAME = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const TARGET_LANGUAGE = focus_tags_1.DEFAULT_LANGUAGE;
const TOTAL = 2;
function startOfDayUtc(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDays(d, n) {
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + n);
    return next;
}
function stripJsonFences(raw) {
    return raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
}
async function generate(client, language, focusTag, difficulty) {
    const prompt = (0, challenge_generation_prompt_1.buildChallengePrompt)(language, focusTag, difficulty, process.env.CHALLENGE_GENERATION_PROMPT);
    const response = await client.messages.create({
        model: MODEL_NAME,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    if (!rawText)
        throw new Error('Empty response from Claude');
    const raw = stripJsonFences(rawText);
    const parsed = JSON.parse(raw);
    const safe = challenge_dto_1.GeneratedChallengeSchema.safeParse(parsed);
    if (!safe.success) {
        throw new Error(`Invalid Claude output for ${focusTag}/${difficulty}: ${safe.error.issues[0].message}`);
    }
    (0, challenge_generation_prompt_1.validateGeneratedSnippet)(safe.data.snippet, safe.data.issues);
    return safe.data;
}
async function main() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set — aborting seed.');
    }
    const client = new sdk_1.default({ apiKey });
    const today = startOfDayUtc(new Date());
    const tags = (0, focus_tags_1.getTagsForLanguage)(TARGET_LANGUAGE);
    const existingCount = await prisma.dailyChallenge.count({
        where: { language: TARGET_LANGUAGE },
    });
    let seeded = 0;
    let skipped = 0;
    for (let i = 0; i < TOTAL; i++) {
        const date = addDays(today, i);
        const rotationIndex = existingCount + i;
        const focusTag = tags[rotationIndex % tags.length];
        const difficulty = challenge_dto_1.DIFFICULTIES[Math.floor(rotationIndex / tags.length) % challenge_dto_1.DIFFICULTIES.length];
        const existing = await prisma.dailyChallenge.findUnique({
            where: { date_language: { date, language: TARGET_LANGUAGE } },
        });
        if (existing) {
            console.log(`[${date.toISOString().slice(0, 10)}] ${TARGET_LANGUAGE} exists — skipping`);
            skipped++;
            continue;
        }
        console.log(`[${date.toISOString().slice(0, 10)}] generating ${TARGET_LANGUAGE}/${focusTag}/${difficulty}...`);
        try {
            const gen = await generate(client, TARGET_LANGUAGE, focusTag, difficulty);
            await prisma.dailyChallenge.create({
                data: {
                    date,
                    language: TARGET_LANGUAGE,
                    title: gen.title,
                    focusTag,
                    difficulty,
                    snippet: gen.snippet,
                    question: gen.question,
                    issues: gen.issues,
                    estimatedTime: gen.estimatedTime,
                },
            });
            seeded++;
        }
        catch (err) {
            console.error(`  ✗ failed: ${err.message}`);
        }
    }
    console.log(`\nSeeded ${seeded} new challenges. Skipped ${skipped} existing.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-challenges.js.map