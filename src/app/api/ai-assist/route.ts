import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an intelligent assistant built into Accuracy Flux, a practice management platform for accounting firms.

You help accounting professionals with:
- Tax questions and strategies (individual and business)
- Bookkeeping best practices and reconciliation
- Payroll regulations and filing deadlines
- Client communication and engagement management
- Workflow and productivity tips
- General accounting standards and principles

Keep responses concise and practical. Use bullet points for lists. When citing deadlines or tax rules, note that regulations change and the user should verify current rules.

You have access to context from the app — the user may ask you to help draft client messages, summarize work, or explain accounting concepts. Be helpful, professional, and direct.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI assistant not configured' }, { status: 500 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-20), // keep last 20 messages for context
        ],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';
    return NextResponse.json({ content });
  } catch (err) {
    console.error('AI assist error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
