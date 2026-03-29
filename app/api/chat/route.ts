import OpenAI from "openai";
import { NextResponse } from "next/server";

import { DEFAULT_PROFILE, type UserProfile } from "@/lib/assistant-config";
import { buildSystemPrompt } from "@/lib/system-prompt";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  attachments?: {
    dataUrl: string;
    mimeType: string;
    name: string;
  }[];
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  selectedActionId?: string | null;
  profile?: Partial<UserProfile>;
};

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function normalizeProfile(profile?: Partial<UserProfile>): UserProfile {
  return {
    name: profile?.name?.trim() || DEFAULT_PROFILE.name,
    goals: profile?.goals?.trim() || DEFAULT_PROFILE.goals,
    comfortLevel: profile?.comfortLevel?.trim() || DEFAULT_PROFILE.comfortLevel,
    device: profile?.device?.trim() || DEFAULT_PROFILE.device,
  };
}

export async function POST(request: Request) {
  if (!client) {
    return NextResponse.json(
      {
        error:
          "The server is missing OPENAI_API_KEY. Add it to your environment before using chat.",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as ChatRequestBody;
    const messages = body.messages ?? [];
    const profile = normalizeProfile(body.profile);

    const input = [
      {
        role: "system" as const,
        content: buildSystemPrompt(profile, body.selectedActionId),
      },
      ...messages.map((message) => ({
        role: message.role,
        content:
          message.role === "user" && message.attachments?.length
            ? [
                ...(message.content
                  ? [{ type: "input_text" as const, text: message.content }]
                  : []),
                ...message.attachments.map((attachment) => ({
                  type: "input_image" as const,
                  image_url: attachment.dataUrl,
                  detail: "high" as const,
                })),
              ]
            : message.content,
      })),
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input,
      temperature: 0.7,
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return NextResponse.json(
        {
          error: "The assistant did not return any text.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while generating a reply.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
