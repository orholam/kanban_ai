import React, { useEffect, useState, useRef } from 'react';
import { generateProjectPlan, generateProjectOverview } from '../../lib/openai';
import WeekOverview from './WeekOverview';
import StreamingContent from './StreamingContent';

interface ProjectReviewPlanProps {
  isDarkMode: boolean;
  projectData: {
    name: string;
    description: string;
    keywords: string[];
    type: string;
  };
  onComplete: (plan: string) => void;
}

interface Week {
  title: string;
  description: string;
}

export default function ProjectReviewPlan({ isDarkMode, projectData, onComplete }: ProjectReviewPlanProps) {
  const [weekPlan, setWeekPlan] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchController = useRef(false);
  const [streamingData, setStreamingData] = useState<ReadableStream<Uint8Array> | null>(null);

  useEffect(() => {
    if (fetchController.current) return;
    fetchController.current = true;

    const fetchData = async () => {
      try {
        // Start the streaming overview
        const overviewStream = await generateProjectOverview({
          name: projectData.name,
          description: projectData.description,
          keywords: projectData.keywords,
          projectType: projectData.type
        });
        setStreamingData(overviewStream);

        // Generate the weekly plan
        console.log("generating project plan");
        const data = await generateProjectPlan({
          name: projectData.name,
          description: projectData.description,
          keywords: projectData.keywords,
          projectType: projectData.type
        });
        const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        setWeekPlan(args.weeks);
        setLoading(false);
      } catch (error) {
        console.error('Failed to generate plan:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [projectData]);

  const handleAcceptPlan = () => {
    onComplete(JSON.stringify(weekPlan));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-8">
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Project Plan Review
      </h2>
      
      {/* Project Overview Section */}
        <div className="mb-8">
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Project Overview
          </h3>
          <StreamingContent 
            stream={streamingData || new ReadableStream({ start(controller) { controller.close(); } })}
            isDarkMode={isDarkMode}
            scrollToBottom={false}
            className="min-h-[300px] max-h-[400px] p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          />
        </div>

      {/* Weekly Plan Section */}
      {loading ? (
        <div className={`animate-pulse ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        Generating project plan...
      </div>
      ) : (
        <>
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Weekly Breakdown
            </h3>
            <div className={`whitespace-pre-wrap mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <WeekOverview weeks={weekPlan} isDarkMode={isDarkMode} />
            </div>
          </div>
          <button
            onClick={handleAcceptPlan}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
          >
            Accept Plan
          </button>
        </>
      )}
    </div>
  );
}
