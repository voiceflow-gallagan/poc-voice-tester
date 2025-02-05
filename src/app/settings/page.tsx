'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, TextInput, Button } from '@tremor/react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [numberId, setNumberId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setApiKey(data.apiKey || '');
      setPhoneNumber(data.testAgentPhoneNumber || '');
      setNumberId(data.numberId || '');
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          testAgentPhoneNumber: phoneNumber,
          numberId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setMessage('Configuration is set up');
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Failed to save configuration');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <h3 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">Settings</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500 dark:text-gray-400">
          Configure your Voiceflow Test Agent settings here.
        </p>
      </div>

      <Card className="dark:bg-gray-800">
        <div className="space-y-6">
          <div>
            <Title className="dark:text-white">Test Agent API Key</Title>
            <TextInput
              className="mt-2 [&>input]:dark:bg-gray-900 [&>input]:dark:text-white [&>input]:dark:placeholder-gray-400 [&>input]:dark:border-gray-600"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div>
            <Title className="dark:text-white">Test Agent Number ID</Title>
            <TextInput
              className="mt-2 [&>input]:dark:bg-gray-900 [&>input]:dark:text-white [&>input]:dark:placeholder-gray-400 [&>input]:dark:border-gray-600"
              value={numberId}
              onChange={(e) => setNumberId(e.target.value)}
            />
            <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter your Voiceflow Test Agent Number ID (found in the outbound API example)
            </Text>
          </div>

          <div>
            <Title className="dark:text-white">Targeted Agent Phone Number</Title>
            <TextInput
              className="mt-2 [&>input]:dark:bg-gray-900 [&>input]:dark:text-white [&>input]:dark:placeholder-gray-400 [&>input]:dark:border-gray-600"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter in E.164 format (e.g., +17828282828). Spaces and dashes will be removed automatically.
            </Text>
          </div>

          <div className="flex items-center justify-between">
            {message && (
              <Text className={message.includes('Failed') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                {message}
              </Text>
            )}
            <Button onClick={saveConfig}>
              Save Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
