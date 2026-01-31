'use client';

import { useState } from 'react';
import { generateResumePDF } from '@/lib/pdf-generator';

export default function PreviewAndGeneratePage() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  
  // Assume resume_data is collected from previous steps and stored in state/context
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    try {
      // Get JWT from Outseta
      const jwt = await window.Outseta.getAccessToken();
      
      // Get resume_data from your form state/context
      const resume_data = {
        contact: formState.contact,
        target_roles: formState.targetRoles,
        experience: formState.experience,
        education: formState.education,
        certifications: formState.certifications,
        skills: formState.skills,
        equipment: formState.equipment,
        coverage: formState.coverage,
        availability: formState.availability
      };

      // Call API
      const response = await fetch('/api/ai/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ resume_data }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate resume');
        return;
      }

      // Store resume content
      setResumeContent(data.resume_content);
      
      // Auto-download PDF
      await generateResumePDF(data.resume_content, resume_data.contact.name);
      
    } catch (err) {
      console.error('Generation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Review & Generate Resume</h1>
      
      {/* Preview of collected data */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Your Information</h2>
        {/* Display collected form data */}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
      >
        {generating ? 'Generating Your Resume...' : 'Generate AI-Optimized Resume'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {resumeContent && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium mb-2">✓ Resume Generated Successfully!</p>
          <p className="text-green-700">Your resume has been downloaded as a PDF.</p>
          <button
            onClick={() => generateResumePDF(resumeContent, formState.contact.name)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download Again
          </button>
        </div>
      )}
    </div>
  );
}
