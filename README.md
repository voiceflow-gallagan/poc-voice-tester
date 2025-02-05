# Voice Agent Tester

A web application for testing Voiceflow voice agents through automated test scenarios. This application allows you to create test cases with specific personas and goals, then execute them by making outbound calls to your voice agent.

## Features

- Configure Voiceflow agent settings (API key and test agent phone number)
- Create and manage test scenarios with personas and goals
- Run tests by making outbound calls to your voice agent
- View test results and conversation history in real-time
- Track completed goals and test status

## Prerequisites

- Node.js 18 or later
- Voiceflow account with a voice agent
- Phone number for the test agent

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd voice-agent-tester
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technology Stack

- Next.js 14
- React 18
- Prisma (SQLite database)
- TypeScript
- Tailwind CSS
- Tremor UI Components

## Usage

1. **Configure Settings**
   - Go to the Settings page
   - Enter your Voiceflow agent API key
   - Enter the phone number for the test agent

2. **Create Test Cases**
   - On the dashboard, use the "Create New Test" form
   - Provide a test name, persona description, scenario, and goals
   - Goals should be entered one per line

3. **Run Tests**
   - Click "Run Test" on any test case
   - The application will initiate an outbound call to your test agent
   - View the conversation and test results in real-time

4. **View Results**
   - Click on any test to view its results
   - See the conversation history between the agent and tester
   - Track completed goals and test status

## API Endpoints

### Configuration
- `GET /api/config` - Get current configuration
- `POST /api/config` - Update configuration

### Tests
- `GET /api/tests` - List all tests
- `POST /api/tests` - Create a new test
- `GET /api/tests/[id]` - Get test details
- `PUT /api/tests/[id]` - Update test
- `DELETE /api/tests/[id]` - Delete test
- `GET /api/tests/[id]/config` - Get test configuration

### Current Test
- `GET /api/current-test` - Get currently running test
- `POST /api/outbound-call` - Initiate an outbound call for testing

### Test Results
- `GET /api/tests/:id/results` - Get test results
- `POST /api/tests/:id/results` - Create new test result
- `PUT /api/tests/:id/results` - Update test result

### Conversation Turns
- `GET /api/tests/:id/results/:resultId/turns` - Get conversation turns
- `POST /api/tests/:id/results/:resultId/turns` - Add conversation turn

