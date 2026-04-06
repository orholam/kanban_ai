import React from 'react';
import { Routes, Route } from 'react-router-dom';
import type { Project } from '../types';
import SimpleNewProject from './SimpleNewProject';
import NewProjectAiWizard from './NewProjectAiWizard';

interface NewProjectProps {
  isDarkMode: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function NewProject({ isDarkMode, setProjects }: NewProjectProps) {
  return (
    <Routes>
      <Route index element={<SimpleNewProject isDarkMode={isDarkMode} setProjects={setProjects} />} />
      <Route path="ai" element={<NewProjectAiWizard isDarkMode={isDarkMode} setProjects={setProjects} />} />
    </Routes>
  );
}
