// apps/web/eslint.config.js
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // A) Große Ignore-Liste
  {
    ignores: [
      "**/*.d.ts",
      "src/_disabled/**",
      "src/db/**",
      "src/shims/**",
      "src/types/generated/**",
      "apps/web/src/_disabled/**",
      "apps/web/src/db/**",
      "apps/web/src/shims/**",
      "apps/web/src/types/generated/**",
      ".next/**",
      "node_modules/**"
    ],
  },

  // 1) JS-Empfehlungen
  js.configs.recommended,

  // 2) TypeScript + Hooks
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        // Browser/DOM
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        console: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Blob: "readonly",
        File: "readonly",
        FormData: "readonly",
        ReadableStream: "readonly",
        TextEncoder: "readonly",
        AbortController: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        crypto: "readonly",
        AbortSignal: "readonly",
        HTMLFormElement: "readonly",
        HTMLInputElement: "readonly",
        PermissionState: "readonly",
        RequestInfo: "readonly",
        RequestInit: "readonly",
        // zusätzlich:
        atob: "readonly",
        btoa: "readonly",

        // Node/Edge
        process: "readonly",
        Buffer: "readonly",
        global: "readonly",
        module: "readonly",
        exports: "readonly",
        require: "readonly",
        __dirname: "readonly",

        // Falls im Code direkt referenziert
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      // Syntax-Guards
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='cookies'] MemberExpression[property.name='get']",
          message: "Nutze getCookie().",
        },
        {
          selector:
            "CallExpression[callee.name='headers'] MemberExpression[property.name='get']",
          message: "Nutze getHeader().",
        },
      ],

      // Prisma-Import Guard
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Bitte @db-web oder @db-core verwenden – nicht direkt @prisma/client.",
            },
          ],
        },
      ],

      // 🔧 TS übernimmt „undef“ besser → in TS-Dateien aus
      "no-undef": "off",

      // 🔧 Warnungen eliminieren (E200 verlangt 0 Warnings)
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "report-unused-disable-directives": "off",

      // Hooks-Grundregel bleibt
      "react-hooks/rules-of-hooks": "error",
      // Optional: Console erlauben
      "no-console": "off",
    },
  },

  // 3) Server-/API-Routen (Node-Kontext)
  {
    files: [
      "src/app/**/route.ts",
      "src/app/api/**",
      "src/**/*.server.{ts,tsx}",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        URL: "readonly",
        AbortController: "readonly",
        ReadableStream: "readonly",
        TextEncoder: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
  },

  // 4) Client-/Page-/Component-Dateien (Browser-Kontext)
  {
    files: [
      "src/**/*.client.{ts,tsx}",
      "src/components/**/*",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
    ],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        console: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Blob: "readonly",
        File: "readonly",
        FormData: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        React: "readonly",
      },
    },
  },

  // 5) Ergänzende Projekt-Regeln
  {
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
// __TIGHTEN_PHASE_1__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**",
    "src/server/**/*"
  ],
  rules: {
    "no-undef": "error"
  }
}
,

// __TIGHTEN_PHASE_1__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**",
    "src/server/**/*"
  ],
  rules: {
    "no-undef": "error"
  }
}

,

// __TIGHTEN_PHASE_1__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**",
    "src/server/**/*"
  ],
  rules: {
    "no-undef": "error"
  }
}
,

// __TIGHTEN_PHASE_2__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "no-unused-vars": "off"
  }
}

,

// __TIGHTEN_PHASE_1__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**",
    "src/server/**/*"
  ],
  rules: {
    "no-undef": "error"
  }
}
,

// __TIGHTEN_PHASE_2__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "no-unused-vars": "off"
  }
}
,

// __TIGHTEN_PHASE_3__
{
  files: [
    "src/components/**/*",
    "src/app/**/page.tsx",
    "src/app/**/layout.tsx"
  ],
  rules: {
    "react-hooks/exhaustive-deps": "warn",
    "report-unused-disable-directives": "warn"
  }
}

];
