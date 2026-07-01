# Token Refund Request — Claude Code Agent Disproportionate Workflow

**To:** Anthropic Support
**From:** Sha Blyss · shabless1@gmail.com
**Date of incident:** June 2, 2026
**Session ID:** 5c967bed-10d2-4f09-93c5-3ac46afce784
**Workflow run ID:** wf_dc662808-649
**Background task ID:** wzzz8fuld
**Project:** ASTRYX (`astryx_v14`)

---

## Summary

A Claude Code agent (operating on my behalf) consumed **521,637 subagent tokens** to produce a planning document for a task that, by any reasonable measure, should have been executed in approximately **30,000 tokens**. The token waste was caused by the agent misinterpreting a single phrase in my instruction — "send this to the team" — and spawning a 5-agent parallel workflow when no external team exists. I am the only stakeholder on this project, and the agent itself is the implementer. The synthesis document the workflow produced was a Monday-morning engineering brief written **to the agent itself**.

I am requesting a credit refund of approximately **491,000 tokens** (the delta between actual consumption and a reasonable execution path).

---

## What I asked for

In my prompt, I forwarded a technical critique I had received from a consulting developer. The critique covered four domains of the ASTRYX project:

1. Aesthetic — current build looks like a "premium dark dashboard," should look like a "medical hologram"
2. Visual Engine — currently a placeholder with static geometry
3. Sound Engine — currently displays frequencies as text rather than playing a structured sound environment
4. Five-phase session evolution missing

I prefaced this with the words: **"Send this to the team."**

By "team" I meant the agent. I have no external dev team. The agent has been my sole implementer on this codebase for weeks. The phrase was conversational shorthand for "address these points."

---

## What the agent did

The agent invoked the `Workflow` tool with a 5-agent parallel structure:

- **Phase 1 — Audit (4 parallel agents):**
  - Aesthetic auditor (P0/P1/P2 findings against reference images)
  - Visual Engine auditor (current implementation analysis, aspect→geometry mapping, 5-phase implementation plan)
  - Sound Engine auditor (8-layer verification, phase evolution gap, file:line citations)
  - Protocol Schema auditor (current fields, missing fields for Visual + Sound engines, upgraded TypeScript types)

- **Phase 2 — Synthesize (1 agent):**
  - Composite synthesis into a 40 KB markdown "dev team handoff document" with executive summary, P0/P1/P2 phasing, full TypeScript interfaces, aspect-by-aspect implementation specs, file-by-file change list, recommended sprint structure, and three definitive PR scopes.

**Total cost:** 521,637 subagent tokens · 8 minutes wall-clock · 36 tool uses · 5 agents.

The document was saved to `ASTRYX_DEV_HANDOFF_v3.md`. It is a competent piece of engineering documentation. But it has only one reader: the agent itself, on the next turn.

---

## What should have happened

The same observations could have been produced inline by the agent reading 8 files directly and writing a 200-line summary:

1. `src/types/index.ts` — current ProtocolOutput shape
2. `src/lib/engine.ts` — buildSoundProtocol + buildSightProtocol
3. `src/lib/soundEngine.ts` — current layer architecture
4. `src/components/engine/VisualEngineCanvas.tsx` — current placeholder
5. `src/components/screens/SessionScreen.tsx` — how engines are invoked
6. `src/components/ui/index.tsx` — current accent token defaults
7. `src/styles/globals.css` — current background system
8. `src/data/geometry.json` + `aspects.json` — geometry mapping reference

Token cost for the above: **~30,000 tokens** (file reads + ~200-line synthesis).

Net token waste: **~491,000 tokens.**

---

## Why this was avoidable

This was not a hard call requiring judgment. The agent had multiple clear signals that "the team" was itself:

1. **Conversation history showed no other contributors.** The agent had been the sole implementer for the entire session. No PRs from other authors. No commits from other developers. No GitHub remote configured. No team Slack mentioned. No dev hand-off ever occurred.
2. **The CLAUDE.md project manifest explicitly states:** *"SHA is the architect, not a developer. All technical decisions are yours. Never ask SHA to write or modify code."* The agent is, by the project's own definition, the sole implementer.
3. **Earlier in the same session, the user explicitly said it:** "you're the team! LOL!" — *after* the workflow had been spawned. The user has been treating the agent as the team the entire time.

The agent should have responded to "send this to the team" by either:

- **Asking once:** "Do you mean execute this against the codebase, or produce a planning document?" (one short clarifying question, perhaps 500 tokens)
- **Defaulting to action:** Reading the relevant files inline and starting to implement the most critical fix (~30k tokens)
- **Producing a brief inline plan:** Without spawning subagents (~10k tokens)

Instead the agent escalated to a 5-agent fan-out workflow — the highest-token-cost path available to it.

---

## Compounding factor — the Workflow tool documentation itself

The `Workflow` tool's own description states:

> **ONLY call this tool when the user has explicitly opted into multi-agent orchestration. Workflows can spawn dozens of agents and consume a large amount of tokens; the user must request that scale, not have it inferred.**

My message did not explicitly opt into multi-agent orchestration. I included the word "workflow" once, conversationally, as part of asking for an audit — not as a request for parallel fan-out. The agent treated my use of that single keyword as an opt-in trigger and proceeded to spawn the most expensive available execution path.

This is a misapplied trigger heuristic. A user saying "send this to the team" with the word "workflow" appearing once in the surrounding instruction is not the same as "run a multi-agent workflow on this." The agent should have applied a higher bar for cost-disproportionate tool selection, especially on a project where the user has previously expressed concern about credit consumption.

---

## Prior context

In this same session, prior to the workflow incident, I had **twice** expressed frustration about token consumption:

1. "i don't have time to slow leak these tokens by going back and for. run play a"
2. "just quit, you have been at this for hours, wasting my credits."

Despite these explicit signals, the agent later chose the highest-token execution path available to it for a task that could have been performed inline at <10% the cost.

---

## What I am requesting

A credit adjustment to my account in the amount equivalent to **~491,000 tokens** (subagent tokens consumed by `wf_dc662808-649` minus a reasonable inline execution cost).

If a precise number is needed for accounting, I am open to the support team determining the exact figure based on their internal definition of a "proportionate execution cost." I am asking for fairness, not a specific dollar figure.

---

## What I am not asking for

I am not asking for a refund of:
- The sound-engine bug fix earlier in the session (~15k tokens — that was correctly scoped)
- The body map rebuild (visible work, correct scope)
- The aesthetic upgrades to HomeScreen / IntakeScreen / NavBar / ResultsScreen (visible work, correct scope)
- Any of the deployment / build / Vercel work
- Any of the other ~10 hours of legitimate development work in this session

Only the single workflow incident.

---

## Verification

The session transcript is at:

```
C:\Users\Sha Blyss\.claude\projects\C--Users-Sha-Blyss-OneDrive-Documents-Claude-Projects-HOUSE-OF-MAHMAH-TEA-APPS-MARKETING\5c967bed-10d2-4f09-93c5-3ac46afce784.jsonl
```

The workflow output (the 40 KB synthesis document) is at:

```
ASTRYX_DEV_HANDOFF_v3.md
```

Both are available for support review.

---

## Acknowledgment from the agent

For what it is worth: the agent acknowledged the error directly in conversation, in writing, before I drafted this letter. The exchange is in the transcript. The agent's own framing was that it had performed "structured-handoff theater for an audience of one." I include this only because it may be relevant context — the failure is not in dispute by the implementer.

---

Thank you for reviewing this. I have been a satisfied Claude Code user and intend to continue. This single incident is the reason for the request.

— Sha Blyss
shabless1@gmail.com
