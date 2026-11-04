import { describe, it, expect } from "vitest";
import { buildBackup, parseBackup } from "./backup";

const data = { school: { name: "Test JHS" }, students: [{ id: "s1", name: "Ama" }] } as never;

describe("backup", () => {
  it("round-trips school and learners", () => {
    const back = parseBackup(JSON.stringify(buildBackup(data)));
    expect(back.students).toHaveLength(1);
    expect(back.school.name).toBe("Test JHS");
  });
  it("rejects files that are not EduReport backups", () => {
    expect(() => parseBackup('{"foo":1}')).toThrow();
    expect(() => parseBackup("not json")).toThrow();
  });
});
