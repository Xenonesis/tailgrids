import fs from "node:fs/promises";
import path from "node:path";

type GetDefaultTargetPathParams = {
  type: string;
  sourcePath: string;
  srcExists?: boolean;
};

export function getDefaultTargetPath({
  type,
  sourcePath,
  srcExists
}: GetDefaultTargetPathParams) {
  const cwd = process.cwd();
  const filename = path.basename(sourcePath);

  const baseDir = srcExists ? "src" : "";

  return path.join(cwd, baseDir, "components", "tailgrids", type, filename);
}

export async function directoryExists(dirPath: string) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function getTargetDirectory() {
  const cwd = process.cwd();
  const srcExists = await directoryExists(path.join(cwd, "src"));

  const targetDir = srcExists
    ? path.join(cwd, "src", "component", "tailgrids")
    : path.join(cwd, "component", "tailgrids");

  return targetDir;
}
