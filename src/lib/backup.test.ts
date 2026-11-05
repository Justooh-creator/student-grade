import { describe, it, expect } from "vitest";
import { assertSameSchool, buildBackup, mergeRestore, parseBackup } from "./backup";

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

describe("backup privacy", () => {
  const full = { school: { name: "X", logo: "data:L", signature: "data:S", stamp: "data:T", classTeacherSignatures: { a: "data:C" } }, students: [{ id: "s1", name: "Ama", photo: "data:P" }] } as never;
  it("excludes all images from the file", () => {
    const text = JSON.stringify(buildBackup(full, new Date(), "sch1"));
    expect(text).not.toContain("data:");
    expect(parseBackup(text).schoolId).toBe("sch1");
  });
  it("keeps local images on restore", () => {
    const back = parseBackup(JSON.stringify(buildBackup(full)));
    const merged = mergeRestore(full, back);
    expect(merged.school.logo).toBe("data:L");
    expect(merged.students[0]?.photo).toBe("data:P");
  });
  it("blocks restoring another school's backup", () => {
    expect(() => assertSameSchool("a", "b")).toThrow();
    expect(() => assertSameSchool("a", "a")).not.toThrow();
  });
});
