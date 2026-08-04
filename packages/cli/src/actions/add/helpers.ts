import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import ora from "ora";
import { COMPONENT_REGISTRY_RAW_BASE_URL } from "../../constants/urls.ts";
import { directoryExists, getDefaultTargetPath } from "../../utils/index.ts";
import { logger } from "../../utils/logger.ts";

interface FileConfig {
  type: "core";
  path: string;
  targetPath?: string;
}

export type FileTarget = {
  file: FileConfig;
  path: string;
  relativePath: string;
  exists: boolean;
};

export type AddFilesResult = {
  written: number;
  overwritten: number;
};

type InstallFilesParams = {
  files: FileConfig[];
  overwriteExisting: boolean;
};

export async function getFileTargets({
  files
}: Pick<InstallFilesParams, "files">): Promise<FileTarget[]> {
  const cwd = process.cwd();
  const srcExists = await directoryExists(path.join(cwd, "src"));

  return Promise.all(
    files.map(async file => {
      const targetPath = getTargetPath({ file, srcExists });

      return {
        file,
        path: targetPath,
        relativePath: path.relative(cwd, targetPath),
        exists: await fileExists(targetPath)
      };
    })
  );
}

export async function addFiles({
  files,
  overwriteExisting
}: InstallFilesParams): Promise<AddFilesResult> {
  const spinner = ora();
  const targets = await getFileTargets({ files });
  let written = 0;
  let overwritten = 0;

  spinner.start(`📦 Installing ${files.length} file(s)...`);

  for (const target of targets) {
    try {
      if (target.exists && !overwriteExisting) continue;

      await addFile(target);
      written += 1;

      if (target.exists) overwritten += 1;
    } catch (error) {
      spinner.fail(`Failed to add ${target.file.path}`);
      throw error;
    }
  }

  if (written > 0) {
    spinner.succeed("All files installed successfully!");
  } else {
    spinner.info("No files installed.");
  }

  return { written, overwritten };
}

function getTargetPath({
  file,
  srcExists
}: {
  file: FileConfig;
  srcExists: boolean;
}) {
  const { type, path: sourcePath, targetPath } = file;
  const cwd = process.cwd();

  return targetPath
    ? path.join(
        cwd,
        srcExists ? "src" : "",
        "components",
        "tailgrids",
        targetPath
      )
    : getDefaultTargetPath({
        type,
        sourcePath,
        srcExists
      });
}

async function addFile(target: FileTarget) {
  const { file, path: finalTargetPath, relativePath } = target;
  const { path: sourcePath } = file;

  const downloadUrl = `${COMPONENT_REGISTRY_RAW_BASE_URL}${sourcePath}`;

  logger.log(
    `  ${chalk.blue("-")} ${path.basename(sourcePath)} → ${relativePath}`
  );

  const content = await fetchFileContent(downloadUrl);

  await fs.mkdir(path.dirname(finalTargetPath), { recursive: true });

  await fs.writeFile(finalTargetPath, content, "utf-8");
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchFileContent(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Tailgrids CLI"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}
