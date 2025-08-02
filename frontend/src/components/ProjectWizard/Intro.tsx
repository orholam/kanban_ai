import React from 'react';

const Intro = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-lg border border-indigo-100/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-md">
            <span className="text-lg">🚀</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Start Your Project Journey
          </h1>
          <p className="text-lg text-gray-600">
            Transform your app or website idea into a structured roadmap with AI-powered planning
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1 text-sm">Describe your vision</h3>
                <p className="text-gray-600 text-sm">Tell us about your app or website - what it should do, who it's for, and any specific features you want.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1 text-sm">AI analyzes your requirements</h3>
                <p className="text-gray-600 text-sm">Our AI processes your input and creates a comprehensive project plan tailored to your needs.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1 text-sm">Get your roadmap</h3>
                <p className="text-gray-600 text-sm">Receive a detailed multi-week timeline with actionable tasks to guide you from start to finish.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;