/**
 * Curriculum data: grades, subjects, textbooks and chapters.
 *
 * Kept as plain data so the pickers, the notes workspace and the API prompts
 * all read from one source. Swap this for a database later without touching UI.
 */

export type SubjectId =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'english'
  | 'geography'
  | 'cs';

export interface Subject {
  id: SubjectId;
  name: string;
  /** Tailwind token suffix -> text-subj-math etc. */
  hue: string;
  blurb: string;
  /** Simple inline glyph so we ship no icon dependency. */
  glyph: string;
}

export const SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', hue: 'subj-math', glyph: '∑', blurb: 'Algebra, geometry, calculus, statistics' },
  { id: 'physics', name: 'Physics', hue: 'subj-physics', glyph: '⚛', blurb: 'Motion, forces, energy, electricity, waves' },
  { id: 'chemistry', name: 'Chemistry', hue: 'subj-chem', glyph: '⚗', blurb: 'Bonding, reactions, moles, organic chemistry' },
  { id: 'biology', name: 'Biology', hue: 'subj-bio', glyph: '🧬', blurb: 'Cells, genetics, human body, ecology' },
  { id: 'history', name: 'History', hue: 'subj-history', glyph: '🏛', blurb: 'Sources, causes, consequences, essays' },
  { id: 'english', name: 'English', hue: 'subj-english', glyph: '✎', blurb: 'Close reading, essays, grammar, poetry' },
  { id: 'geography', name: 'Geography', hue: 'subj-geo', glyph: '🌍', blurb: 'Landforms, climate, population, maps' },
  { id: 'cs', name: 'Computer Science', hue: 'subj-cs', glyph: '⌘', blurb: 'Algorithms, data structures, code tracing' },
];

export function subjectById(id: string | null | undefined): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export const GRADES = [
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'University — year 1',
] as const;

export type Grade = (typeof GRADES)[number];

export interface Book {
  id: string;
  name: string;
  publisher: string;
  chapters: string[];
}

/**
 * Textbooks per subject. Chapter lists are the unit the notes generator works
 * from, so they're deliberately specific rather than vague topic names.
 */
export const BOOKS: Record<SubjectId, Book[]> = {
  math: [
    {
      id: 'math-core',
      name: 'Core Mathematics',
      publisher: 'General syllabus',
      chapters: [
        'Number systems and surds',
        'Linear equations and inequalities',
        'Quadratic equations',
        'Simultaneous equations',
        'Sequences and series',
        'Coordinate geometry',
        'Trigonometric ratios and identities',
        'Differentiation basics',
        'Integration basics',
        'Probability and statistics',
      ],
    },
    {
      id: 'math-adv',
      name: 'Advanced Mathematics',
      publisher: 'General syllabus',
      chapters: [
        'Functions and graphs',
        'Logarithms and exponentials',
        'Vectors in two and three dimensions',
        'Matrices and determinants',
        'Complex numbers',
        'Techniques of integration',
        'Differential equations',
      ],
    },
  ],
  physics: [
    {
      id: 'phys-core',
      name: 'Foundations of Physics',
      publisher: 'General syllabus',
      chapters: [
        'Measurement and units',
        'Kinematics: motion in a straight line',
        "Newton's laws of motion",
        'Work, energy and power',
        'Momentum and collisions',
        'Circular motion and gravitation',
        'Waves and sound',
        'Light, reflection and refraction',
        'Electric circuits',
        'Magnetism and induction',
        'Thermodynamics and heat',
      ],
    },
  ],
  chemistry: [
    {
      id: 'chem-core',
      name: 'Principles of Chemistry',
      publisher: 'General syllabus',
      chapters: [
        'Atomic structure',
        'Periodic table and periodicity',
        'Chemical bonding',
        'The mole concept and stoichiometry',
        'States of matter and gas laws',
        'Acids, bases and salts',
        'Redox reactions',
        'Chemical equilibrium',
        'Reaction rates',
        'Thermochemistry',
        'Introduction to organic chemistry',
      ],
    },
  ],
  biology: [
    {
      id: 'bio-core',
      name: 'Essential Biology',
      publisher: 'General syllabus',
      chapters: [
        'Cell structure and function',
        'Cell division: mitosis and meiosis',
        'Transport in cells: diffusion and osmosis',
        'Enzymes',
        'Photosynthesis',
        'Respiration',
        'Human digestive system',
        'Circulatory system',
        'Nervous system and reflexes',
        'Genetics and inheritance',
        'Evolution and natural selection',
        'Ecosystems and nutrient cycles',
      ],
    },
  ],
  history: [
    {
      id: 'hist-mod',
      name: 'The Modern World',
      publisher: 'General syllabus',
      chapters: [
        'Causes of the First World War',
        'The Treaty of Versailles',
        'The rise of totalitarian regimes',
        'The Second World War: key turning points',
        'The Cold War: origins and division',
        'Decolonisation and independence movements',
        'Civil rights movements',
        'Working with primary sources',
      ],
    },
  ],
  english: [
    {
      id: 'eng-core',
      name: 'English Language and Literature',
      publisher: 'General syllabus',
      chapters: [
        'Close reading and annotation',
        'Analysing poetry: form and imagery',
        'Prose analysis: narrative voice',
        'Writing a thesis statement',
        'Structuring an analytical essay',
        'Using and embedding quotations',
        'Persuasive and rhetorical devices',
        'Grammar, punctuation and clarity',
      ],
    },
  ],
  geography: [
    {
      id: 'geo-core',
      name: 'Physical and Human Geography',
      publisher: 'General syllabus',
      chapters: [
        'Plate tectonics and landforms',
        'Rivers and erosion',
        'Weather and climate systems',
        'Ecosystems and biomes',
        'Population and migration',
        'Urbanisation and settlement',
        'Resources and sustainability',
        'Map skills and interpretation',
      ],
    },
  ],
  cs: [
    {
      id: 'cs-core',
      name: 'Computer Science Fundamentals',
      publisher: 'General syllabus',
      chapters: [
        'Number bases and binary',
        'Data representation',
        'Algorithms and pseudocode',
        'Selection and iteration',
        'Arrays and lists',
        'Searching algorithms',
        'Sorting algorithms',
        'Functions and modularity',
        'Databases and SQL basics',
        'Networks and the internet',
      ],
    },
  ],
};

export function booksFor(subject: SubjectId | null | undefined): Book[] {
  return subject ? (BOOKS[subject] ?? []) : [];
}

/** Example questions, used on the landing page and as composer starters. */
export interface Example {
  subject: SubjectId;
  question: string;
  /** Short label for chips. */
  label: string;
}

export const EXAMPLES: Example[] = [
  {
    subject: 'math',
    label: 'Solve a quadratic',
    question: 'Solve x² − 5x + 6 = 0 and explain which method you chose and why.',
  },
  {
    subject: 'math',
    label: 'Differentiate',
    question: 'Differentiate y = 3x²·sin(x) and show which rule applies at each step.',
  },
  {
    subject: 'physics',
    label: 'Projectile motion',
    question:
      'A ball is thrown at 20 m/s at 30° above the horizontal. Find its maximum height and total range. Take g = 9.8 m/s².',
  },
  {
    subject: 'physics',
    label: 'Circuit analysis',
    question:
      'Two resistors, 4 Ω and 6 Ω, are connected in parallel across a 12 V battery. Find the total current drawn.',
  },
  {
    subject: 'chemistry',
    label: 'Balance an equation',
    question: 'Balance the equation for the combustion of propane and explain how you tracked each element.',
  },
  {
    subject: 'chemistry',
    label: 'Mole calculation',
    question: 'How many grams of NaCl are needed to make 250 mL of a 0.5 mol/dm³ solution?',
  },
  {
    subject: 'biology',
    label: 'Osmosis',
    question:
      'Explain what happens to a plant cell placed in a concentrated sugar solution, and name the process at each stage.',
  },
  {
    subject: 'biology',
    label: 'Punnett square',
    question:
      'Two heterozygous parents (Bb) are crossed. Show the Punnett square and give the phenotype ratio.',
  },
  {
    subject: 'history',
    label: 'Essay structure',
    question:
      'How far was the Treaty of Versailles responsible for political instability in Germany in the 1920s?',
  },
  {
    subject: 'english',
    label: 'Check my thesis',
    question:
      'Check my thesis statement: "In Macbeth, Shakespeare shows that ambition is bad and it ruins people."',
  },
  {
    subject: 'geography',
    label: 'Landform formation',
    question: 'Explain how a waterfall forms and then retreats to create a gorge.',
  },
  {
    subject: 'cs',
    label: 'Trace an algorithm',
    question:
      'Trace a binary search for the value 23 in the list [4, 8, 15, 16, 23, 42] and state the comparisons made.',
  },
];

export function examplesFor(subject: SubjectId | null | undefined): Example[] {
  if (!subject) return EXAMPLES;
  return EXAMPLES.filter((e) => e.subject === subject);
}
