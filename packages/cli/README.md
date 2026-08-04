# Tailgrids CLI

The Tailgrids CLI is a command-line tool that helps you manage Tailgrids components in your React projects.

## Commands

### `init`

The `init` command initializes Tailgrids in your project.

```bash
npx @tailgrids/cli init
```

This will prompt you to:

- Select a theme for your components.
- Configure an import alias for your project.

The `init` command will create the following files:

- `tailgrids.config.json`: Configuration file for the Tailgrids CLI.
- `tailgrids.css`: The base styles for Tailgrids components.
- A `cn` utility file for merging Tailwind CSS classes.

It will also install the required dependencies (`clsx`, `@tailwindcss/forms`, and `tailwind-merge`).

### `add`

The `add` command adds Tailgrids components to your project. It copies the component files to your project's `components/tailgrids/core` directory and adds the required dependencies.

#### Usage

To add one or more components to your project, run the `add` command followed by the component IDs. You can find the component IDs in the [Tailgrids documentation](https://tailgrids.com/docs).

```bash
npx @tailgrids/cli add <component-id-1> <component-id-2> ...
```

For example, to add the `button` and `dialog` components, run the following command:

```bash
npx @tailgrids/cli add button dialog
```

This will create the following files in your project:

```
components/
└── tailgrids/
    ├── button.tsx
    └── dialog.tsx
```

When a component would replace one or more existing files, the CLI lists those
files and asks for confirmation once for that component. This also applies to
components added automatically as dependencies. Declining the prompt leaves the
existing files unchanged and skips that component's package dependencies.

The CLI detects the package manager used by the current project and installs
component dependencies with npm, pnpm, Yarn, or Bun as appropriate.

## License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.
