import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dummyAnalysis = {
  axes: [
    { name: "Communication clarity", score: 7, feedback: "You expressed your ideas clearly in most answers, though you occasionally over-explained simple concepts. Work on being more concise under pressure." },
    { name: "Technical relevance", score: 5, feedback: "Your answers touched on the right topics but lacked depth on React performance and state management trade-offs. Brush up on the specifics." },
    { name: "Role understanding", score: 8, feedback: "Strong understanding of the role expectations. You referenced the job description naturally and aligned your experience well." },
    { name: "Concrete examples", score: 4, feedback: "Too many answers stayed abstract. Describe measurable outcomes and your specific contribution, not just what happened." },
    { name: "Composure under pressure", score: 6, feedback: "You recovered well after hesitating on the technical gap question. Some long pauses are noticeable — practice thinking aloud." },
  ],
  questionFeedback: [
    { question: "Why are you interested in this role?", answer: "I have been following the company and think the product is really interesting.", verdict: "average", comment: "Too generic. Research their stack and mission and mention something specific about why this company, not just this role." },
    { question: "Tell me about a project delivered under a tight deadline.", answer: "We had a launch and I worked overtime for two weeks. We shipped on time.", verdict: "average", comment: "Use STAR: Situation, Task, Action, Result. What did you specifically do that made the delivery possible?" },
    { question: "You have limited TypeScript experience — how would you address that gap?", answer: "I have been learning on the side. I pick up new things fast.", verdict: "poor", comment: "Show initiative with evidence: name a project you built or a course you completed. Confidence without proof is not enough." },
    { question: "How would you architect a scalable frontend for a high-traffic app?", answer: "React with lazy loading, code splitting, caching and a CDN for static assets.", verdict: "good", comment: "Solid answer. Could go deeper on state management at scale or SSR vs SSG trade-offs, but overall strong." },
    { question: "Describe a time you disagreed with a technical decision.", answer: "I raised my concern but the team went ahead anyway so I just implemented it.", verdict: "poor", comment: "This signals passivity. Show that you can advocate constructively and adapt gracefully when overruled — what did you learn?" },
    { question: "Where do you see yourself in two years?", answer: "Senior developer then tech lead.", verdict: "good", comment: "Clear and realistic ambition. Tie it to something specific the company offers to make it land better." },
  ],
  globalVerdict: "Solid foundation and good general communication, but too many answers stayed at surface level. Practice structuring answers with STAR and backing every claim with a concrete example. Address skill gaps with evidence, not reassurance.",
  keyStrengths: [
    "Clear communication in most answers",
    "Good role and JD alignment",
    "Strong frontend architecture instincts",
  ],
  keyImprovements: [
    "Use STAR for every experience answer — outcomes matter",
    "Address skill gaps with evidence, not reassurance",
    "Show proactivity when disagreeing with team decisions",
  ],
};

async function main() {
  const id = parseInt(process.argv[2] ?? '1');
  const result = await (prisma as any).interviewAttempt.update({
    where: { id },
    data: { analysis: dummyAnalysis },
  });
  console.log(`Updated InterviewAttempt #${result.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
