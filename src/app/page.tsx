'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Title, Text, Button, TextInput, Textarea, Badge } from '@tremor/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAutoResize } from './hooks/useAutoResize';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  persona: z.string().min(1, 'Persona is required'),
  scenario: z.string().min(1, 'Scenario is required'),
  goals: z.string().min(1, 'Goals are required'),
});

type TestFormData = z.infer<typeof testSchema>;

interface Test {
  id: string;
  name: string;
  persona: string;
  scenario: string;
  goals: string[];
}

interface TestResult {
  id: string;
  status: 'running' | 'completed' | 'failed';
  completedGoals: string[];
  failedGoals: string[];
  conversationTurns: {
    speaker: 'agent' | 'tester';
    message: string;
    timestamp: Date;
  }[];
  startTime: Date;
  endTime?: Date;
}

export default function DashboardPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    persona: '',
    scenario: '',
    goals: '',
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    mode: 'onChange'
  });

  const personaRef = useRef<HTMLTextAreaElement>(null);
  const scenarioRef = useRef<HTMLTextAreaElement>(null);
  const goalsRef = useRef<HTMLTextAreaElement>(null);

  const adjustPersonaHeight = useAutoResize(personaRef);
  const adjustScenarioHeight = useAutoResize(scenarioRef);
  const adjustGoalsHeight = useAutoResize(goalsRef);

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      fetchTestResults(selectedTest.id);
    }
  }, [selectedTest]);

  useEffect(() => {
    // Start auto-refresh if there's a running test
    const hasRunningTest = testResults.some(result => result.status === 'running');

    if (hasRunningTest && selectedTest) {
      // Clear any existing interval
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }

      // Set up new interval to refresh every 2 seconds
      const interval = setInterval(() => {
        fetchTestResults(selectedTest.id);
      }, 2000);

      setAutoRefreshInterval(interval);
    } else {
      // Clear interval if no running tests
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [testResults, selectedTest]);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchTestResults = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}/results`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch test results');
      }
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Error fetching test results:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch test results');
    }
  };

  const deleteTestResult = async (testId: string, resultId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}/results/${resultId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete test result');
      }

      // Refresh the test results
      fetchTestResults(testId);
    } catch (error) {
      console.error('Error deleting test result:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete test result');
    }
  };

  const onSubmit = async (data: TestFormData) => {
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/tests/${selectedTest?.id}` : '/api/tests';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          goals: data.goals.split('\n').map((goal) => goal.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error(isEditing ? 'Failed to update test' : 'Failed to create test');
      }

      reset();
      setIsEditing(false);
      setSelectedTest(null);
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      setError(isEditing ? 'Failed to update test' : 'Failed to create test');
    }
  };

  const sanitizePhoneNumber = (phone: string) => {
    // Remove all spaces, dashes, and parentheses
    return phone.replace(/[\s\-()]/g, '');
  };

  const runTest = async (test: Test) => {
    setIsRunning(true);
    setError('');

    try {
      // Create a new test result
      console.log('Creating test result...');
      const resultResponse = await fetch(`/api/tests/${test.id}/results`, {
        method: 'POST',
      });

      if (!resultResponse.ok) {
        const errorData = await resultResponse.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to create test result');
      }

      const resultData = await resultResponse.json();
      console.log('Test result created:', resultData);
      console.log('Result ID for test agent:', resultData.id);

      // Auto-expand the new test result
      setExpandedResults(prev => {
        const newSet = new Set(prev);
        newSet.add(resultData.id);
        return newSet;
      });

      // Make the outbound call
      console.log('Fetching configuration...');
      const configResponse = await fetch('/api/config');
      if (!configResponse.ok) {
        const errorData = await configResponse.json();
        console.error('Config error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch configuration');
      }

      const config = await configResponse.json();
      console.log('Configuration fetched:', { ...config, apiKey: '[REDACTED]' });

      if (!config.apiKey || !config.testAgentPhoneNumber) {
        throw new Error('Please configure the API key and test agent phone number in settings');
      }

      const sanitizedPhoneNumber = sanitizePhoneNumber(config.testAgentPhoneNumber);
      if (!/^\+?[1-9]\d{1,14}$/.test(sanitizedPhoneNumber)) {
        throw new Error('Invalid phone number format. Please check your settings.');
      }

      console.log('Making outbound call...');
      const callResponse = await fetch('/api/outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: sanitizedPhoneNumber,
          apiKey: config.apiKey,
          testId: test.id,
          resultId: resultData.id,
        }),
      });

      const callData = await callResponse.json();
      console.log('Call API response:', callData);

      if (!callResponse.ok) {
        if (callData.details) {
          console.error('Call error details:', callData.details);
        }
        throw new Error(callData.error || `Failed to initiate call: ${callResponse.status} ${callResponse.statusText}`);
      }

      console.log('Call initiated successfully:', callData);

      // Update UI and start auto-refresh
      setSelectedTest(test);
      await fetchTestResults(test.id);
    } catch (error) {
      console.error('Error running test:', error);
      setError(error instanceof Error ? error.message : 'Failed to run test');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleResultExpansion = (resultId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const selectTestForEdit = (test: Test) => {
    console.log('Selecting test for edit:', test);
    setSelectedTest(test);
    setIsEditing(true);
    const formValues = {
      name: test.name,
      persona: test.persona,
      scenario: test.scenario,
      goals: test.goals.join('\n'),
    };
    setFormData(formValues);

    // Set form values using setValue to trigger validation
    Object.entries(formValues).forEach(([key, value]) => {
      setValue(key as keyof TestFormData, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    });

    // Add a small delay to ensure the form data is set before resizing
    setTimeout(() => {
      adjustPersonaHeight();
      adjustScenarioHeight();
      adjustGoalsHeight();
    }, 0);
  };

  const cancelEdit = () => {
    console.log('Canceling edit');
    setIsEditing(false);
    setSelectedTest(null);
    setFormData({
      name: '',
      persona: '',
      scenario: '',
      goals: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setValue(name as keyof TestFormData, value, {
      shouldValidate: true,
    });
  };

  const duplicateTest = async () => {
    console.log('Duplicating test');

    try {
      // Create a copy of the current form data with a modified name
      const duplicatedData = {
        ...formData,
        name: `${formData.name} (Copy)`,
        goals: formData.goals.split('\n').map((goal) => goal.trim()).filter(Boolean),
      };

      // Create a new test with the duplicated data
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate test');
      }

      // Reset the form and fetch updated tests
      setIsEditing(false);
      setSelectedTest(null);
      setFormData({
        name: '',
        persona: '',
        scenario: '',
        goals: '',
      });
      fetchTests();
    } catch (error) {
      console.error('Error duplicating test:', error);
      setError('Failed to duplicate test');
    }
  };

  const deleteTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete test');
      }

      // If we're currently editing this test or viewing its results, reset everything
      if (selectedTest?.id === testId) {
        setIsEditing(false);
        setSelectedTest(null);
        setTestResults([]); // Clear the test results
        setFormData({
          name: '',
          persona: '',
          scenario: '',
          goals: '',
        });
      }

      // Refresh the test list
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      setError('Failed to delete test');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <h3 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">Your Tests</h3>
          <p className="mt-2 max-w-4xl text-sm text-gray-500 dark:text-gray-400">
            Create and manage your voice agent test scenarios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Create/Edit Test Form */}
        <Card className="dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <Title className="dark:text-white">{isEditing ? 'Edit Test' : 'Create New Test'}</Title>
            {isEditing && (
              <div className="flex space-x-2">
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={duplicateTest}
                >
                  Duplicate Test
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={cancelEdit}
                >
                  Cancel Edit
                </Button>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <TextInput
                {...register('name')}
                name="name"
                placeholder="Test name"
                value={formData.name}
                onChange={handleInputChange}
                className="[&>input]:dark:bg-gray-900 [&>input]:dark:text-white [&>input]:dark:placeholder-gray-400 [&>input]:dark:border-gray-600"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Textarea
                {...register('persona')}
                name="persona"
                placeholder="Persona description (e.g., 'You are a young woman named Jessica who says like a lot')"
                value={formData.persona}
                onChange={(e) => {
                  handleInputChange(e);
                  adjustPersonaHeight();
                }}
                ref={personaRef}
                className="dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
              />
              {errors.persona && (
                <p className="text-red-500 text-sm mt-1">{errors.persona.message}</p>
              )}
            </div>

            <div>
              <Textarea
                {...register('scenario')}
                name="scenario"
                placeholder="Test scenario (e.g., 'Order 3 donuts with sprinkles and a coffee')"
                value={formData.scenario}
                onChange={(e) => {
                  handleInputChange(e);
                  adjustScenarioHeight();
                }}
                ref={scenarioRef}
                className="dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
              />
              {errors.scenario && (
                <p className="text-red-500 text-sm mt-1">{errors.scenario.message}</p>
              )}
            </div>

            <div>
              <Textarea
                {...register('goals')}
                name="goals"
                placeholder="Test goals (one per line)"
                value={formData.goals}
                onChange={(e) => {
                  handleInputChange(e);
                  adjustGoalsHeight();
                }}
                ref={goalsRef}
                className="dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
              />
              {errors.goals && (
                <p className="text-red-500 text-sm mt-1">{errors.goals.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                {isEditing ? 'Update Test' : 'Create Test'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Test List */}
        <Card className="dark:bg-gray-800">
          <Title className="dark:text-white">Test Cases</Title>
          <div className="mt-4 space-y-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:border-gray-700"
                onClick={() => {
                  selectTestForEdit(test);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="dark:text-white">{test.name}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {test.scenario.charAt(0).toUpperCase() + test.scenario.slice(1)}
                    </Text>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="xs"
                      loading={isRunning}
                      onClick={(e) => {
                        e.stopPropagation();
                        runTest(test);
                      }}
                    >
                      Run Test
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this test?')) {
                          deleteTest(test.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Test Results */}
      {selectedTest && (
        <Card className="dark:bg-gray-800">
          <Title className="dark:text-white">Test Results for {selectedTest?.name}</Title>
          <div className="mt-4 space-y-6">
            {testResults.map((result) => (
              <div key={result.id} className="rounded-lg border dark:border-gray-700 p-4">
                <div
                  className="flex items-center justify-between mb-4 cursor-pointer"
                  onClick={() => toggleResultExpansion(result.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Badge color={
                      result.status === 'completed' ? 'green' :
                      result.status === 'failed' ? 'red' : 'yellow'
                    }>
                      {result.status}
                    </Badge>
                    <Text className="dark:text-white">
                      Started: {new Date(result.startTime).toLocaleString()}
                    </Text>
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                      {expandedResults.has(result.id) ? '▼' : '▶'}
                    </button>
                  </div>
                  <Button
                    size="xs"
                    variant="secondary"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this test result?')) {
                        deleteTestResult(selectedTest?.id || '', result.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>

                {expandedResults.has(result.id) && (
                  <>
                    <div className="space-y-2">
                      {result.conversationTurns.map((turn, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            turn.speaker === 'agent' ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`rounded-lg px-4 py-3 max-w-[80%] ${
                              turn.speaker === 'agent'
                                ? 'bg-gray-100 dark:bg-gray-700'
                                : 'bg-blue-100 dark:bg-blue-900'
                            }`}
                          >
                            <Text className="dark:text-white whitespace-pre-line">{turn.message}</Text>
                          </div>
                        </div>
                      ))}
                    </div>

                    {result.completedGoals.length > 0 && (
                      <div className="mt-4">
                        <Text className="font-medium dark:text-white">Completed Goals:</Text>
                        <ul className="list-disc list-inside">
                          {result.completedGoals.map((goal, index) => (
                            <li key={index} className="text-green-600 dark:text-green-400">{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.failedGoals && result.failedGoals.length > 0 && (
                      <div className="mt-4">
                        <Text className="font-medium dark:text-white">Failed Goals:</Text>
                        <ul className="list-disc list-inside">
                          {result.failedGoals.map((goal, index) => (
                            <li key={index} className="text-red-600 dark:text-red-400">{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <div className="text-red-600 dark:text-red-400 mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
