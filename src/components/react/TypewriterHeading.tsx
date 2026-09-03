import { useEffect, useState } from 'react';

const PROMPTS = [
  'What are you studying now?',
  'Need help with Physics, Math, or Chemistry?',
  'Paste a question or upload a photo of your page...',
  'Step-by-step reasoning for any homework problem...',
  'Generate revision notes and visual mindmaps...',
];

export default function TypewriterHeading() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PROMPTS.length);
        setFade(true);
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-7 overflow-hidden">
      <p
        className={`text-sm font-semibold tracking-wide text-brand transition-opacity duration-300 ${
          fade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
      >
        {PROMPTS[index]}
      </p>
    </div>
  );
}
