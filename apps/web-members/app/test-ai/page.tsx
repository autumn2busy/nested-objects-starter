
'use client';

import { useState } from 'react';

export default function TestAIPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testConcierge = async () => {
    setLoading(true);
    try {
      // In production, this would use real Outseta JWT
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse('Error: ' + error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test AI Concierge</h1>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask the AI concierge..."
        className="w-full h-32 p-4 border rounded mb-4"
      />
      
      <button
        onClick={testConcierge}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>
      
      {response && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {response}
        </pre>
      )}
    </div>
  );
}
