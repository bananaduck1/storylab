This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Rubric Calibration: Modes + Constraints + Sanity Checks

The AI essay editor uses a calibrated rubric system that avoids one-size-fits-all scoring.

### Meaning-making modes

Before scoring, the model classifies each essay into 1–2 **meaning-making modes**:

| Mode | Depth comes from… |
|---|---|
| belief-driven | Articulating *why* a belief matters and what holding it costs |
| philosophical-synthesis | Quality of connections between disparate ideas |
| embodied-experience | The body's knowledge and concrete sensory detail |
| narrative-conflict | The gap between before/after selves and the causal chain |
| identity-formation | Specificity about what an identity means to the writer |
| social-observation | Specificity of observation and what it reveals about the observer |

Each rubric dimension is interpreted through the essay's mode. A belief-driven essay is not penalized for lacking narrative turning points; a social-observation essay is not penalized for lacking personal trauma.

### No-lazy-critique constraint

For any score ≤ 3, feedback must specify:
1. What **concrete element** is missing (not just "needs more depth")
2. What the **higher-score version** would look like **for this essay's mode**

The word "generic" may only be used if the criticized passage could appear unchanged in many unrelated essays and is not anchored to the essay's specific belief, motif, or scene.

### Cross-rubric sanity checks

- If R003 ≥ 4 AND R004 ≥ 4 AND R005 ≥ 4, then R002 cannot be ≤ 2 unless a specific contradiction is cited with evidence.
- Every claim in notes/why_it_matters must be supported by a verbatim quote.
- Contradictory claims across rubric dimensions must be resolved before output.

These checks are enforced both in the prompt and via post-processing validation (`validateAnalysisOutput.ts`).

### Running tests

```bash
# Start the dev server
npm run dev

# In another terminal — smoke test (basic endpoint check)
bash scripts/smoke-test.sh

# Regression tests (mode-aware scoring, no-lazy-critique, sanity checks)
bash scripts/regression-test.sh
```

Fixtures are in `fixtures/`:
- `belief-driven-embodied.txt` — belief-driven + embodied-experience essay
- `narrative-conflict.txt` — narrative-conflict essay
- `social-observation.txt` — social-observation essay

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
