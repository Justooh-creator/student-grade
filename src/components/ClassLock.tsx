import type { ReactNode } from "react";
import { useCloud } from "@/lib/cloud";
import { useAppData } from "@/lib/store";
import { canEditClass } from "@/lib/classAccess";

export function useCanEditClass(classId: string) {
  const cloud = useCloud();
  const { school } = useAppData();
  return canEditClass({
    inSchool: !!cloud.schoolId,
    role: cloud.role,
    userId: cloud.userId,
    assignments: school.classAssignments,
    classId,
  });
}

/** Disables every field inside when the teacher is not assigned to this class. */
export function ClassLock({ classId, children }: { classId: string; children: ReactNode }) {
  const can = useCanEditClass(classId);
  return (
    <>
      {!can && (
        <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-xs font-bold">
          👁 View only — you are not assigned to this class. Ask your headteacher to assign you.
        </p>
      )}
      <fieldset disabled={!can} className="contents">{children}</fieldset>
    </>
  );
}
