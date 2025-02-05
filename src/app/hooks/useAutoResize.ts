import { useEffect, RefObject } from 'react';

export const useAutoResize = (textAreaRef: RefObject<HTMLTextAreaElement>) => {
  const adjustHeight = () => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [textAreaRef]);

  return adjustHeight;
};
