export interface AgentConfig {
  apiKey: string;
  testAgentPhoneNumber: string;
  updatedAt: Date;
}

export interface Test {
  id: string;
  name: string;
  persona: string;
  scenario: string;
  goals: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationTurn {
  id: string;
  testResultId: string;
  speaker: 'agent' | 'tester';
  message: string;
  timestamp: Date;
}

export interface TestResult {
  id: string;
  testId: string;
  status: 'running' | 'completed' | 'failed';
  completedGoals: string[];
  conversationTurns: ConversationTurn[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}
