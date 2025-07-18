
# gemini_chat_backend.py

import google.generativeai as genai

# Configure Gemini with your API key
def configure_gemini(api_key):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-pro").start_chat()

# Global variable to hold chat session
chat_session = None

def init_chat(api_key):
    global chat_session
    chat_session = configure_gemini(api_key)

# Send user message to Gemini and return response
def get_gemini_response(user_message):
    global chat_session
    if not chat_session:
        raise RuntimeError("Chat session not initialized. Call init_chat(api_key) first.")
    
    try:
        response = chat_session.send_message(user_message)
        return response.text.strip()
    except Exception as e:
        return f"Error communicating with Gemini API: {str(e)}"
