import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  businessName: z.string().min(1).max(100),
  businessType: z.string().min(1).max(50),
  goal: z.string().min(1).max(50),
  tone: z.enum(["Professional", "Casual", "Urgent", "Friendly"]),
  details: z.string().min(1).max(1000),
  language: z.enum(["English", "Afrikaans", "Oshiwambo"]),
});

export const generateMessages = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const systemPrompt = `You are an expert WhatsApp marketing copywriter for African businesses. Generate exactly 3 WhatsApp message variations that are engaging, concise, and drive action. Each message must be under 500 characters. Include appropriate emojis. Write in ${data.language}. Return valid JSON only.`;

    const userPrompt = `Business: ${data.businessName} (${data.businessType})
Goal: ${data.goal}
Tone: ${data.tone}
Language: ${data.language}
Details: ${data.details}

Return JSON: { "messages": [{ "id": "1", "message": "...", "tone": "${data.tone}", "characterCount": 123 }, ...] }`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { messages: Array<{ id: string; message: string; tone: string; characterCount: number }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid response");
    }
    const messages = (parsed.messages ?? []).slice(0, 3).map((m, i) => ({
      id: m.id ?? String(i + 1),
      message: m.message ?? "",
      tone: m.tone ?? data.tone,
      characterCount: m.message?.length ?? 0,
    }));
    return { messages };
  });