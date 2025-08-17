import React from 'react';

const Intro = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-2xl shadow-sm border`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Start Your Project Journey
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
              Transform your idea into a structured roadmap with AI-powered planning
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 font-bold text-sm">1</span>
            </div>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Describe your vision</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Tell us about your app or website and what you want to achieve.</p>
          </div>
          
          <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 font-bold text-sm">2</span>
            </div>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>AI analyzes requirements</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Our AI processes your input and creates a tailored project plan.</p>
          </div>
          
          <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 font-bold text-sm">3</span>
            </div>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Get your roadmap</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Receive a detailed timeline with actionable tasks to guide you.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;