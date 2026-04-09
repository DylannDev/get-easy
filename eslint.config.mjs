import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Clean architecture boundaries.
  // Inner layers must not depend on outer layers.
  {
    files: ["domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/application/*",
                "@/infrastructure/*",
                "@/composition-root/*",
                "@/app/*",
                "@/components/*",
                "@/hooks/*",
                "@/lib/*",
                "@/actions/*",
                "next",
                "next/*",
                "react",
                "react-dom",
                "@supabase/*",
                "stripe",
                "resend",
              ],
              message:
                "domain/ must not depend on outer layers or third-party runtime libraries.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/infrastructure/*",
                "@/app/*",
                "@/components/*",
                "@/hooks/*",
                "@/actions/*",
                "next",
                "next/*",
                "react",
                "react-dom",
                "@supabase/*",
                "stripe",
                "resend",
              ],
              message:
                "application/ may only depend on @/domain. Inject infrastructure via ports.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["infrastructure/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/*",
                "@/components/*",
                "@/hooks/*",
                "@/actions/*",
              ],
              message:
                "infrastructure/ must not depend on the presentation layer.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
