declare module 'react-textarea-autosize' {
  import { TextareaHTMLAttributes } from 'react';

  export interface TextareaAutosizeProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    minRows?: number;
    maxRows?: number;
  }

  const TextareaAutosize: React.ForwardRefExoticComponent<TextareaAutosizeProps & React.RefAttributes<HTMLTextAreaElement>>;
  export default TextareaAutosize;
} 