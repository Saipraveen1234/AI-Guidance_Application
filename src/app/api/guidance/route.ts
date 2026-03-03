import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. It automatically picks up the GEMINI_API_KEY from environment variables.
const ai = new GoogleGenAI();

export async function POST(req: NextRequest) {
  try {
    const { imageContent, textContent } = await req.json();

    if (!textContent && !imageContent) {
      return NextResponse.json(
        { error: 'Provide at least text or an image' },
        { status: 400 }
      );
    }

    // Prepare exactly what we send to Gemini
    const contents: any[] = [];

    // 1. Add System Instructions (Prompt Engineering)
    const systemPrompt = `You are an expert AI physical task guide. 
    You are looking through the camera of a worker. 
    They will ask you questions or what to do next. 
    Look at the provided image frame to understand their physical context.
    - Be EXTREMELY concise. You are speaking into their ear.
    - Give short, actionable, one-sentence instructions.
    - Do not say "Based on the image". Just give the instruction or answer.
    - If you see a danger, warn them immediately.
    - If you don't know, say "I can't clearly see that. Can you get closer?"`;
    
    contents.push(systemPrompt);

    // 2. Add the Image Frame (if we captured one)
    if (imageContent) {
      contents.push({
        inlineData: {
          data: imageContent, // The raw base64 string
          mimeType: 'image/jpeg',
        },
      });
    }

    // 3. Add the user's transcribed voice query
    if (textContent) {
      contents.push(textContent);
    }

    // Call Gemini 1.5 Flash (best for speed/latency)
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        temperature: 0.2, // Keep it factual and direct
      }
    });

    const aiTextResponse = response.text || "I'm not sure what I'm looking at.";

    return NextResponse.json({
      instruction: aiTextResponse,
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process guidance request.' },
      { status: 500 }
    );
  }
}
