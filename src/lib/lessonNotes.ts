export interface LessonNote {
  id: string;
  title: string;
  schoolName: string;
  weekEnding: string;
  day: string;
  subject: string;
  duration: string;
  classId: string;
  classSize: string;
  strand: string;
  subStrand: string;
  contentStandard: string;
  indicator: string;
  lesson: string;
  performanceIndicator: string;
  competencies: string;
  newWords: string;
  reference: string;
  starterMinutes: string;
  starter: string;
  mainMinutes: string;
  main: string;
  assessment: string;
  reflectionMinutes: string;
  reflection: string;
  resources: string;
  progression: string;
  homework: string;
  crossCurriculum: string;
  misconceptions: string;
  vettedBy: string;
  signature: string;
  vettedDate: string;
}

export function blankLesson(schoolName = ""): LessonNote {
  return { id: "", title: "", schoolName, weekEnding: "", day: "Monday", subject: "Mathematics", duration: "60", classId: "b9", classSize: "", strand: "", subStrand: "", contentStandard: "", indicator: "", lesson: "1 of 1", performanceIndicator: "", competencies: "", newWords: "", reference: "", starterMinutes: "5", starter: "", mainMinutes: "45", main: "", assessment: "", reflectionMinutes: "10", reflection: "", resources: "", progression: "", homework: "", crossCurriculum: "", misconceptions: "", vettedBy: "", signature: "", vettedDate: "" };
}

export function lessonMinutes(note: LessonNote): number {
  return [note.starterMinutes, note.mainMinutes, note.reflectionMinutes].reduce((sum, value) => sum + (Number(value) || 0), 0);
}

export function lessonStorageKey(userId: string): string { return `edureport:lesson-notes:v1:${userId}`; }

export function parseLessonNotes(raw: string | null): LessonNote[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v))
      .filter((v) => typeof v["id"] === "string" && v["id"].length > 0)
      .map((v) => {
        const defaults = blankLesson();
        return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, typeof v[key] === "string" ? v[key] : fallback])) as unknown as LessonNote;
      });
  } catch { return []; }
}

export function saveLessonNote(notes: LessonNote[], note: LessonNote, id: string): LessonNote[] {
  const saved = { ...note, id };
  return [saved, ...notes.filter((n) => n.id !== id)];
}

export function scannedComputingExample(schoolName: string): LessonNote {
  return { ...blankLesson(schoolName), title: "Perceptual Computing", weekEnding: "2026-09-11", day: "Thursday", subject: "Computing", duration: "50", classId: "b9", classSize: "15", strand: "Introduction to Computing", subStrand: "Components of Computers", contentStandard: "B9.1.1.1 Identify parts of a computer and technology tools", indicator: "B9.1.1.1.2 Examine the concept of Perceptual Computing", lesson: "2 of 2", performanceIndicator: "Learners can examine the concept of Perceptual Computing.", competencies: "Communication and Collaboration; Critical Thinking and Problem Solving", newWords: "Perceptual Computing, Gesture Recognition, Voice Command, Sensory Input", reference: "Teacher-uploaded lesson-note sample; Computing Curriculum p. 40 (verify against your current NaCCA curriculum)", starter: "Display a brief video clip or animation demonstrating a computer reacting to human gestures or voice commands.\nAsk learners to discuss in pairs what they observed and how the computer understands user input.\nShare performance indicators and introduce the lesson.", mainMinutes: "35", main: "Explain how computers can perceive and respond to more natural human-like inputs.\nDiscuss gesture recognition, voice command and recognition, facial recognition and multi-touch interactions.\nCompare these with keyboard and mouse input.\nIn small groups, assign each group a feature of perceptual computing. Learners brainstorm practical applications and share their ideas.", assessment: "1. What is perceptual computing?\n2. How does gesture recognition differ from traditional input methods?\n3. Name an application of voice command in everyday life.\n4. Why is facial recognition significant in perceptual computing?", reflection: "Summarise the main points and potential benefits and challenges of perceptual computing.\nUse peer discussion and questions to find out what learners have learnt.\nTake feedback and summarise the lesson.", resources: "Pictures and videos", progression: "Discussing the concept of perceptual computing", homework: "Explain perceptual computing. Compare gesture recognition with traditional input. Give an everyday voice-command application and explain the significance of facial recognition.", crossCurriculum: "None", misconceptions: "None" };
}