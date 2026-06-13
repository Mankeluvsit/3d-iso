/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize GoogleGenAI server-side to handle missing/invalid keys gracefully
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ 
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

const modelId = 'gemini-3.5-flash';

// Define JSON standard goal schemas
const goalSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A short, creative description of the goal from the perspective of city council or citizens."
    },
    targetType: {
      type: Type.STRING,
      enum: ['population', 'money', 'building_count'],
      description: "The metric to track."
    },
    targetValue: {
      type: Type.INTEGER,
      description: "The target numeric value to reach."
    },
    buildingType: {
      type: Type.STRING,
      enum: ['Residential', 'Commercial', 'Industrial', 'Park', 'Road'],
      description: "Required if targetType is 'building_count'."
    },
    reward: {
      type: Type.INTEGER,
      description: "Monetary reward for completion."
    }
  },
  required: ['description', 'targetType', 'targetValue', 'reward']
};

const newsSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "A one-sentence news headline representing life in the city." },
    type: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
  },
  required: ['text', 'type']
};

// API: Generate Goals proxy
app.post('/api/gemini/goal', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: "Gemini client not initialized on server. Check API keys." });
  }

  const { stats, grid } = req.body;

  // Summarize count
  const counts: Record<string, number> = {};
  if (grid && Array.isArray(grid)) {
    grid.flat().forEach((tile: any) => {
      if (tile && tile.buildingType) {
        counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
      }
    });
  }

  const context = `
    Current City Stats:
    Day: ${stats?.day || 1}
    Money: $${stats?.money || 1000}
    Population: ${stats?.population || 0}
    Current Buildings structures on map: ${JSON.stringify(counts)}
  `;

  const prompt = `You are the AI City Advisor for a simulation game. Based on the current city stats, generate a challenging but achievable short-term goal for the player to help the city grow. Return JSON alignment.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: goalSchema,
        temperature: 0.7
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    }
    return res.status(500).json({ error: "Empty model content outcome." });
  } catch (error: any) {
    console.error("Server API Gemini Goal error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Generate News headlines proxy
app.post('/api/gemini/news', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: "Gemini client is uninitialized." });
  }

  const { stats, recentAction } = req.body;
  const context = `City Stats - Pop: ${stats?.population || 0}, Money: ${stats?.money || 1000}, Day: ${stats?.day || 1}. ${recentAction ? `Recent Action: ${recentAction}` : ''}`;
  const prompt = "Generate a very short, isometric-sim-city style news headline based on the city state. Can be funny, cynical, or celebratory. Use JSON format.";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: newsSchema,
        temperature: 1.1
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({
        id: (Date.now() + Math.random()).toString(),
        text: parsed.text,
        type: parsed.type || 'neutral'
      });
    }
    return res.status(500).json({ error: "No news returned." });
  } catch (error: any) {
    console.error("Server API News error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Integrate Vite Middleware
async function startViteServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
  });
}

startViteServer();
