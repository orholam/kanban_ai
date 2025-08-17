import React, { useState, useRef, useEffect } from 'react';
import { CursorComplete } from '../Magic/CursorComplete';
import TypeSelector from './TypeSelector';
import { BookIcon, Brain, Calendar, Smartphone } from 'lucide-react';

interface ProjectDetailsProps {
  isDarkMode: boolean;
  onComplete: (data: { name: string; description: string; keywords: string[]; type: string }) => void;
}

const TYPES = [
  {
      id: 1,
      name: "SaaS App",
      icon: <Smartphone className="w-5 h-5" />,
  },
  {
      id: 2,
      name: "AI Tool",
      icon: <Brain className="w-5 h-5" />,
  },
  {
      id: 3,
      name: "Blog/Website",
      icon: <BookIcon className="w-5 h-5" />,
  },
  {
      id: 4,
      name: "Event Planning",
      icon: <Calendar className="w-5 h-5" />,
  },
];

const RECOMMENDED_STACKS = {
  "SaaS App": [
    {
      name: 'AI Stack',
      stack: ['Bolt.new', 'Cursor', 'Supabase']
    },
    {
      name: 'Full-Stack JavaScript',
      stack: ['React', 'MongoDB', 'Express', 'Node.js']
    }
  ],
  "AI Tool": [
    {
      name: 'AI Stack',
      stack: ['Bolt.new', 'Cursor', 'Supabase']
    },
    {
      name: 'Standalone Script',
      stack: ['Cron Job', 'Python', 'Venv']
    }
  ],
  "Blog/Website": [
    {
      name: 'Classic Stack',
      stack: ['Wordpress', 'Elementor', 'Google Analytics']
    },
    {
      name: 'E-Commerce Stack',
      stack: ['Shopify', 'Stripe', 'Algolia']
    }
  ],
  "Event Planning": [
    {
      name: 'Event Planning Stack',
      stack: ['Eventbrite', 'Google Calendar', 'Google Maps']
    },
    {
      name: 'Wedding Planning',
      stack: ['WithJoy', 'Gmail', 'Google Calendar']
    }
  ]
};

export default function ProjectDetails({ isDarkMode, onComplete }: ProjectDetailsProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [stackItems, setStackItems] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState('');
  const [typeInput, setTypeInput] = useState('SaaS App');

  const projectNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (projectNameRef.current) {
      projectNameRef.current.focus();
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      name: projectName,
      description,
      keywords: stackItems,
      type: typeInput
    });
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Project Details
      </h2>
      
      <form onSubmit={handleSubmit}>
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

        <div className="mt-1">
          <TypeSelector type={typeInput} updateType={setTypeInput} types={TYPES}/>
        </div>

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
            spellCheck={false}
          />
        </div>
          
        {/*
        <div className="mt-4">
          <label 
            htmlFor="description-cursor" 
            className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
          >
            Description (Cursor)
          </label>
          <CursorComplete prompt="Continue the user's thought, extend a single sentence. Do NOT suggest long complex sentences. Continue exactly where the user left off. The user is developing an app and they are writing a description for their app." timeToWait={1500} height={200} />
        </div>
        */}
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
              {RECOMMENDED_STACKS[typeInput as keyof typeof RECOMMENDED_STACKS]?.map((recommendedStack, index) => (
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

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
} 