const GEMINI_API_KEY = "AIzaSyCZYVqf90RzkCX2iqcDGevuXlGSied4t24";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const generateInvestigationSteps = async (incidentType) => {
  try {
    const prompt = `Generate a detailed investigation plan for a ${incidentType} case. 
    Provide exactly 5 phases with 8-10 steps each, formatted as a strict JSON array where each object has:
    - "phase": "Phase name (exactly like this format)"
    - "steps": ["array", "of", "steps"]
    
    Example format:
    [
      {
        "phase": "Phase 1: Case Initiation",
        "steps": ["Step 1", "Step 2"]
      }
    ]
    
    Return ONLY the JSON array with NO additional text, explanations, or markdown formatting.`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let textResponse = data.candidates[0].content.parts[0].text;
    
    // Clean the response to extract just the JSON
    try {
      // Remove markdown code blocks if present
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Parse the JSON
      const parsedResponse = JSON.parse(textResponse);
      
      // Validate the structure
      if (!Array.isArray(parsedResponse)) {
        throw new Error("Response is not an array");
      }
      
      if (parsedResponse.length === 0) {
        throw new Error("Empty response array");
      }
      
      if (!parsedResponse[0].phase || !parsedResponse[0].steps) {
        throw new Error("Invalid phase structure");
      }
      
      return parsedResponse;
    } catch (e) {
      console.error("Failed to parse JSON response. Raw response:", textResponse);
      throw new Error(`Failed to parse response: ${e.message}`);
    }
  } catch (error) {
    console.error("Error generating investigation steps:", error);
    throw error;
  }
};