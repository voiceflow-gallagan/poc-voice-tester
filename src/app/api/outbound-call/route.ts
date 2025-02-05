import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

type Config = {
  numberId?: string;
};

export async function POST(request: Request) {
  try {
    const { phoneNumber, apiKey } = await request.json();

    if (!phoneNumber || !apiKey) {
      console.error('Missing required parameters:', { phoneNumber: !!phoneNumber, apiKey: !!apiKey });
      return NextResponse.json(
        { error: 'Phone number and API key are required' },
        { status: 400 }
      );
    }

    // Get the current config to get the number ID
    const config = await prisma.agentConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    }) as Config;

    if (!config?.numberId) {
      console.error('Number ID not found in configuration');
      return NextResponse.json(
        { error: 'Number ID not configured. Please set it up in settings.' },
        { status: 400 }
      );
    }

    console.log('Making outbound call to Voiceflow API...', { phoneNumber });

    const response = await fetch(
      `https://runtime-api.voiceflow.com/v1alpha1/phone-number/${config.numberId}/outbound`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          variables: {},
        }),
      }
    );

    console.log('Voiceflow API response status:', response.status);

    const responseText = await response.text();
    console.log('Voiceflow API response text:', responseText);

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error('Failed to parse response JSON:', e);
      return NextResponse.json(
        { error: `Invalid response from Voiceflow API: ${responseText}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Voiceflow API error:', responseData);
      return NextResponse.json(
        {
          error: responseData?.error || `Failed to initiate call: ${response.status} ${response.statusText}`,
          details: responseData
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData || { message: 'Call initiated successfully' });
  } catch (error) {
    console.error('Error making outbound call:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to make outbound call',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
