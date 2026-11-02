// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { products } from './products.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse incoming JSON payloads

// Initialize Gemini Client
// It automatically looks for GEMINI_API_KEY in the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- VALIDATION SCHEMAS ---

// 1. Validate the incoming user request
const RequestSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters long").max(200)
});

// 2. Validate the AI's response structure
// We force the AI to return an array of objects with an ID and a reason.
const AIResponseSchema = z.object({
  recommendations: z.array(
    z.object({
      id: z.string(),
      reason: z.string()
    })
  )
});

// --- API ROUTE ---

app.post('/api/recommend', async (req, res) => {
  try {
    // 1. Validate Input
    const validation = RequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }
    const { query } = validation.data;

    // 2. Prepare the System Prompt
    // We pass the catalog as JSON so the AI can read it. We explicitly tell it NOT to invent products.
    const systemPrompt = `
      You are a helpful product recommendation assistant.
      You must ONLY recommend products from the provided catalog.
      
      Here is the product catalog:
      ${JSON.stringify(products, null, 2)}
      
      User Query: "${query}"
      
      Return your response in strict JSON format matching this schema:
      {
        "recommendations": [
          { 
            "id": "product_id_here", 
            "reason": "A brief explanation of why this matches the user's needs." 
          }
        ]
      }
      
      If no products match, return an empty array for recommendations.
    `;

    // 3. Call Gemini API
    // We use 'gemini-2.5-flash' for speed and set responseMimeType to JSON
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json', // Forces Gemini to output valid JSON
        temperature: 0.2, // Lower temperature = more deterministic, less hallucination
      }
    });

    // 4. Parse and Validate AI Response
    const aiText = response.text;
    let aiJson;
    
    try {
      aiJson = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI JSON:", aiText);
      return res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
    }

    const aiValidation = AIResponseSchema.safeParse(aiJson);
    if (!aiValidation.success) {
      console.error("AI output didn't match schema:", aiValidation.error);
      return res.status(500).json({ error: "AI returned an unexpected format." });
    }

    // 5. Enrich the AI's response with actual product data
    // This guarantees the frontend gets real prices, names, and descriptions.
    const enrichedRecommendations = aiValidation.data.recommendations
      .map(rec => {
        const productMatch = products.find(p => p.id === rec.id);
        if (!productMatch) return null; // Discard if AI hallucinated an ID
        return {
          ...productMatch,
          reason: rec.reason
        };
      })
      .filter(Boolean); // Remove nulls

    // 6. Send back to frontend
    res.json({ recommendations: enrichedRecommendations });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});