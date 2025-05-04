# OpenRouter Chat

OpenRouter Chat is a chat application that allows you to interact with various AI models. It is built using Next.js and TypeScript, and it leverages the OpenRouter API to provide a seamless chat experience.

![OpenRouter Chat Screenshot](https://github.com/user-attachments/assets/b8a8259a-a062-4c6e-aa88-8dea4f623862)

## Getting Started

To get started with OpenRouter Chat, follow these steps:

```bash
# Clone the repository
git clone https://github.com/azdanov/openrouter-chat.git
cd openrouter-chat

# Install dependencies
pnpm install

# Create a .env file and update the secrets
cp .env.example .env

# Modify the src/app/auth.ts file to use your GitHub username
cat src/app/auth.ts

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the app.

## Features

- Chat with OpenRouter API LLMs
- User authentication with GitHub OAuth
- Client-side storage for chat history with IndexedDB
