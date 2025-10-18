/**
 * ProCheff API Request Validation Schemas
 * Zod ile güçlü tip doğrulaması
 */

import { z } from "zod";

// Base validation helpers
const positiveNumber = z.number().positive().finite();
const nonEmptyString = z.string().min(1).trim();

/**
 * Menu Analysis Request Schema
 */
export const MenuAnalysisSchema = z.object({
  text: nonEmptyString
    .max(10000, "Menü metni 10,000 karakter limitini aşamaz")
    .refine((text) => text.split("\n").length >= 2, "Menü en az 2 satır içermelidir"),
});

export type MenuAnalysisRequest = z.infer<typeof MenuAnalysisSchema>;

/**
 * Offer Calculation Request Schema
 */
export const OfferCalculationSchema = z.object({
  materialCost: positiveNumber.max(1000000, "Malzeme maliyeti 1,000,000 TL limitini aşamaz"),
  laborCost: positiveNumber.max(500000, "İşçilik maliyeti 500,000 TL limitini aşamaz"),
  overheadRate: z
    .number()
    .min(0, "Genel gider oranı negatif olamaz")
    .max(1, "Genel gider oranı %100'ü aşamaz"),
  profitMargin: z.number().min(0, "Kâr marjı negatif olamaz").max(1, "Kâr marjı %100'ü aşamaz"),
});

export type OfferCalculationRequest = z.infer<typeof OfferCalculationSchema>;

/**
 * Market Price Request Schema
 */
export const MarketPriceSchema = z.object({
  market: z
    .enum(["a101", "bim", "migros", "sok", "all"], {
      errorMap: () => ({
        message: "Geçerli market seçenekleri: a101, bim, migros, sok, all",
      }),
    })
    .optional()
    .default("all"),
  category: z
    .enum(["protein", "carb", "fat", "all"], {
      errorMap: () => ({
        message: "Geçerli kategori seçenekleri: protein, carb, fat, all",
      }),
    })
    .optional()
    .default("all"),
});

export type MarketPriceRequest = z.infer<typeof MarketPriceSchema>;

/**
 * File Upload Schema (multipart/form-data için)
 */
export const FileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Geçerli bir dosya yüklenmelidir" })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      "Dosya boyutu 10MB'ı aşamaz"
    )
    .refine((file) => file.type === "application/pdf", "Sadece PDF dosyaları desteklenir"),
});

export type FileUploadRequest = z.infer<typeof FileUploadSchema>;

/**
 * Pipeline Request Schema
 */
export const PipelineSchema = z.object({
  materialCost: positiveNumber.optional(),
  laborCost: positiveNumber.optional(),
  overheadRate: z.number().min(0).max(1).optional().default(0.15),
  profitMargin: z.number().min(0).max(1).optional().default(0.2),
});

export type PipelineRequest = z.infer<typeof PipelineSchema>;

/**
 * Generic validation error handler
 */
export function handleValidationError(error: z.ZodError) {
  const messages = error.errors.map((err) => {
    const path = err.path.join(".");
    return `${path}: ${err.message}`;
  });

  return {
    success: false,
    error: {
      message: "Validation failed",
      code: 400,
      type: "VALIDATION_ERROR",
      details: messages,
    },
  };
}

/**
 * Validation middleware wrapper
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: Request, ...args: any[]) => Promise<Response>
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      let data: any;

      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await request.json();
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      } else {
        // Query parameters için
        const url = new URL(request.url);
        data = Object.fromEntries(url.searchParams.entries());
      }

      const validatedData = schema.parse(data);
      return await handler(validatedData, request, ...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify(handleValidationError(error)), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Diğer hatalar için
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Request parsing failed",
            code: 400,
            type: "PARSE_ERROR",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}
