import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectCreateProps {
  isDarkMode: boolean;
}

const RECOMMENDED_STACKS = [
  {
    name: 'AI Stack',
    stack: ['Bolt.new', 'Cursor', 'Supabase']
  },
  {
    name: 'Full-Stack JavaScript',
    stack: ['React', 'MongoDB', 'Express', 'Node.js']
  }
];

export default function ProjectCreate({ isDarkMode }: ProjectCreateProps) {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [stackItems, setStackItems] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState('');
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

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
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

  const handleStackSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && stackInput.trim()) {
      e.preventDefault();
      setStackItems([...stackItems, stackInput.trim()]);
      setStackInput('');
    }
  };

  const removeStackItem = (index: number) => {
    setStackItems(stackItems.filter((_, i) => i !== index));
  };

  const clearStackItems = () => {
    setStackItems([]);
  };

  return (
    <div className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      <div className="max-w-2xl mx-auto">

        {/* Tabs for steps */}
        <div className="flex justify-center mb-8">
          {['Project Details', 'Description', 'Stack', 'Review & Submit'].map((label, index) => (
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
              <label 
                htmlFor="stack" 
                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
              >
                Keywords
              </label>
              <input
                type="text"
                id="stack"
                value={stackInput}
                onChange={(e) => setStackInput(e.target.value)}
                onKeyPress={handleStackSubmit}
                placeholder="Type and press Enter to add to stack"
                className={`w-full px-4 py-2 rounded-md border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
              
              <div className="mt-4 flex flex-wrap gap-2">
                {stackItems.map((item, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-200' 
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeStackItem(index)}
                      className={`ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full ${
                        isDarkMode 
                          ? 'hover:bg-gray-600' 
                          : 'hover:bg-indigo-200'
                      }`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {stackItems.length > 0 && (
                  <button
                    onClick={clearStackItems}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="mt-8">
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
                  Recommended Stacks
                </h4>
                <div className="space-y-3">
                  {RECOMMENDED_STACKS.map((recommendedStack, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border transform transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-700 hover:border-indigo-500 hover:-translate-y-0.5' 
                          : 'border-gray-200 hover:border-indigo-500 hover:-translate-y-0.5'
                      } cursor-pointer hover:shadow-md`}
                      onClick={() => setStackItems([...new Set([...stackItems, ...recommendedStack.stack])])}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {recommendedStack.name}
                        </span>
                        <div className="flex gap-2">
                          {recommendedStack.stack.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isDarkMode 
                                  ? 'bg-gray-700 text-gray-300' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
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
              type={step === 4 ? 'submit' : 'button'}
              onClick={nextStep}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
            >
              {step === 4 ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 