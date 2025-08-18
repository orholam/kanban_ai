// This is a right pane that can slide in from the right of the screen. It is an editor for the notes of a project.

import { useState, useEffect, useRef } from 'react';
import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  CodeToggle
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import './NotesEditor.css'

interface NotesEditorProps {
  isOpen?: boolean;
  onToggle?: () => void;
  showToggleButton?: boolean; // New prop to control whether to show the toggle button
  initialNotes?: string;
  onNotesChange?: (newNotes: string) => void;
}

export default function NotesEditor({ isOpen = false, onToggle, showToggleButton = false, initialNotes, onNotesChange }: NotesEditorProps) {
  console.log('initialNotes', initialNotes);

  const [notes, setNotes] = useState(() => {
    try {
      // Use initialNotes prop if provided and not null/undefined, otherwise load from localStorage
      if (initialNotes && initialNotes.trim() !== '') {
        return initialNotes;
      }
      
      const saved = localStorage.getItem('project-notes');
      if (saved && saved.trim() !== '') {
        return saved;
      }
      
      // Simple default that won't cause parsing issues
      return '# Welcome to your notes!\n\nStart writing your project notes here...';
    } catch (error) {
      console.warn('Could not load notes from localStorage:', error);
      return '# Welcome to your notes!\n\nStart writing your project notes here...';
    }
  });

  const [hasError, setHasError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Update notes when initialNotes prop changes
  useEffect(() => {
    if (initialNotes && initialNotes.trim() !== '') {
      setNotes(initialNotes);
    }
  }, [initialNotes]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && editorRef.current && !editorRef.current.contains(event.target as Node)) {
        onToggle?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleChange = (markdown: string) => {
    setNotes(markdown);
    
    // Debounce the save operation
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      // Call the parent callback if provided
      if (onNotesChange) {
        onNotesChange(markdown);
      }
      
      try {
        // Save to localStorage as backup
        localStorage.setItem('project-notes', markdown);
      } catch (error) {
        console.warn('Could not save notes to localStorage:', error);
      }
    }, 1000); // 1 second delay, shorter than TaskModal
  };

  // Handle XrayWrapper errors by catching them early
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message && event.error.message.includes('XrayWrapper')) {
        console.warn('XrayWrapper error detected, this is usually harmless');
        setHasError(false); // Reset error state
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Create portal container for MDXEditor modals
  useEffect(() => {
    // Create portal container if it doesn't exist
    let portalContainer = document.getElementById('mdxeditor-portal-container');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'mdxeditor-portal-container';
      portalContainer.className = 'mdXEditor-root';
      portalContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10000;';
      document.body.appendChild(portalContainer);
    }

    return () => {
      // Clean up portal container when component unmounts
      const container = document.getElementById('mdxeditor-portal-container');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      // Start animation when opening
      setIsAnimating(true);
      // Small delay to ensure DOM is ready for animation
      const timer = setTimeout(() => {
        const element = document.querySelector('.notes-editor-container');
        if (element) {
          element.classList.add('animate-in');
        }
      }, 50); // Increased delay to ensure initial state is rendered
      return () => clearTimeout(timer);
    } else {
      // Handle closing animation
      const element = document.querySelector('.notes-editor-container');
      if (element) {
        element.classList.remove('animate-in');
        element.classList.add('closing');
        // Wait for animation to complete before hiding
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 300); // Match CSS transition duration
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen]);



  // Only show the toggle button if explicitly requested
  if (!isOpen && showToggleButton) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
      >
        📝 Open Notes
      </button>
    );
  }

  // Don't render anything if not open and no toggle button requested
  if (!isOpen && !isAnimating && !showToggleButton) {
    return null;
  }

  if (hasError) {
    return (
      <div 
        className={`fixed right-0 top-0 h-full w-1/2 bg-white border-l border-b border-gray-200 shadow-lg z-40 notes-editor-container ${
          isOpen && isAnimating ? 'animate-in' : isAnimating ? 'closing' : ''
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-b border-gray-200 flex justify-between items-center flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Project Notes</h2>
              <p className="text-sm text-gray-600">Editor encountered an error</p>
            </div>
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Close Notes"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">The notes editor encountered an error.</p>
              <button
                onClick={() => setHasError(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={editorRef}
      className={`fixed right-0 top-0 h-full w-1/2 bg-white border-l border-gray-200 shadow-lg z-50 notes-editor-container ${
        isOpen && isAnimating ? 'animate-in' : isAnimating ? 'closing' : ''
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notes Editor</h2>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            title="Close Notes"
          >
            ✕
          </button>
        </div>
        
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {/* @ts-ignore - MDXEditor has React type compatibility issues */}
          <MDXEditor 
            markdown={notes}
            onChange={handleChange}
            onError={(error: any) => {
              console.warn('MDXEditor error:', error);
              if (error && error.message && error.message.includes('XrayWrapper')) {
                setHasError(true);
              }
            }}
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              tablePlugin(),
              codeBlockPlugin(),
              codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown' } }),
              frontmatterPlugin(),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <CodeToggle />
                    <CreateLink />
                    <BlockTypeSelect />
                    <ListsToggle />
                    <InsertCodeBlock />
                    <InsertTable />
                    <InsertThematicBreak />
                  </>
                )
              })
            ]}
            className="h-full mdXEditor-root"
            contentEditableClassName="p-4 pb-16 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}