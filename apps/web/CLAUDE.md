# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**IMPORTANT: Claude should NEVER run npm commands directly. Always ask the user to run these commands.**

### Core Development

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run generate` - Generate static site

### Database Management

- `npm run db:setup` - Initial database setup (generate + migrate)
- `npm run db:generate` - Generate new database migrations from schema changes
- `npm run db:migrate` - Apply migrations to database
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run db:reset` - Force push schema changes (destructive)

### Code Quality

- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Automatically fix linting errors where possible

## Architecture Overview

### Technology Stack

- **Framework**: Nuxt 4 with Vue 3 and TypeScript
- **UI Library**: Nuxt UI v4 (built on Tailwind CSS and Headless UI)
- **Database**: SQLite with Drizzle ORM
- **Client**: LibSQL (@libsql/client)
- **Styling**: Tailwind CSS with Nuxt UI components

### Project Structure

```
app/
  app.vue           # Root app component
  pages/            # File-based routing
    index.vue       # Landing page with features showcase
    dashboard.vue   # Main automation control panel
    login.vue       # Authentication page
  assets/css/       # Global styles

lib/
  env.ts           # Environment variable validation with Zod
  db/
    index.ts       # Database connection setup
    schema/        # Drizzle schema definitions
      config.ts    # Configuration table for Hue settings
    migrations/    # Auto-generated migration files

server/api/        # Nuxt server API routes (currently empty)
data/              # SQLite database file location
```

### Database Schema

- **config table**: Stores Hue bridge connection settings (IP, username, password)
- Database uses snake_case naming convention
- Migrations are auto-generated in `lib/db/migrations/`

### Application Flow

1. **Landing Page** (`/`): Marketing page showcasing automation features for TikTok Live and YouTube SuperChat integration
2. **Authentication** (`/login`): User login (UI implemented, backend authentication not yet integrated)
3. **Dashboard** (`/dashboard`): Main control panel showing:
   - Live stream statistics (TikTok Live, YouTube Live)
   - Recent automation triggers
   - Quick action buttons for managing rules and settings

### Key Features (Planned)

- **Smart Lighting**: Control Hue lights based on donations/chat
- **Audio Triggers**: Play sounds for viewer interactions
- **Custom Automation**: Create sequences for different donation amounts
- **Live Stream Integration**: TikTok Live and YouTube SuperChat monitoring

### Environment Configuration

- Uses Zod for environment variable validation
- Required variables: `NODE_ENV`, `DB_FILE_NAME`
- Configuration stored in `.env` file (not committed)

### Development Notes

- Uses Nuxt UI components throughout (UHeader, UMain, UCard, UButton, etc.)
- Color mode switching supported
- File-based routing with Nuxt pages
- Database migrations managed through Drizzle Kit
- Toast notifications implemented for user feedback

### Database Operations

**IMPORTANT: Claude should NEVER make direct database changes or run database commands.**

When database changes are needed:

1. Identify what schema changes are required
2. Inform the user exactly what needs to be added/modified in `lib/db/schema/`
3. Let the user make the schema changes and run the necessary commands:
   - `npm run db:generate` to create migrations
   - `npm run db:migrate` to apply changes
4. User can inspect data with `npm run db:studio`

### UI Development

**IMPORTANT: Always use the Nuxt UI MCP server to verify component usage and implementation.**

- Follow Nuxt UI component patterns already established
- Use `mcp__nuxt-ui-remote__get_component` to verify correct component props and usage
- Use `mcp__nuxt-ui-remote__list_components` to discover available components
- Use Tailwind utility classes for custom styling
- Icons use Lucide icon set (prefix: `i-lucide-`)
- Maintain consistent spacing and color scheme throughout
- Always validate component implementation against official Nuxt UI documentation via MCP

### Form Validation

**IMPORTANT: Always use Zod schema validation for all forms with centralized schemas.**

#### Schema Organization

All Zod schemas are centralized in `lib/schemas/` directory:

```
lib/schemas/
├── index.ts          # Main export file
├── hue.ts           # Philips Hue device schemas
├── auth.ts          # Authentication schemas (future)
├── automation.ts    # Automation rule schemas (future)
└── streaming.ts     # Stream integration schemas (future)
```

#### Creating New Schemas

1. **Create dedicated schema file** (e.g., `lib/schemas/hue.ts`):

```typescript
import * as z from "zod";

export const hueConfigSchema = z.object({
  hue_ip: z.string().min(1, "IP address is required"),
  hue_username: z.string().min(1, "Username is required")
});

export type HueConfig = z.output<typeof hueConfigSchema>;
```

2. **Export from main index file** (`lib/schemas/index.ts`):

```typescript
export { type HueConfig, hueConfigSchema } from "./hue";
```

#### Using Schemas in Components

Import schemas from either the centralized location or specific files:

```typescript
import type { FormSubmitEvent } from "@nuxt/ui";

import type { HueConfig } from "~/lib/schemas";
import type { HueConfig } from "~/lib/schemas/hue";

// Option 1: From main index (recommended for cross-cutting schemas)
import { hueConfigSchema } from "~/lib/schemas";
// Option 2: From specific file (recommended for feature-specific usage)
import { hueConfigSchema } from "~/lib/schemas/hue";

const state = reactive<Partial<HueConfig>>({
  hue_ip: undefined,
  hue_username: undefined
});

async function onSubmit(event: FormSubmitEvent<HueConfig>) {
  // Handle form submission
  console.warn("Form submitted:", event.data);
}
```

Template usage:

```vue
<UForm :schema="hueConfigSchema" :state="state" @submit="onSubmit">
  <UFormField label="IP Address" name="hue_ip">
    <UInput v-model="state.hue_ip" />
  </UFormField>
  <UFormField label="Username" name="hue_username">
    <UInput v-model="state.hue_username" />
  </UFormField>
  <UButton type="submit">Submit</UButton>
</UForm>
```

#### Schema Guidelines

- **Never define schemas locally** - always use centralized schemas from `lib/schemas/`
- **Use descriptive names** - suffix with the domain (e.g., `hueConfigSchema`, `userAuthSchema`)
- **Export types** - always export TypeScript types alongside schemas
- **Provide clear error messages** - include helpful validation messages in schema definitions
- **Include `name` attribute** on UFormField that matches schema keys
- **Organize by domain** - group related schemas in domain-specific files

### Request Validation

**IMPORTANT: Always use `readValidatedBody` with shared Zod schemas for API request validation.**

#### Validation Pattern

- **Use `readValidatedBody`** instead of `readBody` for POST/PUT requests
- **Share schemas** between frontend forms and backend validation
- **Use `safeParse`** to handle validation errors gracefully
- **Provide helpful error messages** by mapping Zod issues

#### Example Implementation

```typescript
// Shared schema in lib/schemas/user.ts
export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  age: z.number().min(18, "Must be at least 18 years old").optional(),
});

// Frontend form validation (same schema)
<UForm :schema="userSchema" :state="formState" @submit="onSubmit">
  <UFormField label="Name" name="name">
    <UInput v-model="formState.name" />
  </UFormField>
</UForm>

// Backend API validation (same schema) - Preferred pattern
export default defineEventHandler(async (event) => {
  try {
    // Use parseAsync to let Zod validation errors throw automatically
    const result = await readValidatedBody(event, body => userSchema.parseAsync(body));

    // result is now type-safe and validated
    const userData = await createUser(result);
    return { message: "User created successfully", data: userData };
  } catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "User creation failed",
    });
  }
});
```

#### Query Parameter Validation

For GET requests with query parameters, use `getValidatedQuery`:

```typescript
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export default defineEventHandler(async (event) => {
  try {
    // Use parseAsync for query validation too
    const { page, limit } = await getValidatedQuery(event, query => querySchema.parseAsync(query));

    const users = await getUsers(page, limit);
    return { message: "Users retrieved successfully", data: users };
  }
  catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Failed to get users",
    });
  }
});
```

### TypeScript Standards

**IMPORTANT: Follow strict TypeScript practices for type safety.**

#### Type Usage Rules

- **Never use `any` type** - it defeats the purpose of TypeScript
- **Use `unknown` for uncertain types** - particularly for error handling
- **Always type-check `unknown` values** before using them
- **Use proper type guards** for runtime type checking

#### Error Handling Pattern

**CRITICAL: Never return custom error objects. Always either throw errors or use Nuxt's `createError`.**

```typescript
// ✅ Correct - Services throw errors
export async function serviceFunction(): Promise<Data> {
  const result = await $fetch<ApiResponse>("/api/endpoint");

  if (!result.success) {
    throw new Error("Operation failed");
  }

  return result.data;
}

// ✅ Correct - API routes use createError
export default defineEventHandler(async (event) => {
  try {
    const data = await serviceFunction();
    return { success: true, data };
  }
  catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: "Operation Failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ✅ Correct - Frontend error handling
try {
  await $fetch("/api/endpoint");
}
catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error occurred";
  toast.add({
    title: "Error",
    description: message,
    color: "error"
  });
}

// ❌ Wrong - Custom error objects
export async function badServiceFunction(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await $fetch("/api/endpoint");
    return { success: true, data: result };
  }
  catch {
    return { success: false, error: "Failed" }; // Don't do this!
  }
}

// ❌ Wrong - Manual status setting in API routes
export default defineEventHandler(async (event) => {
  try {
    // operation
  }
  catch (error) {
    setResponseStatus(event, 500); // Don't do this!
    return { success: false, error: "Failed" };
  }
});
```

#### API Response Typing

- **Define response interfaces** for all API endpoints
- **Use type assertions carefully** with proper validation
- **Handle all possible response shapes** in conditional logic

### Code Quality & Linting

**IMPORTANT: Always follow ESLint rules and never ignore linting errors.**

#### ESLint Workflow

- **After ANY code changes**: Always ask the user to run `npm run lint:fix` to automatically fix linting issues
- **Before completing tasks**: Always ask the user to run `npm run lint:fix` FIRST, then `npm run lint` to verify all rules are followed
- **Two-step process**: `npm run lint:fix` → `npm run lint` (fix first, then verify)
- **Never ignore ESLint rules** - fix the code to comply with the rules instead
- **ESLint configuration**: Uses @antfu/eslint-config with Nuxt integration (standalone: false)

#### Linting Standards

- **Import sorting**: Uses perfectionist/sort-imports with tsconfigRootDir
- **Filename cases**: Supports camelCase, pascalCase, and kebabCase
- **Vue-specific rules**: Max 2 attributes per line (single), 1 per line (multiline)
- **TypeScript rules**: Consistent type definitions, no redeclaration warnings
- **Code style**: 2-space indentation, semicolons, double quotes
- **Console usage**: Console.log produces warnings (use proper logging instead)

#### Quality Gates

1. **Development**: Write code following established patterns
2. **Linting**: Ask user to run `npm run lint:fix` after changes
3. **Validation**: Ask user to run `npm run lint` to verify compliance
4. **Never skip**: Do not ignore or disable linting rules to make code work

### Import Aliases

**IMPORTANT: Use correct Nuxt aliases for all imports to ensure proper module resolution.**

#### Available Aliases

- **`@/`** - Points to the app directory (`<srcDir>`)
- **`~/`** - Points to the app directory (`<srcDir>`)
- **`@@/`** - Points to the project root directory (`<rootDir>`)
- **`~~/`** - Points to the project root directory (`<rootDir>`)

#### Usage Guidelines

- **For files in `app/` directory**: Use `@/` or `~/` for imports within the app
- **For files in `server/` directory**: Use `@@/` for importing from lib, schemas, or other root-level directories
- **For root-level imports**: Always use `@@/` when importing from `lib/`, `data/`, etc.

#### Examples

```typescript
// ✅ Correct - App files importing within app
import type { FormSubmitEvent } from "@nuxt/ui";

// ✅ Correct - Server files importing from root
import { updateHueConfig } from "@@/lib/db/queries/config";
// ✅ Correct - App files importing from lib
import { hueConfigSchema } from "@@/lib/schemas/hue";
import { testHueConnection } from "@@/lib/services/hue";

// ❌ Wrong - Using ~ for root imports in server files
import { updateHueConfig } from "~/lib/db/queries/config";

// ❌ Wrong - Using relative paths
import { hueConfigSchema } from "../../lib/schemas/hue";
```

### HTTP Requests

**CRITICAL: Always use `$fetch` from h3 instead of native `fetch()`. Never use custom error objects.**

#### Core Principles

- **Use `$fetch` exclusively** - it provides automatic error handling and JSON parsing
- **Let errors throw** - `$fetch` automatically throws on HTTP errors (4xx, 5xx)
- **Type everything** - use generic types with `$fetch<ResponseType>(url)`
- **No manual error checking** - no need for `response.ok` or `response.status` checks

#### Service Layer Pattern

```typescript
// ✅ Correct - Service functions throw errors
export async function getUserData(id: string): Promise<User> {
  // $fetch throws automatically on HTTP errors
  const user = await $fetch<User>(`/api/users/${id}`);

  // Only handle business logic errors
  if (!user.isActive) {
    throw new Error("User account is deactivated");
  }

  return user;
}

// ✅ Correct - External API calls
export async function discoverHueBridge(): Promise<string> {
  const bridges = await $fetch<HueBridge[]>("https://discovery.meethue.com/");

  if (!bridges.length) {
    throw new Error("No Hue bridges found");
  }

  return bridges[0].internalipaddress;
}

// ❌ Wrong - Custom error objects
export async function badGetUserData(id: string): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const user = await $fetch<User>(`/api/users/${id}`);
    return { success: true, data: user };
  }
  catch (error) {
    return { success: false, error: "Failed to get user" }; // Don't do this!
  }
}

// ❌ Wrong - Using native fetch
export async function badFetchData(): Promise<Data> {
  const response = await fetch("/api/data"); // Don't do this!
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
```

#### API Route Pattern

```typescript
// ✅ Correct - Use readValidatedBody with parseAsync (recommended)
import { updateConfig } from "@@/lib/db/queries/config";
import { configSchema } from "@@/lib/schemas/config";

export default defineEventHandler(async (event) => {
  try {
    // Validate and parse request body - Zod errors throw automatically
    const result = await readValidatedBody(event, body => configSchema.parseAsync(body));

    // result is type-safe and validated
    const savedConfig = await updateConfig(result);

    return {
      message: "Configuration saved successfully",
      config: savedConfig
    };
  }
  catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Configuration save failed",
    });
  }
});

// ❌ Wrong - Using readBody without validation
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event); // No validation!

    if (!body.name || !body.email) { // Manual validation
      throw createError({ statusCode: 400, message: "Missing fields" });
    }

    return await createUser(body.name, body.email);
  }
  catch (error: unknown) {
    // error handling...
  }
});

// ❌ Wrong - Manual safeParse handling (unnecessary complexity)
export default defineEventHandler(async (event) => {
  try {
    const validationResult = await readValidatedBody(event, body => schema.safeParse(body));

    if (!validationResult.success) { // Don't do this!
      throw createError({
        statusCode: 400,
        message: validationResult.error.issues.map(issue => issue.message).join(", "),
      });
    }

    return await processData(validationResult.data);
  }
  catch (error: unknown) {
    // error handling...
  }
});
```

#### Frontend Pattern

```typescript
// ✅ Correct - Let $fetch handle HTTP errors
async function handleUserAction() {
  try {
    const result = await $fetch<ActionResponse>("/api/action", {
      method: "POST",
      body: { action: "update" }
    });

    // Handle success
    toast.add({ title: "Success", color: "success" });
  }
  catch (error: unknown) {
    // $fetch errors include the server's error message
    const message = error instanceof Error ? error.message : "Action failed";
    toast.add({ title: "Error", description: message, color: "error" });
  }
}
```
