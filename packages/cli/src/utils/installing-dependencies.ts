import {
  detectPackageManager,
  installPackage,
  type InstallPackageOptions
} from "@antfu/install-pkg";
import chalk from "chalk";
import ora from "ora";
import { logger } from "./logger.ts";

type InstallDependenciesParams =
  | { dependencies: string[]; devDependencies?: string[] }
  | { dependencies?: string[]; devDependencies: string[] };

export async function installDependencies(params: InstallDependenciesParams) {
  const { dependencies = [], devDependencies = [] } = params;

  const cwd = process.cwd();
  const packageManager = await detectPackageManager(cwd);
  const spinner = ora();

  try {
    if (dependencies.length > 0) {
      logger.log("Dependencies to install:");
      dependencies.forEach(dep => {
        console.log(`  - ${chalk.green(dep)}`);
      });

      logger.break();

      spinner.start("Installing dependencies");
      await installDependenciesWithDetectedPackageManager({
        dependencies,
        cwd,
        packageManager,
        dev: false
      });

      spinner.succeed("Dependencies installed");
    }

    if (devDependencies.length > 0) {
      logger.log("devDependencies to install");
      devDependencies.forEach(dep => {
        console.log(`  - ${chalk.green(dep)}`);
      });

      spinner.start("Installing devDependencies");
      await installDependenciesWithDetectedPackageManager({
        dependencies: devDependencies,
        cwd,
        packageManager,
        dev: true
      });

      spinner.succeed("Dev dependencies installed");
    }
  } catch (error) {
    spinner.fail("Failed to install dependencies");

    const allDeps = [...dependencies, ...devDependencies];
    throw new Error(
      `Could not install dependencies. Please install them manually: ${allDeps.join(
        ", "
      )}`
    );
  }
}

async function installDependenciesWithDetectedPackageManager({
  dependencies,
  cwd,
  packageManager,
  dev
}: {
  dependencies: string[];
  cwd: string;
  packageManager: Awaited<ReturnType<typeof detectPackageManager>>;
  dev: boolean;
}) {
  const options: InstallPackageOptions = {
    cwd,
    dev,
    silent: true
  };

  if (packageManager) options.packageManager = packageManager;

  await installPackage(dependencies, options);
}
