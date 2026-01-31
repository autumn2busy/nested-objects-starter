'use client';

import { useState } from 'react';

export default function TestResumePage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildResume = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      // In production, get real JWT from Outseta
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJ1aWQiOiAidGVzdC11c2VyLTEyMzQ1IiwKICAiQWNjb3VudCI6IHsKICAgICJTdWJzY3JpcHRpb25QbGFuIjogewogICAgICAiVWlkIjogInBybyIKICAgIH0KICB9Cn0K.mock';
      
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockJWT}`,
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to generate resume');
        return;
      }

      setResponse(data.response);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">AI Resume Builder</h1>
      <p className="text-gray-600 mb-6">
        Describe your experience, skills, and the type of role you're targeting.
      </p>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Example: I have 5 years of experience as a property inspector in residential real estate. I&apos;m certified in HUD inspections and have completed over 1,000 inspections. I&apos;m looking to create a resume for senior inspector positions..."
        className="w-full h-48 p-4 border rounded-lg mb-4 font-mono text-sm"
        disabled={loading}
      />
      
      <button
        onClick={buildResume}
        disabled={loading || !prompt.trim()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
      >
        {loading ? 'Building Resume...' : 'Generate Resume Content'}
      </button>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="mt-6 p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Resume Content</h2>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {response}
            </pre>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(response)}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
