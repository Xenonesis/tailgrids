import { checkbox, confirm } from "@inquirer/prompts";
import { REGISTRIES } from "../../registries.ts";
import type { Registry } from "../../types/registry.ts";
import { installDependencies } from "../../utils/installing-dependencies.ts";
import { logger } from "../../utils/logger.ts";
import { addFiles, getFileTargets } from "./helpers.ts";

type HandleAddCommandParams = {
  components: string[];
};

export async function handleAddCommand({ components }: HandleAddCommandParams) {
  try {
    const registries = REGISTRIES;

    let selectedComponentsId = components;

    if (!selectedComponentsId.length) {
      selectedComponentsId = await checkbox({
        message: "Select components to add",
        choices: registries.map(component => ({
          name: component.name,
          description: component.description,
          value: component.id
        }))
      });
    }

    if (!selectedComponentsId.length) {
      logger.warn("No Components Selected. Exiting.");
      return;
    }

    const allDependencies = new Set<string>();
    const allDevDependencies = new Set<string>();

    const processedComponentIds = new Set<string>();
    let addedComponents = 0;
    let missingComponents = 0;

    for (const componentId of selectedComponentsId) {
      const result = await handleComponentRegistry({
        registries,
        componentId,
        processedComponentIds,
        allDependencies,
        allDevDependencies
      });

      if (result === "added") addedComponents += 1;
      if (result === "missing") missingComponents += 1;
    }

    await installDependencies({
      dependencies: Array.from(allDependencies),
      devDependencies: Array.from(allDevDependencies)
    });

    if (
      addedComponents > 0 ||
      (selectedComponentsId.length > 1 && missingComponents > 0)
    ) {
      logger.success("Components added successfully!");
    }
  } catch (error) {
    logger.error("Failed to add components:\n" + (error as Error).message);
    process.exit(1);
  }
}

type HandleComponentRegistryParams = {
  componentId: string;
  registries: Registry[];
  processedComponentIds: Set<string>;
  allDependencies: Set<string>;
  allDevDependencies: Set<string>;
};

type ComponentAddResult = "added" | "missing" | "skipped";

async function handleComponentRegistry({
  registries,
  componentId,
  processedComponentIds,
  allDependencies,
  allDevDependencies
}: HandleComponentRegistryParams): Promise<ComponentAddResult> {
  if (processedComponentIds.has(componentId)) return "skipped";

  const componentRegistry = registries.find(({ id }) => id === componentId);

  processedComponentIds.add(componentId);

  if (!componentRegistry) {
    logger.warn(
      `Component: "${componentId}" not found in registry, skipping...`
    );
    return "missing";
  }

  const fileTargets = await getFileTargets({
    files: componentRegistry.files
  });
  const existingFiles = fileTargets.filter(file => file.exists);

  if (existingFiles.length > 0) {
    const shouldOverwrite = await confirm({
      message: `Component "${componentRegistry.name}" already has file(s):\n${existingFiles
        .map(file => `  - ${file.relativePath}`)
        .join("\n")}\nOverwrite?`,
      default: false
    });

    if (!shouldOverwrite) {
      logger.warn(`Skipped component: ${componentRegistry.name}`);
      return "skipped";
    }
  }

  await addFiles({
    files: componentRegistry.files,
    overwriteExisting: existingFiles.length > 0
  });

  // Store dependencies to install
  componentRegistry.dependencies?.forEach(dep => allDependencies.add(dep));
  componentRegistry.devDependencies?.forEach(devDep =>
    allDevDependencies.add(devDep)
  );

  if (componentRegistry.requires && componentRegistry.requires.length > 0) {
    for (const requiredId of componentRegistry.requires) {
      await handleComponentRegistry({
        registries,
        componentId: requiredId,
        processedComponentIds,
        allDependencies,
        allDevDependencies
      });
    }
  }

  logger.info(`✓ ${componentRegistry.name}`);
  return "added";
}
