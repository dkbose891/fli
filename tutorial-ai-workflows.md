# AI Agent Workflows — Study Guide

You built one by hand. `lib/agent.ts` is ~100 lines: tool declarations, a dispatch table, and a loop that calls Gemini, executes whatever functions it asks for (in parallel), feeds results back, and stops when the model answers in prose. That IS an agent framework — the smallest useful one. This guide is about understanding what you built, what the frameworks (LangChain/LangGraph, Google ADK, and friends) add on top, and when moving to one is worth it.

## Part 1 — Understand what you already built

Map the concepts in `lib/agent.ts` to industry vocabulary before studying frameworks, or the docs will sound like magic:

| In fli | Industry name | Where frameworks differ |
|---|---|---|
| `TOOL_DECLARATIONS` + `HANDLERS` | tool / function calling | frameworks generate schemas from typed function signatures |
| the `for (step < MAX_STEPS)` loop | agent loop / ReAct loop | frameworks make the loop a graph with branches, retries, human gates |
| `history` array passed each call | short-term memory / thread state | frameworks add persistence (checkpointers, sessions) |
| `selectedParcel` context string | state injection | frameworks formalise this as typed state passed between nodes |
| `Promise.all(calls.map(...))` | parallel tool execution | same idea, first-class in graph runtimes |
| `summary` vs `geojson` split | context engineering | the single highest-leverage skill; no framework does it for you |

- **ReAct: Synergizing Reasoning and Acting** — https://arxiv.org/abs/2210.03629 — the paper behind the loop you wrote.
- **Anthropic: Building effective agents** — https://www.anthropic.com/research/building-effective-agents — the essential read. Key thesis: *workflows* (predefined steps, LLM inside steps) beat *agents* (LLM decides the steps) for most production uses. Your layer proxy = workflow; your chat = agent. You already made this split correctly — now learn why.

## Part 2 — Workflows vs agents (the core mental model)

Everything in this space is a point on one axis: **who controls the control flow?**

1. **Deterministic pipeline** — code decides everything (your `/api/layer` proxy). Cheapest, most reliable, use whenever possible.
2. **Workflow with LLM steps** — code decides the steps, LLM fills slots (a "generate report card" pipeline that always calls the same 12 tools, then asks the model only to narrate). More reliable than an agent, same output quality when the task shape is known.
3. **Agent** — LLM decides which tools, in what order, when to stop (your chat loop). Needed only when the input is open-ended.
4. **Multi-agent** — a supervisor LLM routes to specialist agents. Needed rarely; costs and failure modes multiply.

Study, in order:
- **Anthropic's workflow patterns** (same article as above): prompt chaining, routing, parallelisation, orchestrator-workers, evaluator-optimizer. These five patterns cover ~90% of real systems.
- **Google: Agents whitepaper** — https://www.kaggle.com/whitepaper-agents — Google's framing (model + tools + orchestration layer), matches how Vertex/ADK docs speak.
- **12-Factor Agents** — https://github.com/humanlayer/12-factor-agents — opinionated, practical: "own your context window", "own your control flow". Reads like a defence of what you hand-built.

## Part 3 — The frameworks

### Google ADK (Agent Development Kit) — the natural next step for fli
- Docs: https://google.github.io/adk-docs/ (Python & Java; TS support is emerging — check current state)
- What it gives you over `agent.ts`: `LlmAgent` (your loop, managed), **workflow agents** (`SequentialAgent`, `ParallelAgent`, `LoopAgent` — pattern #2 above as first-class objects), multi-agent trees with delegation, sessions/memory, built-in eval (`adk eval`), a dev UI for tracing, and one-command deploy to **Vertex AI Agent Engine**.
- Why it fits: you're already on Vertex + Gemini + Cloud Run, and it's Google's strategic path (pairs with the FDE application story).
- Study: quickstart → workflow agents → multi-agent → the eval guide. Rebuild fli's "analyse parcel" as a `ParallelAgent` (all tools) + summariser step and compare reliability against the current prompt-driven version — that's a weekend and teaches 80% of it.

### LangChain / LangGraph — the ecosystem default
- LangGraph docs: https://langchain-ai.github.io/langgraph/ (JS: https://langchain-ai.github.io/langgraphjs/)
- Ignore old-style LangChain "chains" tutorials; the modern core is **LangGraph**: your agent as an explicit **state graph** — nodes (LLM call, tool exec, custom code), edges (fixed or conditional), a typed state object flowing through, **checkpointers** for persistence/resume, and human-in-the-loop interrupts.
- What it teaches that ADK doesn't emphasise: durable execution (pause a run for days, resume), time-travel debugging, fine control over every edge.
- **LangSmith** (https://smith.langchain.com) — tracing/evals; works even without LangChain in your stack and is worth knowing for observability vocabulary alone.
- Study: LangGraph quickstart → "agentic RAG" tutorial → checkpointing/human-in-the-loop. Port your `runAgentWithClient` loop to a two-node LangGraph (agent ↔ tools) — it's nearly mechanical and demystifies the whole framework.

### Worth knowing, lighter reading
- **Vertex AI Agent Engine / Agent Builder** — https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview — managed runtime ADK deploys to; sessions, memory bank, examples of LangGraph-on-Agent-Engine too (the runtimes are framework-agnostic).
- **OpenAI Agents SDK** — https://openai.github.io/openai-agents-python/ — minimal (agents, handoffs, guardrails); read to see how small the core concepts really are.
- **PydanticAI** — https://ai.pydantic.dev — type-safe agents in Python; the cleanest small-framework design right now.
- **MCP (Model Context Protocol)** — https://modelcontextprotocol.io — standard for packaging tools so ANY agent/framework can use them. Wrapping fli's NSW tools as an MCP server would let Claude, Gemini CLI, or any IDE agent query NSW data — high portfolio value, small effort.
- **A2A (Agent2Agent protocol)** — https://a2a-protocol.org — Google-initiated standard for agents talking to agents; skim for awareness, don't build on it yet.

## Part 4 — So should fli move to a framework?

Honest engineering answer:

- **Keep the hand-rolled loop while**: one agent, ~11 tools, single-turn-ish interactions, no persistence needs. Frameworks would add dependencies without adding capability. What IS worth stealing now: their *eval discipline* (promptfoo or `adk eval` over a fixed question set) and *tracing* (log every tool call + tokens + latency).
- **Move (to ADK first, LangGraph as the comparison) when any of these land on the roadmap**: the v2 supervisor/workflow agents (shortlist builder, suburb deep-research), session memory across visits, human-approval steps, or long-running jobs that must survive a restart. Those are exactly the things that are painful by hand and free in a graph runtime.
- **Long-term skills bet**: the frameworks churn; the concepts don't. Prioritise: context engineering > workflow patterns > evals/observability > any specific framework API. A person who can design the graph can learn any framework's syntax in a day.

## Suggested 4-week path

1. **Week 1 — concepts**: Anthropic "building effective agents" + 12-Factor Agents + ReAct paper. Annotate `lib/agent.ts` with the vocabulary (seriously — comment which line is which concept).
2. **Week 2 — ADK**: quickstart, then rebuild "analyse this parcel" as a Sequential(Parallel(tools) → summarise) workflow agent in a scratch repo against the same NSW endpoints. Run `adk eval` with 10 golden questions.
3. **Week 3 — LangGraph**: port the same thing; add a checkpointer and a human-approval interrupt before "expensive" tools. Compare the two ports: which failures disappeared, which appeared.
4. **Week 4 — production concerns**: LangSmith or Vertex tracing on either port; write 20-question eval taxonomy for fli (zoning/hazard/value/schools/out-of-scope); wire promptfoo into `npm test`. This week is what separates demos from products — and it's the week most people skip.
