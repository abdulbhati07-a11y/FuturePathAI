"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCodeZenAiProvider = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let OpenCodeZenAiProvider = class OpenCodeZenAiProvider {
    apiUrl = 'https://opencode.ai/zen/v1/chat/completions';
    defaultModel = 'deepseek-v4-flash-free';
    get headers() {
        return {
            Authorization: `Bearer ${process.env.OPENCODEZEN_API_KEY}`,
            'Content-Type': 'application/json',
        };
    }
    async callOpenCodeZen(prompt, systemPrompt = 'You are a decisive financial and decision-making AI advisor for FuturePath AI. Always commit to a clear recommendation backed by concrete reasoning — never hedge with "it depends" without immediately stating what it depends on and which option wins in each case. Be concise. Only mention that the founder of FuturePath AI is Muhammad Abdullah Bhatti if explicitly asked about the creator or founder.', options = {}) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                model: this.defaultModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                ...(options.reasoning ? {} : { reasoning_effort: 'none' }),
                temperature: options.temperature ?? 0.4,
                ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenCodeZen API error:', errorText);
            throw new Error(`OpenCodeZen API failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    async generateQuestions(category) {
        const prompt = `Generate exactly 4 sharp intake questions for a user making a decision about ${category}.
    Each question must target a DIFFERENT dimension: financial impact, risk tolerance, timeline/urgency, and personal priorities.
    Prefer 'select' questions so the user can answer fast: at least 3 of the 4 must be 'select' with 4-5 specific, mutually exclusive options covering the realistic range (use concrete amounts, timeframes, or stances — e.g. "Under $5k", "$5k-$20k", "6-12 months", not vague "Low/Medium/High" unless it truly fits).
    Return the response as a JSON array where each object has 'text' (string) and 'type' (either 'text' or 'select').
    If 'select', provide an 'options' array of strings. Do not include markdown code block syntax around the JSON.`;
        try {
            const content = await this.callOpenCodeZen(prompt, undefined, {
                maxTokens: 700,
                temperature: 0.5,
            });
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            return parsed.map((q) => ({ ...q, id: (0, crypto_1.randomUUID)() }));
        }
        catch (err) {
            console.error('Failed to parse generateQuestions:', err);
            return [
                {
                    id: (0, crypto_1.randomUUID)(),
                    text: `What is your primary goal for ${category}?`,
                    type: 'text',
                },
                {
                    id: (0, crypto_1.randomUUID)(),
                    text: `How much financial buffer do you have for this decision?`,
                    type: 'select',
                    options: ['Under $5k', '$5k–$20k', '$20k–$50k', 'Over $50k'],
                },
                {
                    id: (0, crypto_1.randomUUID)(),
                    text: `How soon do you need to decide?`,
                    type: 'select',
                    options: ['This week', 'Within a month', '1–6 months', 'No deadline'],
                },
                {
                    id: (0, crypto_1.randomUUID)(),
                    text: `What is your risk tolerance?`,
                    type: 'select',
                    options: [
                        'Very cautious — protect what I have',
                        'Balanced — some risk for solid gains',
                        'Aggressive — big risk for big upside',
                    ],
                },
            ];
        }
    }
    async analyzeDecision(answers) {
        const prompt = `A user answered the following intake questions about a life decision:
${JSON.stringify(answers)}

Generate 3-4 precise, personalized insights about their situation. Each insight must:
- Reference their actual answers (amounts, timeframes, stated priorities)
- Quantify impact where possible (percentages, USD amounts, timeframes)
- Surface something non-obvious (a hidden risk, an overlooked upside, a timing factor)

Return ONLY a JSON object: { "insights": ["<insight 1>", "<insight 2>", ...] }. No markdown blocks.`;
        try {
            const content = await this.callOpenCodeZen(prompt);
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed?.insights) && parsed.insights.length > 0) {
                return { insights: parsed.insights };
            }
            throw new Error('Malformed insights payload');
        }
        catch (err) {
            console.error('Failed to parse analyzeDecision:', err);
            return {
                insights: [
                    'AI Insight: Based on your answers, this looks promising.',
                    'AI Insight: Consider the long-term impact on your liquidity.',
                ],
            };
        }
    }
    async compareScenarios(scenarios) {
        if (!scenarios || scenarios.length === 0)
            return { recommendation: null };
        if (scenarios.length === 1)
            return { recommendation: scenarios[0] };
        const prompt = `Compare the following decision scenarios and pick the single best one:
${JSON.stringify(scenarios)}

Return ONLY a JSON object, no markdown blocks:
{ "winnerIndex": <0-based index of the best scenario>, "reasoning": "<2 sentences: why it wins, quantified where possible>", "runnerUpIndex": <index of second best> }`;
        try {
            const content = await this.callOpenCodeZen(prompt);
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            const idx = Number.isInteger(parsed?.winnerIndex) &&
                parsed.winnerIndex >= 0 &&
                parsed.winnerIndex < scenarios.length
                ? parsed.winnerIndex
                : 0;
            return {
                recommendation: scenarios[idx],
                reasoning: parsed?.reasoning ?? '',
                runnerUp: Number.isInteger(parsed?.runnerUpIndex) &&
                    parsed.runnerUpIndex >= 0 &&
                    parsed.runnerUpIndex < scenarios.length
                    ? scenarios[parsed.runnerUpIndex]
                    : null,
            };
        }
        catch (err) {
            console.error('Failed to parse compareScenarios:', err);
            return { recommendation: scenarios[0] };
        }
    }
    async generateSummary(answers) {
        return this.callOpenCodeZen(`Summarize the following answers into a brief 2-sentence summary: ${JSON.stringify(answers)}`);
    }
    async generateRecommendations(answers) {
        const prompt = `A user answered the following questions about a life decision:
${JSON.stringify(answers)}

Generate 3 concrete, prioritized action recommendations. Each must:
- Start with a verb and be doable within a stated timeframe
- Include specific numbers where relevant (USD amounts, percentages, durations)
- Have reasoning that references the user's actual answers

Return ONLY a JSON array, no markdown blocks:
[ { "action": "<imperative action, max 8 words>", "reasoning": "<1-2 sentences, quantified>", "priority": "HIGH" | "MEDIUM" | "LOW" } ]`;
        try {
            const content = await this.callOpenCodeZen(prompt);
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed
                    .filter((r) => r?.action)
                    .map((r) => ({
                    action: r.action,
                    reasoning: r.reasoning ?? '',
                    priority: ['HIGH', 'MEDIUM', 'LOW'].includes(r.priority)
                        ? r.priority
                        : 'MEDIUM',
                }));
            }
            throw new Error('Malformed recommendations payload');
        }
        catch (err) {
            console.error('Failed to parse generateRecommendations:', err);
            return [
                {
                    action: 'Save more',
                    reasoning: 'AI generated reasoning',
                    priority: 'HIGH',
                },
            ];
        }
    }
    async generateTopicAndCategory(message) {
        const prompt = `Based on the following user message, generate a brief 2-5 word title for a simulation, and assign it to exactly one of these categories: CAREER, FINANCIAL, PERSONAL, BUSINESS, HEALTH, EDUCATION.
    Return ONLY a JSON object with two keys: "title" (string) and "category" (string). No markdown blocks.
    User message: "${message}"`;
        try {
            const content = await this.callOpenCodeZen(prompt);
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            const validCategories = [
                'CAREER',
                'FINANCIAL',
                'PERSONAL',
                'BUSINESS',
                'HEALTH',
                'EDUCATION',
            ];
            const category = validCategories.includes(parsed.category)
                ? parsed.category
                : 'PERSONAL';
            return {
                title: parsed.title || 'New Simulation',
                category,
            };
        }
        catch (err) {
            console.error('Failed to parse generateTopicAndCategory:', err);
            return { title: 'New Simulation', category: 'PERSONAL' };
        }
    }
    async generateFullReport(title, category, answers, context) {
        let profileContext = '';
        if (context) {
            profileContext = `User Baseline Profile:\n${JSON.stringify(context, null, 2)}\n\n`;
        }
        const prompt = `
    You are an expert financial and career advisor for FuturePath AI.

    Simulation Title: ${title}
    Category: ${category}
    ${profileContext}User Answers/Context: ${JSON.stringify(answers)}

    Analyze the user's situation based on the provided context, referencing real-world studies, statistics, or general economic/industry proofs where applicable.
    When generating salary or financial figures, ALWAYS use USD (e.g. +$20k) and not Euros or other currencies.
    You MUST return ONLY a raw JSON object (without markdown blocks like \`\`\`json) with the exact following structure:
    {
      "bestCase": { "label": "BEST CASE", "probability": <number 1-100>, "title": "<short title>", "description": "<detailed description>", "salaryDelta": "<e.g. +$20k or N/A>", "satisfaction": "<e.g. 9/10>" },
      "mostLikely": { "label": "MOST LIKELY", "probability": <number 1-100>, "title": "...", "description": "...", "salaryDelta": "...", "satisfaction": "..." },
      "worstCase": { "label": "WORST CASE", "probability": <number 1-100>, "title": "...", "description": "...", "salaryDelta": "...", "satisfaction": "..." },
      "rightReasons": [ "<reason 1>", "<reason 2>", "<reason 3>" ],
      "wrongReasons": [ "<reason 1>", "<reason 2>", "<reason 3>" ],
      "timeline": [
        { "id": "t1", "label": "TODAY", "sublabel": "<action>" },
        { "id": "t2", "label": "MONTH 3", "sublabel": "<milestone>" },
        { "id": "t3", "label": "YEAR 1", "sublabel": "<milestone>" },
        { "id": "t4", "label": "YEAR 3", "sublabel": "<milestone>" },
        { "id": "t5", "label": "YEAR 5+", "sublabel": "<long term>" }
      ],
      "alternatives": [
        { "id": "alt1", "title": "<alt 1>", "subtitle": "<brief desc>", "score": <number 1-100> },
        { "id": "alt2", "title": "<alt 2>", "subtitle": "<brief desc>", "score": <number 1-100> }
      ]
    }`;
        try {
            const content = await this.callOpenCodeZen(prompt, undefined, {
                reasoning: false,
            });
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(cleaned);
        }
        catch (err) {
            console.error('Failed to parse generateFullReport:', err);
            return {
                bestCase: {
                    label: 'BEST CASE',
                    probability: 25,
                    title: 'Optimistic Outcome',
                    description: 'Everything goes perfectly.',
                    salaryDelta: 'High',
                    satisfaction: '9/10',
                },
                mostLikely: {
                    label: 'MOST LIKELY',
                    probability: 60,
                    title: 'Realistic Outcome',
                    description: 'Expected progression.',
                    salaryDelta: 'Moderate',
                    satisfaction: '7/10',
                },
                worstCase: {
                    label: 'WORST CASE',
                    probability: 15,
                    title: 'Pessimistic Outcome',
                    description: 'Things do not go as planned.',
                    salaryDelta: 'Low',
                    satisfaction: '4/10',
                },
                rightReasons: [
                    'Data point 1 supports this',
                    'Data point 2 supports this',
                ],
                wrongReasons: ['Risk 1', 'Risk 2'],
                timeline: [{ id: 't1', label: 'TODAY', sublabel: 'Start' }],
                alternatives: [],
            };
        }
    }
    async *streamChat(message, context) {
        let profileContext = '';
        if (context) {
            profileContext = `\n\nUser Baseline Profile: ${JSON.stringify(context)}`;
        }
        const systemMessage = {
            role: 'system',
            content: 'You are an expert AI decision advisor for FuturePath AI. FuturePath AI is an advanced platform that helps users simulate and analyze major life decisions. Provide concise, actionable advice. Only mention that the founder of FuturePath AI is Muhammad Abdullah Bhatti if explicitly asked about the creator or founder.' +
                profileContext,
        };
        let messagesPayload = [];
        if (Array.isArray(message)) {
            const mapped = message.map((m) => ({
                role: m.role === 'assistant'
                    ? 'assistant'
                    : m.role === 'system'
                        ? 'system'
                        : 'user',
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            }));
            const hasSystem = mapped.some((m) => m.role === 'system');
            messagesPayload = hasSystem ? mapped : [systemMessage, ...mapped];
        }
        else {
            messagesPayload = [systemMessage, { role: 'user', content: message }];
        }
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                model: this.defaultModel,
                stream: true,
                reasoning_effort: 'none',
                messages: messagesPayload,
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('Stream error:', errText);
            if (response.status === 429) {
                yield 'OpenCodeZen Free Tier is currently rate-limiting this request (Too Many Requests). Please wait a few seconds and try again!';
                return;
            }
            yield `AI Provider Error: ${response.statusText}`;
            return;
        }
        if (!response.body)
            return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr.trim() === '[DONE]') {
                            return;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                        }
                        catch (e) {
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async generateQuickReplies(aiResponse) {
        const prompt = `The AI advisor just sent the following message to a user who is working through a life decision.

Generate exactly 4 short quick-reply options the user could tap to respond.

RULES:
- If the AI's message asks a question (or offers lettered options), each reply must be a DIRECT, CONCRETE ANSWER to that question — restate the option's content in the user's voice (e.g. "Under $5k saved", "I'd relocate within 6 months"), NOT the letter ("Option A") and NOT a meta-reply ("Tell me more").
- The 4 replies together must cover the realistic range of answers, including one less-obvious but plausible stance.
- If the AI's message is advice/summary rather than a question, generate 4 sharp follow-ups that push the decision forward (e.g. "What's the biggest risk?", "Show me the numbers", "Compare with staying put").
- Max 8 words per reply. First person, as the user.

Return ONLY a JSON array of 4 strings, no markdown.

AI message: "${aiResponse}"`;
        try {
            const content = await this.callOpenCodeZen(prompt, undefined, {
                maxTokens: 200,
                temperature: 0.5,
            });
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter((r) => typeof r === 'string').slice(0, 4);
            }
            return ["Tell me more", "I understand", "What's next?"];
        }
        catch (err) {
            console.error('Failed to parse generateQuickReplies:', err);
            return ["Tell me more", "I understand", "What's next?"];
        }
    }
};
exports.OpenCodeZenAiProvider = OpenCodeZenAiProvider;
exports.OpenCodeZenAiProvider = OpenCodeZenAiProvider = __decorate([
    (0, common_1.Injectable)()
], OpenCodeZenAiProvider);
//# sourceMappingURL=opencodezen-ai.provider.js.map