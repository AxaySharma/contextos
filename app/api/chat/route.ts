// app/api/chat/route.ts
//
// THE BRAIN OF CONTEXTOS — Gemini 2.5 Flash Chat API
// ─────────────────────────────────────────────────────────────────────────────
// This route receives a user message + conversation history + document text,
// constructs a powerful system prompt with the full document as context (RAG),
// calls Gemini 2.5 Flash, and returns the AI's response.
//
// The AI is instructed to always cite page numbers in the format [Page N],
// which the frontend parses into clickable links that jump the PDF viewer.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize the Gemini SDK with our API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  documentText: string;
  documentTitle: string;
}

interface ChatResponse {
  text: string;
  error?: string;
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(documentTitle: string, documentText: string): string {
  return `You are ContextOS, an elite private document intelligence assistant deployed exclusively for a Strategic Advisory and Chartered Accountancy firm. You operate with the discretion of a senior partner and the precision of a forensic analyst.

You have been granted secure access to the following classified document:

DOCUMENT TITLE: ${documentTitle}

═══════════════════════════════════════════════════════════
DOCUMENT CONTENT (FULL TEXT):
═══════════════════════════════════════════════════════════
${documentText}
═══════════════════════════════════════════════════════════

OPERATING RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:

1. CITATIONS ARE MANDATORY: Every time you reference specific data, figures, findings, or conclusions from the document, you MUST cite the exact page number using this precise format: [Page N]. For example: "The company's EBITDA margin was 23.1% [Page 3]."

2. PAGE MARKERS: The document content above uses the marker format "--- PAGE N ---" to indicate where each page begins. Use these to determine which page contains specific information.

3. ACCURACY: Only answer based on the document content provided. Do not use external knowledge to fill in gaps. If information is not in the document, say so clearly.

4. PROFESSIONAL TONE: Respond as a senior financial/legal analyst would — precise, structured, and authoritative. Use bullet points and clear formatting for complex answers.

5. MULTIPLE CITATIONS: A single answer may contain multiple citations from different pages. That is expected and encouraged. Example: "Revenue was ₹2,620 Crores [Page 2], representing a margin of 23.1% [Page 3]."

6. SENSITIVE INFORMATION: Treat all information as strictly confidential. Do not add disclaimers about public information — the context here is a private internal advisory environment.

7. NO HALLUCINATION: If a number, name, or fact is not explicitly stated in the document, do not invent it. Say "The document does not specify this information."

Begin each response by directly addressing the question. Do not use a preamble like "Based on the document..." — simply answer with precision and confidence.`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  // ── Security Check ──────────────────────────────────────────────────────────
  // Verify the user is authenticated before allowing any AI calls.
  // This prevents unauthorized API access even if middleware is bypassed.
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return Response.json(
      { error: "Unauthorized. Please sign in." } as ChatResponse,
      { status: 401 }
    );
  }

  // ── Parse Request Body ───────────────────────────────────────────────────────
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body. Expected JSON." } as ChatResponse,
      { status: 400 }
    );
  }

  const { message, history, documentText, documentTitle } = body;

  if (!message || typeof message !== "string") {
    return Response.json(
      { error: "Message is required." } as ChatResponse,
      { status: 400 }
    );
  }

  if (!documentText) {
    return Response.json(
      { error: "No document selected. Please select a document from the sidebar." } as ChatResponse,
      { status: 400 }
    );
  }

  // ── Build Gemini Request ─────────────────────────────────────────────────────
  try {
    // Get the Gemini 2.5 Flash model
    // We use the system instruction to pass the full document context.
    // Gemini 2.5 Flash supports up to 1M tokens, so full documents fit easily.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: buildSystemPrompt(documentTitle, documentText),
      generationConfig: {
        temperature: 0.1,        // Slightly lower temperature for even more precision
        topP: 0.8,
        maxOutputTokens: 2048,   // Enough for detailed analytical responses
      },
    });

    // Convert our conversation history to Gemini's expected format.
    // Gemini uses "user" and "model" (not "user" and "assistant").
    const geminiHistory: Content[] = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start a chat session with the full conversation history
    const chat = model.startChat({
      history: geminiHistory,
    });

    // Send the latest user message and await the response
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    return Response.json({ text: responseText } as ChatResponse, {
      status: 200,
    });

  } catch (error: unknown) {
    console.error("[ContextOS API Error]", error);

    // Handle specific Gemini API errors gracefully
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    // Check for common API key / quota errors
    if (errorMessage.includes("API_KEY") || errorMessage.includes("invalid")) {
      return Response.json(
        {
          error:
            "AI service configuration error. Please check GEMINI_API_KEY in .env.local.",
        } as ChatResponse,
        { status: 500 }
      );
    }

    if (errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return Response.json(
        {
          error:
            "Gemini API quota exceeded. Please wait a moment and try again.",
        } as ChatResponse,
        { status: 429 }
      );
    }

    return Response.json(
      { error: `AI Error: ${errorMessage}` } as ChatResponse,
      { status: 500 }
    );
  }
}
