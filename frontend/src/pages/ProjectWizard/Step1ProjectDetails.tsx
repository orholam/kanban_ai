import React, { useState } from 'react';

interface Step1ProjectDetailsProps {
  onNext: (details: { name: string; keywords: string[]; description: string }) => void;
}

const Step1ProjectDetails: React.FC<Step1ProjectDetailsProps> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name || !keywords || !description) {
      setError('All fields are required.');
      return;
    }
    setError('');
    const keywordArray = keywords.split(',').map(keyword => keyword.trim());
    onNext({ name, keywords: keywordArray, description });
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Step 1: Project Details</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label htmlFor="projectName" className="block text-sm font-medium mb-1">
          Project Name
        </label>
        <input
          id="projectName"
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your project name"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="keywords" className="block text-sm font-medium mb-1">
          Keywords (comma-separated)
        </label>
        <input
          id="keywords"
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="e.g., AI, Automation, Productivity"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Project Description
        </label>
        <textarea
          id="description"
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Provide a brief description of your project"
          rows={4}
        />
      </div>
      <button
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        onClick={handleSubmit}
      >
        Next
      </button>
    </div>
  );
};

export default Step1ProjectDetails;
