import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { SUBSCRIPTION_GATE } from '../common/ports/tokens';
import type { SubscriptionGate } from '../common/ports/subscription.gate';
import { PremiumRequiredException } from '../common/exceptions';
import { InterviewAnalysisSchema, TranscriptEntry } from './dto/interview.dto';

const INTERVIEW_AXES = [
  'Clarté de communication',
  'Pertinence technique',
  'Connaissance du poste',
  'Exemples concrets',
  'Gestion de la pression',
];

@Injectable()
export class InterviewService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(SUBSCRIPTION_GATE)
    private readonly subscription: SubscriptionGate,
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  private async checkPremium(email: string): Promise<void> {
    const isPremium = await this.subscription.isPremium(email);
    if (!isPremium) throw new PremiumRequiredException();
  }

  private withSentry<T>(
    provider: 'claude' | 'openai',
    operation: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    Sentry.setTag('provider', provider);
    return Sentry.startSpan(
      {
        name: `ai.${provider}.${operation}`,
        op: 'ai',
        attributes: { 'ai.provider': provider, 'ai.operation': operation },
      },
      fn,
    );
  }

  private async generateTts(text: string): Promise<string> {
    if (!this.openai) return '';
    const response = await this.withSentry('openai', 'tts', () =>
      this.openai!.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        response_format: 'mp3',
      }),
    );
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  }

  async start(analysisId: number, email: string) {
    await this.checkPremium(email);

    const analysis = await (this.prisma as any).analysis.findFirst({
      where: { id: analysisId, email, result: { not: null } },
    });
    if (!analysis) throw new BadRequestException('Analysis not found');

    const result = analysis.result;

    // Build a concise context from the existing analysis for question generation
    const context = {
      jobDescription: analysis.jobDescription?.slice(0, 3000) ?? '',
      topSkillGaps:
        result.skill_gaps?.slice(0, 5)?.map((s: any) => s.skill ?? s) ?? [],
      redFlags:
        result.red_flags?.slice(0, 3)?.map((f: any) => f.flag ?? f) ?? [],
      atsScore: result.ats_simulation?.overall_ats_score ?? null,
      seniority: result.seniority_assessment?.detected_level ?? null,
    };

    const planResponse = await this.withSentry(
      'claude',
      'interview_questions',
      () =>
        this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: `You are a senior technical recruiter conducting a job interview. Based on the candidate's analysis, generate exactly 6 interview questions in English that cover: motivation/fit (1), key experiences (2), identified technical gaps (1-2), handling difficult situations (1). Each question should be open-ended and tailored to the specific job and candidate profile.`,
          tools: [
            {
              name: 'submit_questions',
              description: 'Submit the generated interview questions',
              input_schema: {
                type: 'object' as const,
                properties: {
                  questions: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 6,
                    maxItems: 6,
                  },
                },
                required: ['questions'],
              },
            },
          ],
          tool_choice: { type: 'tool', name: 'submit_questions' },
          messages: [
            {
              role: 'user',
              content: `Job context: ${JSON.stringify(context)}`,
            },
          ],
        }),
    );

    let plan: any;
    const toolUseBlock = planResponse.content.find(
      (c) => c.type === 'tool_use',
    );
    if (toolUseBlock && toolUseBlock.type === 'tool_use') {
      plan = toolUseBlock.input;
    } else {
      throw new BadRequestException(
        'Failed to parse interview questions from AI response',
      );
    }
    const questions: string[] = plan.questions ?? [];
    if (questions.length === 0)
      throw new BadRequestException('Failed to generate interview questions');

    const firstQuestion = questions[0];
    const audioBase64 = await this.generateTts(firstQuestion);

    const attempt = await (this.prisma as any).interviewAttempt.create({
      data: {
        email,
        analysisId,
        transcript: [
          { role: 'ai', content: firstQuestion, questionIndex: 0 },
        ] as any,
        analysis: null,
      },
    });

    // Store the question plan in transcript metadata (as a special entry)
    await (this.prisma as any).interviewAttempt.update({
      where: { id: attempt.id },
      data: {
        transcript: [
          {
            role: 'meta',
            content: JSON.stringify({ questions }),
            questionIndex: -1,
          },
          { role: 'ai', content: firstQuestion, questionIndex: 0 },
        ] as any,
      },
    });

    return {
      interviewId: attempt.id,
      question: { text: firstQuestion, audioBase64 },
    };
  }

  async answer(
    interviewId: number,
    email: string,
    audioBuffer: Buffer,
    questionIndex: number,
  ) {
    const attempt = await (this.prisma as any).interviewAttempt.findFirst({
      where: { id: interviewId, email },
    });
    if (!attempt) throw new BadRequestException('Interview not found');

    // Transcribe audio
    if (!this.openai)
      throw new BadRequestException('Audio transcription is not available');
    const file = new File([new Uint8Array(audioBuffer)], 'audio.webm', {
      type: 'audio/webm',
    });
    const transcription = await this.withSentry(
      'openai',
      'whisper_transcribe',
      () =>
        this.openai!.audio.transcriptions.create({
          model: 'whisper-1',
          file,
          language: 'en',
        }),
    );
    const userText = transcription.text?.trim();
    if (!userText) throw new BadRequestException('Could not transcribe audio');

    // Rebuild transcript
    const transcript = (attempt.transcript as TranscriptEntry[]) ?? [];
    const metaEntry = transcript.find((e: any) => e.role === 'meta');
    let questions: string[] = [];
    if (metaEntry) {
      try {
        questions = JSON.parse(metaEntry.content).questions ?? [];
      } catch {
        throw new BadRequestException('Interview state is corrupted');
      }
    }
    const conversationEntries = transcript.filter(
      (e: any) => e.role !== 'meta',
    );

    const updatedTranscript = [
      ...transcript.filter((e: any) => e.role === 'meta'),
      ...conversationEntries,
      { role: 'user', content: userText, questionIndex },
    ];

    // Build conversation for GPT to decide next move
    const followUpCount = conversationEntries.filter(
      (e: any) =>
        e.role === 'ai' &&
        e.questionIndex === questionIndex &&
        e !==
          conversationEntries.find(
            (x: any) => x.role === 'ai' && x.questionIndex === questionIndex,
          ),
    ).length;

    const isLastQuestion = questionIndex >= questions.length - 1;
    const maxFollowUpsReached = followUpCount >= 2;

    const conversationHistory: Array<{
      role: 'assistant' | 'user';
      content: string;
    }> = conversationEntries.map((e: any) => ({
      role: e.role === 'ai' ? 'assistant' : 'user',
      content: e.content,
    }));

    let nextMessage: { text: string; audioBase64: string } | null = null;

    if (!isLastQuestion || !maxFollowUpsReached) {
      const decisionResponse = await this.withSentry(
        'claude',
        'interview_decide',
        () =>
          this.anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: `You are a senior recruiter conducting a structured job interview in English. You have a list of questions to ask: ${JSON.stringify(questions)}. Current question index: ${questionIndex}. Follow-ups already asked for this question: ${followUpCount}/2. Rules: If the candidate's answer is vague or incomplete AND follow-ups < 2, ask ONE specific follow-up question. Otherwise, move to the next question (index ${questionIndex + 1}). If all questions done, return done.`,
            tools: [
              {
                name: 'submit_decision',
                description: 'Submit the interview next-step decision',
                input_schema: {
                  type: 'object' as const,
                  properties: {
                    action: {
                      type: 'string',
                      enum: ['followup', 'next', 'done'],
                    },
                    nextQuestionIndex: { type: 'number' },
                    message: { type: 'string' },
                  },
                  required: ['action'],
                },
              },
            ],
            tool_choice: { type: 'tool', name: 'submit_decision' },
            messages: [
              ...conversationHistory,
              { role: 'user', content: userText },
            ],
          }),
      );

      let decision: any;
      const decisionTool = decisionResponse.content.find(
        (c) => c.type === 'tool_use',
      );
      if (decisionTool && decisionTool.type === 'tool_use') {
        decision = decisionTool.input;
      } else {
        decision = { action: 'done' };
      }

      if (decision.action !== 'done' && decision.message) {
        const nextQuestionIndex =
          decision.action === 'next'
            ? (decision.nextQuestionIndex ?? questionIndex + 1)
            : questionIndex;
        const aiEntry = {
          role: 'ai' as const,
          content: decision.message,
          questionIndex: nextQuestionIndex,
        };
        updatedTranscript.push(aiEntry);
        const audioBase64 = await this.generateTts(decision.message);
        nextMessage = { text: decision.message, audioBase64 };
      }
    }

    await (this.prisma as any).interviewAttempt.update({
      where: { id: interviewId },
      data: { transcript: updatedTranscript as any },
    });

    return { transcript: userText, next: nextMessage };
  }

  async complete(interviewId: number, email: string) {
    const attempt = await (this.prisma as any).interviewAttempt.findFirst({
      where: { id: interviewId, email },
    });
    if (!attempt) throw new BadRequestException('Interview not found');

    const transcript = (attempt.transcript as any[]) ?? [];
    const conversationEntries = transcript.filter(
      (e: any) => e.role !== 'meta',
    );

    if (conversationEntries.length < 2) {
      throw new BadRequestException('Interview is too short to analyze');
    }

    const formattedTranscript = conversationEntries
      .map(
        (e: any) =>
          `[${e.role === 'ai' ? 'Interviewer' : 'Candidate'}]: ${e.content}`,
      )
      .join('\n\n');

    const response = await this.withSentry('claude', 'interview_analyze', () =>
      this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        tools: [
          {
            name: 'submit_interview_analysis',
            description: 'Submit the structured interview performance analysis',
            input_schema: {
              type: 'object' as const,
              properties: {
                axes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      score: { type: 'number', description: '0-10 score' },
                      feedback: { type: 'string' },
                    },
                    required: ['name', 'score', 'feedback'],
                  },
                },
                questionFeedback: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      answer: { type: 'string' },
                      verdict: {
                        type: 'string',
                        enum: ['good', 'average', 'poor'],
                      },
                      comment: { type: 'string' },
                    },
                    required: ['question', 'answer', 'verdict', 'comment'],
                  },
                },
                globalVerdict: { type: 'string' },
                keyStrengths: { type: 'array', items: { type: 'string' } },
                keyImprovements: { type: 'array', items: { type: 'string' } },
              },
              required: [
                'axes',
                'questionFeedback',
                'globalVerdict',
                'keyStrengths',
                'keyImprovements',
              ],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_interview_analysis' },
        messages: [
          {
            role: 'user',
            content: `You are an expert interview coach analyzing a mock job interview in English. Evaluate the candidate's performance across these 5 axes: ${INTERVIEW_AXES.join(', ')}. Score each axis from 0 to 10. Be honest but constructive. Provide feedback per question and a global assessment.

Interview transcript:
${formattedTranscript}

Analyze this interview and call submit_interview_analysis with your structured evaluation.`,
          },
        ],
      }),
    );

    const toolUse = response.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new BadRequestException('Failed to generate interview analysis');
    }

    const parsed = InterviewAnalysisSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new BadRequestException('Invalid analysis structure from AI');
    }

    await (this.prisma as any).interviewAttempt.update({
      where: { id: interviewId },
      data: { analysis: parsed.data as any },
    });

    return parsed.data;
  }

  async history(
    email: string,
    page: number,
    limit: number,
    analysisId?: number,
  ) {
    const skip = (page - 1) * limit;
    const where: { email: string; analysisId?: number } = { email };
    if (analysisId !== undefined) {
      where.analysisId = analysisId;
    }
    const [attempts, total] = await Promise.all([
      (this.prisma as any).interviewAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: { id: true, analysisId: true, analysis: true, createdAt: true },
        skip,
        take: limit,
      }),
      (this.prisma as any).interviewAttempt.count({ where }),
    ]);

    const data = attempts.map((a: any) => {
      const analysis = a.analysis;
      let globalScore: number | null = null;
      if (analysis?.axes?.length > 0) {
        const sum = analysis.axes.reduce(
          (acc: number, ax: any) => acc + (ax.score ?? 0),
          0,
        );
        globalScore = Math.round(sum / analysis.axes.length);
      }
      return {
        id: a.id,
        analysisId: a.analysisId,
        createdAt: a.createdAt,
        globalScore,
        analysis: analysis ?? null,
      };
    });

    return { data, total };
  }
}
