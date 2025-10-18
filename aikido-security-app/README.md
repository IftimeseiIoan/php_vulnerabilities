# Environment Setup

## Required: Create .env file

You must create a `.env` file with the values provided in `.env.example`.

```bash
# Copy the example environment file
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and fill in your actual values:

```env
# Aikido API Configuration
AIKIDO_CLIENT_ID=your_actual_client_id
AIKIDO_CLIENT_SECRET=your_actual_client_secret

# OpenAI API Configuration  
OPENAI_API_KEY=your_actual_openai_api_key

# Server Configuration
PORT=3001
```
