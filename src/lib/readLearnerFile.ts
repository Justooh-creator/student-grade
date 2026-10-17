import { parseLearnerRows } from "./studentImport";

/** Loaded only from the upload action, keeping spreadsheet libraries out of SSR. */
export async function readLearnerFile(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Please choose a register smaller than 5 MB.");
  if (/\.csv$/i.test(file.name)) {
    const { default: Papa } = await import("papaparse");
    const result = Papa.parse<string[]>(await file.text(), { skipEmptyLines: "greedy" });
    const fatal = result.errors.find((e) => e.code !== "UndetectableDelimiter");
    if (fatal) throw new Error(`Could not read the CSV: ${fatal.message}`);
    return parseLearnerRows(result.data);
  }
  if (/\.xlsx$/i.test(file.name)) {
    const { default: readXlsxFile } = await import("read-excel-file/browser");
    const rows = await readXlsxFile(file);
    return parseLearnerRows(rows);
  }
  throw new Error("Choose an Excel .xlsx or CSV file. Save older .xls files as .xlsx first.");
}