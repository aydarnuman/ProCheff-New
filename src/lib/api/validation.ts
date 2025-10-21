import { NextRequest } from "next/server";
import { z } from "zod";

export interface ValidationError {
  message: string;
  path?: (string | number)[];
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  code?: string;
  errors?: ValidationError[];
}

export function createApiResponse<T>(
  success: boolean,
  data: T | null,
  message: string,
  code?: string,
  errors?: ValidationError[]
): ApiResponse<T> {
  return {
    success,
    data,
    message,
    code,
    errors,
  };
}

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<
  { success: true; data: T } | { success: false; errors: ValidationError[] }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error.issues };
    }
  } catch {
    return { success: false, errors: [{ message: "Invalid JSON" }] };
  }
}
