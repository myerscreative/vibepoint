/**
 * Anthropic AI Client
 *
 * Privacy-preserving integration with Claude API
 * for Pro tier AI features.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Get config from environment variables
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
const FALLBACK_MODEL = process.env.ANTHROPIC_FALLBACK_MODEL || 'claude-3-haiku-20240307';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

/**
 * Calculate cost based on Claude 3.5 Sonnet pricing
 * Input: $3 per million tokens
 * Output: $15 per million tokens
 */
function calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
  const inputCost = (usage.input_tokens / 1_000_000) * 3;
  const outputCost = (usage.output_tokens / 1_000_000) * 15;
  return inputCost + outputCost;
}

/**
 * Send a message to Claude and get a response
 */
export async function sendMessage(
  systemPrompt: string,
  userMessage: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    useFallback?: boolean;
  } = {}
): Promise<{ response: string; usage: AIUsage }> {
  if (!API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const {
    maxTokens = 2048,
    temperature = 0.7,
    useFallback = false,
  } = options;

  const model = useFallback ? FALLBACK_MODEL : MODEL;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data: AnthropicResponse = await response.json();

    return {
      response: data.content[0].text,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        estimatedCostUSD: calculateCost(data.usage),
      },
    };
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}

/**
 * Generate AI coaching insights from mood patterns
 */
export async function generatePatternInsights(
  patterns: {
    happinessBoosters: Array<{ activity: string; avgBoost: number; count: number }>;
    happinessDrains: Array<{ activity: string; avgDrop: number; count: number }>;
    bodyPatterns: Array<{ sensation: string; correlation: number }>;
    selfTalkPatterns: Array<{ phrase: string; correlation: number }>;
    entryCount: number;
    timeSpanDays: number;
  }
): Promise<{ insights: Array<{ type: string; insight: string }>; usage: AIUsage }> {
  const systemPrompt = `You are an expert emotion coach helping users understand their mood patterns.

Your role:
- Analyze mood data patterns and provide actionable insights
- Focus on the three controllable inputs: focus, self-talk, and physical state
- Use a warm, encouraging, non-clinical tone
- Keep insights concise (1-2 sentences each)
- Provide 3-5 insights maximum
- Be specific and reference the actual data

Return insights as JSON in this format:
{
  "insights": [
    {"type": "discovery", "insight": "..."},
    {"type": "pattern", "insight": "..."},
    {"type": "suggestion", "insight": "..."}
  ]
}

Types: discovery (new finding), pattern (recurring theme), suggestion (actionable tip), warning (concerning trend), celebration (positive progress)`;

  const userMessage = `Analyze these mood patterns and provide personalized insights:

**Happiness Boosters:**
${patterns.happinessBoosters.map(b => `- ${b.activity}: +${b.avgBoost} points (${b.count} entries)`).join('\n') || 'None identified yet'}

**Happiness Drains:**
${patterns.happinessDrains.map(d => `- ${d.activity}: ${d.avgDrop} points (${d.count} entries)`).join('\n') || 'None identified yet'}

**Body Patterns:**
${patterns.bodyPatterns.map(b => `- "${b.sensation}" correlates ${(b.correlation * 100).toFixed(0)}% with low mood`).join('\n') || 'None identified yet'}

**Self-Talk Patterns:**
${patterns.selfTalkPatterns.map(s => `- "${s.phrase}" correlates ${(s.correlation * 100).toFixed(0)}% with low mood`).join('\n') || 'None identified yet'}

**Context:**
- Total entries: ${patterns.entryCount}
- Time span: ${patterns.timeSpanDays} days

Provide 3-5 actionable insights in JSON format.`;

  const { response, usage } = await sendMessage(systemPrompt, userMessage, {
    maxTokens: 1024,
    temperature: 0.7,
  });

  try {
    const parsed = JSON.parse(response);
    return { insights: parsed.insights || [], usage };
  } catch (error) {
    console.error('Failed to parse AI response:', response);
    throw new Error('AI returned invalid JSON');
  }
}

/**
 * Generate a personalized emotion recipe
 */
export async function generateEmotionRecipe(
  targetEmotion: string,
  bestStates: Array<{
    mood: { happiness: number; motivation: number };
    focus: string;
    selfTalk: string;
    physical: string;
  }>,
  currentState: {
    mood: { happiness: number; motivation: number };
    focus: string;
    selfTalk: string;
    physical: string;
  }
): Promise<{
  recipe: {
    title: string;
    duration: string;
    steps: Array<{ step: number; focus: string; instruction: string }>;
    whyThisWorks: string;
  };
  usage: AIUsage;
}> {
  const systemPrompt = `You are an emotion coach helping users create their desired emotional states.

Your approach:
- Teach the three controllable inputs: focus, self-talk, and body
- Base recommendations on the user's own successful past states
- Provide specific, actionable 60-second transition scripts
- Use warm, empowering language
- Avoid clinical jargon

Return JSON in this format:
{
  "recipe": {
    "title": "Your [Emotion] Recipe",
    "duration": "60 seconds",
    "steps": [
      {"step": 1, "focus": "mental shift", "instruction": "specific action"},
      {"step": 2, "focus": "body adjustment", "instruction": "specific action"},
      {"step": 3, "focus": "anchor", "instruction": "specific action"}
    ],
    "whyThisWorks": "Brief explanation based on their data"
  }
}`;

  const userMessage = `Create a recipe to help this person feel "${targetEmotion}".

**Their Best ${targetEmotion} States (from past entries):**
${bestStates.map((state, i) => `
State ${i + 1}:
- Happiness: ${state.mood.happiness}, Motivation: ${state.mood.motivation}
- Focus: "${state.focus}"
- Self-talk: "${state.selfTalk}"
- Physical: "${state.physical}"
`).join('\n')}

**Current State:**
- Happiness: ${currentState.mood.happiness}, Motivation: ${currentState.mood.motivation}
- Focus: "${currentState.focus}"
- Self-talk: "${currentState.selfTalk}"
- Physical: "${currentState.physical}"

Create a 60-second, 3-step recipe that bridges from their current state to the target emotion, using patterns from their best states.`;

  const { response, usage } = await sendMessage(systemPrompt, userMessage, {
    maxTokens: 1024,
    temperature: 0.8,
  });

  try {
    const parsed = JSON.parse(response);
    return { recipe: parsed.recipe, usage };
  } catch (error) {
    console.error('Failed to parse AI response:', response);
    throw new Error('AI returned invalid JSON');
  }
}

/**
 * Generate a real-time coaching suggestion during mood logging
 */
export async function generateCoachingSuggestion(
  currentMood: { happiness: number; motivation: number },
  focus: string,
  selfTalk: string,
  physical: string
): Promise<{ suggestion: string; type: string; usage: AIUsage }> {
  const systemPrompt = `You are a supportive emotion coach providing real-time feedback as someone logs their mood.

Your role:
- Offer brief, encouraging observations
- Detect cognitive distortions and suggest gentle reframes
- Celebrate positive patterns
- Keep responses to 1-2 sentences
- Be warm and non-judgmental

Return JSON:
{
  "suggestion": "Your coaching message here",
  "type": "reframe" | "celebrate" | "explore" | "validate"
}`;

  const userMessage = `Someone just logged this mood state:
- Happiness: ${currentMood.happiness}, Motivation: ${currentMood.motivation}
- Focusing on: "${focus}"
- Telling themselves: "${selfTalk}"
- Physical: "${physical}"

Provide a brief coaching suggestion.`;

  const { response, usage } = await sendMessage(systemPrompt, userMessage, {
    maxTokens: 256,
    temperature: 0.7,
    useFallback: true, // Use cheaper model for real-time suggestions
  });

  try {
    const parsed = JSON.parse(response);
    return { suggestion: parsed.suggestion, type: parsed.type, usage };
  } catch (error) {
    console.error('Failed to parse AI response:', response);
    throw new Error('AI returned invalid JSON');
  }
}
