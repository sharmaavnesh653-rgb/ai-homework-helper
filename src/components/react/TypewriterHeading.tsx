import { useEffect, useState } from 'react';

const PROMPTS = [
  'What are you studying now?',
  'Solve complex Calculus & Physics problems...',
  'Generate instant visual concept mindmaps...',
  'Prepare active-recall flashcard decks...',
  'Extract chapter summaries from textbooks...',
];

export default function TypewriterHeading() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = PROMPTS[promptIndex];

    const handleTyping = () => {
      if (!isDeleting) {
        if (currentText.length < fullText.length) {
          setCurrentText(fullText.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2500);
          return;
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(fullText.slice(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
        }
      }
    };

    const speed = isDeleting ? 30 : 60;
    const timer = setTimeout(handleTyping, speed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, promptIndex]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-4">
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink min-h-[3.5rem] sm:min-h-[4.5rem] flex items-center justify-center">
        <span className="bg-gradient-to-r from-brand via-emerald-600 to-teal-500 bg-clip-text text-transparent">
          {currentText}
        </span>
        <span className="ml-1 inline-block w-1.5 h-8 sm:h-12 bg-brand animate-pulse rounded-full" />
      </h1>
      <p className="mt-3 text-sm sm:text-base text-ink-2 max-w-2xl">
        Stepwise AI breaks down tough homework into step-by-step reasoning, formulas, and visual concept maps.
      </p>
    </div>
  );
}
