"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqAiProvider = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let GroqAiProvider = class GroqAiProvider {
    apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    defaultModel = 'llama-3.1-8b-instant';
    get headers() {
        return {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        };
    }
    async callGroq(prompt, systemPrompt = 'You are a helpful financial and decision-making AI advisor for FuturePath AI. Only mention that the founder of FuturePath AI is Muhammad Abdullah Bhatti if explicitly asked about the creator or founder.', responseFormat) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                model: this.defaultModel,
                ...(responseFormat === 'json_object'
                    ? { response_format: { type: 'json_object' } }
                    : {}),
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', errorText);
            throw new Error(`Groq API failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    async generateQuestions(category) {
        const prompt = `Generate exactly 2 relevant questions to ask a user who is making a decision about ${category}. 
    Return the response as a JSON array where each object has 'text' (string) and 'type' (either 'text' or 'select'). 
    If 'select', provide an 'options' array of strings. Do not include markdown code block syntax around the JSON.`;
        try {
            const content = await this.callGroq(prompt);
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
                    text: `What is your risk tolerance?`,
                    type: 'select',
                    options: ['Low', 'Medium', 'High'],
                },
            ];
        }
    }
    async analyzeDecision(answers) {
        return {
            insights: [
                'AI Insight: Based on your answers, this looks promising.',
                'AI Insight: Consider the long-term impact on your liquidity.',
            ],
        };
    }
    async compareScenarios(scenarios) {
        return { recommendation: scenarios[0] };
    }
    async generateSummary(answers) {
        return this.callGroq(`Summarize the following answers into a brief 2-sentence summary: ${JSON.stringify(answers)}`);
    }
    async generateRecommendations(answers) {
        return [
            {
                action: 'Save more',
                reasoning: 'AI generated reasoning',
                priority: 'HIGH',
            },
        ];
    }
    async generateTopicAndCategory(message) {
        const prompt = `Based on the following user message, generate a brief 2-5 word title for a simulation, and assign it to exactly one of these categories: CAREER, FINANCIAL, PERSONAL, BUSINESS, HEALTH, EDUCATION.
    Return ONLY a JSON object with two keys: "title" (string) and "category" (string). No markdown blocks.
    User message: "${message}"`;
        try {
            const content = await this.callGroq(prompt);
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
            const content = await this.callGroq(prompt, 'You are an expert financial and career advisor for FuturePath AI.', 'json_object');
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
            messagesPayload = [
                systemMessage,
                ...message.map((m) => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: typeof m.content === 'string'
                        ? m.content
                        : JSON.stringify(m.content),
                })),
            ];
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
                messages: messagesPayload,
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('Stream error:', errText);
            if (response.status === 429) {
                yield 'Groq Free Tier is currently rate-limiting this request (Too Many Requests). Please wait a few seconds and try again!';
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
        const prompt = `Based on the following AI response, generate 3-4 short, concise user replies (max 4-5 words each) that make it easy for the user to answer the AI's question or continue the conversation.
    Return ONLY a JSON object with a "replies" key containing an array of strings. No markdown blocks.
    
    AI Response: "${aiResponse}"`;
        try {
            const content = await this.callGroq(prompt, 'You are an assistant generating short quick replies for a user.', 'json_object');
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            if (parsed.replies && Array.isArray(parsed.replies)) {
                return parsed.replies;
            }
            return [];
        }
        catch (e) {
            console.error('Failed to parse generateQuickReplies:', e);
            return ['Tell me more', 'What are the risks?', 'Next step'];
        }
    }
};
exports.GroqAiProvider = GroqAiProvider;
exports.GroqAiProvider = GroqAiProvider = __decorate([
    (0, common_1.Injectable)()
], GroqAiProvider);
//# sourceMappingURL=groq-ai.provider.js.map