import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectCreateProps {
  isDarkMode: boolean;
}

export default function ProjectCreate({ isDarkMode }: ProjectCreateProps) {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const projectNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 1) {
      projectNameRef.current?.focus();
    } else if (step === 2) {
      descriptionRef.current?.focus();
    }
  }, [step]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      nextStep();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating project:', { projectName, description });
    navigate('/');
  };

  return (
    <div className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      <div className="max-w-2xl mx-auto">

        {/* Tabs for steps */}
        <div className="flex justify-center mb-8">
          {['Project Details', 'Description', 'Review & Submit'].map((label, index) => (
            <div
              key={index}
              className={`px-4 py-2 cursor-pointer ${step === index + 1 ? 'border-b-2 border-indigo-600' : ''} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              onClick={() => setStep(index + 1)}
            >
              {label}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div>
              <label 
                htmlFor="projectName" 
                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
              >
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                ref={projectNameRef}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`w-full px-4 py-2 rounded-md border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                required
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <label 
                htmlFor="description" 
                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
              >
                Description
              </label>
              <textarea
                id="description"
                ref={descriptionRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={4}
                className={`w-full px-4 py-2 rounded-md border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                required
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Review & Submit</h3>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Review your project details and submit.</p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`px-4 py-2 rounded ${step === 1 ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-500'} text-white`}
            >
              Previous
            </button>
            <button
              type={step === 3 ? 'submit' : 'button'}
              onClick={nextStep}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
            >
              {step === 3 ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 