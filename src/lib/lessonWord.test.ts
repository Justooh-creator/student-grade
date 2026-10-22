import { describe, expect, it } from "vitest";
import { createLessonWordBlob } from "./lessonWord";
import { scannedComputingExample } from "./lessonNotes";

describe("editable lesson Word export", () => {
  it("produces a real DOCX zip document", async () => {
    const blob = await createLessonWordBlob(scannedComputingExample("Test School"));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 2)]).toEqual([80, 75]);
    expect(blob.size).toBeGreaterThan(1000);
  });
});