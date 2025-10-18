import { getClientIP, rateLimit } from "@/lib/middleware/rateLimit";
import { log } from "@/lib/utils/logger";
import { fail, ok } from "@/lib/utils/response";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Claude API Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022"; // Latest stable model

export async function POST(req: Request) {
  try {
    // Rate limiting kontrolü
    const ip = getClientIP(req);
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(fail("Çok fazla Claude isteği. Dakikada 5 adet sınırı.", 429));
    }

    if (!ANTHROPIC_API_KEY) {
      log.error("ANTHROPIC_API_KEY bulunamadı");
      return NextResponse.json(fail("Claude API anahtarı yapılandırılmamış", 500));
    }

    const body = await req.json();
    const { prompt, context } = body;

    if (!prompt) {
      return NextResponse.json(fail("Prompt gerekli", 400));
    }

    log.info("Claude API çağrısı başlatılıyor", { 
      model: CLAUDE_MODEL,
      promptLength: prompt.length 
    });

    // Claude API çağrısı
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        temperature: 0.1,
        system: "Sen ProCheff'in AI uzmanısın. Türk mutfağı, maliyet analizi ve menü optimizasyonu konularında derin bilgiye sahipsin.",
        messages: [
          {
            role: "user",
            content: context ? `Context: ${context}\n\nSoru: ${prompt}` : prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("Claude API hatası", { 
        status: response.status, 
        error: errorText 
      });
      
      if (response.status === 401) {
        return NextResponse.json(fail("Claude API anahtarı geçersiz", 401));
      }
      if (response.status === 429) {
        return NextResponse.json(fail("Claude API rate limit aşıldı", 429));
      }
      
      return NextResponse.json(fail("Claude API yanıt vermedi", 500));
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      log.error("Claude API geçersiz yanıt formatı", { data });
      return NextResponse.json(fail("Claude'dan geçersiz yanıt alındı", 500));
    }

    const claudeResponse = data.content[0].text;

    log.info("Claude API başarılı", { 
      responseLength: claudeResponse.length,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0
    });

    return NextResponse.json(ok({
      response: claudeResponse,
      model: CLAUDE_MODEL,
      tokensUsed: data.usage || null,
      timestamp: new Date().toISOString(),
    }));

  } catch (error: any) {
    log.error("Claude API genel hatası", error);
    return NextResponse.json(fail("Claude API çağrısında hata oluştu: " + error.message, 500));
  }
}

// Health check endpoint
export async function GET() {
  try {
    const hasApiKey = !!ANTHROPIC_API_KEY;
    
    return NextResponse.json(ok({
      status: "Claude API endpoint hazır",
      model: CLAUDE_MODEL,
      hasApiKey,
      timestamp: new Date().toISOString(),
    }));
  } catch (error: any) {
    return NextResponse.json(fail("Health check hatası: " + error.message, 500));
  }
}
