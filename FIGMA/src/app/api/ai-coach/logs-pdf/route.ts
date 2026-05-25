import { NextResponse } from "next/server";
import { getAILogExportData } from "@/lib/data/ai-logs";
import { createSimpleTextPdf, paginateTextSections } from "@/lib/pdf/simple-text-pdf";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "No metadata";
  }

  const { prompt, provider, model } = metadata as {
    prompt?: unknown;
    provider?: unknown;
    model?: unknown;
  };

  const parts = [
    `Prompt: ${typeof prompt === "string" ? prompt : "n/a"}`,
    `Provider: ${typeof provider === "string" ? provider : "n/a"}`,
    `Model: ${typeof model === "string" ? model : "n/a"}`,
  ];

  return parts.join(" | ");
}

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exportData = await getAILogExportData(supabase, user.id);
    const generatedAt = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const sections = [
      {
        title: "FocusForge AI Logs Summary",
        lines: [
          `Generated at: ${generatedAt}`,
          `User: ${exportData.user.fullName || exportData.user.email}`,
          `Email: ${exportData.user.email}`,
          `Saved AI insights: ${exportData.insights.length}`,
          `AI generation events: ${exportData.generationEvents.length}`,
          "",
          "This report includes recent saved coach insights and the activity log events that recorded AI generation requests.",
        ],
      },
      {
        title: "Saved AI Insights",
        lines:
          exportData.insights.length > 0
            ? exportData.insights.flatMap((insight, index) => [
                `${index + 1}. ${insight.title}`,
                `Created: ${formatDate(insight.created_at)}`,
                insight.body,
                "",
              ])
            : ["No AI insights have been saved yet."],
      },
      {
        title: "AI Generation Activity",
        lines:
          exportData.generationEvents.length > 0
            ? exportData.generationEvents.flatMap((event, index) => [
                `${index + 1}. Generated: ${formatDate(event.created_at)}`,
                formatMetadata(event.metadata),
                "",
              ])
            : ["No AI generation activity has been logged yet."],
      },
    ];

    const pdf = createSimpleTextPdf(paginateTextSections(sections));

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="focusforge-ai-logs.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate AI logs PDF", error);
    return NextResponse.json({ error: "Failed to generate AI logs PDF" }, { status: 500 });
  }
}
