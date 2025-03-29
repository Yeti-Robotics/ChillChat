# ChillChat - Discord Modmail Bot

A Discord bot that handles modmail and anonymous messaging functionality.

## Features

- DM to Modmail: Automatically creates channels for users who DM the bot
- Anonymous Messaging: Allows users to send anonymous messages via slash command
- Persistent Threads: Maintains conversation history in dedicated channels
- Staff Responses: Staff can respond to modmail messages directly

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```
4. Configure your `.env` file with:

   - `DISCORD_TOKEN`: Your bot's token
   - `CLIENT_ID`: Your bot's client ID
   - `GUILD_ID`: The ID of your server
   - `MODMAIL_CATEGORY_ID`: The ID of the category where modmail channels will be created
   - `ANONYMOUS_CHANNEL_ID`: The ID of the channel where anonymous messages will be sent
   - `LOG_CHANNEL_ID` (optional): The ID of a channel for logging

5. Register slash commands:

   ```bash
   npm run build
   node dist/commands.js
   ```

6. Start the bot:
   ```bash
   npm start
   ```

## Development

- Build the project: `npm run build`
- Run in development mode: `npm run dev`
- Watch for changes: `npm run watch`

## Commands

- `/anonymous <message>` - Send an anonymous message to the designated channel

## Requirements

- Node.js 16.9.0 or higher
- Discord.js v14
- TypeScript
