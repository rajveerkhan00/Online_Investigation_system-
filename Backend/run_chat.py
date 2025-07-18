# run_chat.py

from gemini_chat_backend import init_chat, get_gemini_response

# Replace this with your actual Gemini API key
API_KEY = "your-gemini-api-key-here"

def run_chat():
    init_chat(API_KEY)
    print("🤖 Gemini Chatbot initialized! Type 'exit' to quit.\n")

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("🤖 Gemini: Goodbye!")
            break

        response = get_gemini_response(user_input)
        print("🤖 Gemini:", response)

if __name__ == "__main__":
    run_chat()
