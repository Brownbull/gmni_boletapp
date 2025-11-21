// Validate required Gemini environment variable
if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error(
        'Missing required environment variable: VITE_GEMINI_API_KEY. ' +
        'Please check your .env file and ensure VITE_GEMINI_API_KEY is set.'
    );
}

export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash-preview-09-2025";
