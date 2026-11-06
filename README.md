# Claix TypeScript SDK

Official TypeScript client for [Claix](https://www.claix.dev), the security layer between your SQL database and AI agents.

Claix connects to your database and lets each agent retrieve only the tables and columns you allow, and run only the changes your rules allow. Your data stays where it is. You pay per use, over REST, MCP, or A2A.

**Retrieve and Guard are the primary calls.** Ingest stays on the same client.

| | |
| --- | --- |
| **Claix Retrieve** | Controlled reads from the live database. The agent asks in plain language and gets raw rows or typed answers. PostgreSQL, MySQL, and MariaDB. `client.retrieve.ask` → `POST /retrieve/{agent_name}` |
| **Claix Guard** | Checks every `INSERT`, `UPDATE`, and `DELETE` an agent proposes. Returns allow or deny, with the reason. Claix does not run the statement. Your code does. `client.guard.check` → `POST /check-sql` |
| **Claix Ingest** | Turns PDFs, Excel, Word, images, audio, and text into schema-validated JSON, and keeps document context and knowledge spaces. |

Tools for **LangChain.js**, **CrewAI (TypeScript)**, and **LlamaIndex.TS** include Retrieve and Guard first.

The TypeScript CrewAI tools target [`@crewai-ts/core`](https://www.npmjs.com/package/@crewai-ts/core). The official CrewAI Python runtime still uses [`claix-python`](https://github.com/Gaelproodoos/claix-python) (`pip install 'claix-ai[crewai]'`).

- Site: https://www.claix.dev
- Retrieve: https://www.claix.dev/documentation/call-an-agent
- Guard: https://www.claix.dev/documentation/check-sql
- SDK docs: https://www.claix.dev/documentation/sdks/typescript
- Python SDK: https://github.com/Gaelproodoos/claix-python
- OpenAPI: https://www.claix.dev/openapi.yaml

## Install

```bash
npm install claix-ai
npm install claix-ai @langchain/core zod
npm install claix-ai @crewai-ts/core
npm install claix-ai llamaindex
```

Requires **Node.js ≥ 18**. Set `CLAIX_API_KEY` or pass `apiKey` to the client.

## Quickstart

```ts
import { ClaixClient } from "claix-ai";

const client = new ClaixClient();

const answers = await client.retrieve.ask("orders-agent", [
  { question: "How many orders are confirmed?", format: "int" },
]);

const decision = await client.guard.check(
  "UPDATE orders SET discount = $1 WHERE id = $2",
  { params: [0.35, 90421] },
);

console.log(answers.ia_response, decision.allowed, decision.reason);
```

Retrieve formats: `string`, `int`, `boolean`, `timestamp`, `timestamptz`, `timestampz`, `date`, `json`, `array`, `array:string`, `array:int`. A plain string is sent as `format: "string"`. Up to 5 questions, 400 characters each.

Guard answers allow or deny. A denial is still HTTP 200. Pass `connectionId` only when the account has more than one active connection. Claix does not execute the statement.

Document and knowledge-space questions stay `string | int | boolean | timestamp | array`.

```ts
const result = await client.extract.pdf("invoice.pdf", "3c7a9f21-4b8e-4d1a-9c6f-2e0d8a5b7c4f");
const stored = await client.context.ask(result.document_id as string, [
  { question: "What is the total?", format: "int" },
]);
```

## LangChain.js

```ts
import { ClaixClient } from "claix-ai";
import { createClaixLangChainTools } from "claix-ai/langchain";

const client = new ClaixClient();
const tools = await createClaixLangChainTools(client);
```

Tools: `claix_retrieve`, `claix_guard`, `claix_extract`, `claix_document_context`, `claix_space_context`, `claix_add_to_space`, `claix_remove_from_space`, `claix_replace_document`.

## CrewAI (TypeScript)

```ts
import { Agent } from "@crewai-ts/core";
import { ClaixClient } from "claix-ai";
import { createClaixCrewTools } from "claix-ai/crewai";

const tools = await createClaixCrewTools(new ClaixClient());
const analyst = new Agent({
  role: "Database operator",
  goal: "Read orders through Retrieve and check every write with Guard",
  backstory: "You never run a write that Claix denied.",
  tools,
});
```

Tools: `claix_retrieve`, `claix_guard`, `claix_document`, `claix_knowledge_space`, `claix_add_to_space`, `claix_remove_from_space`, `claix_replace_document`.

## LlamaIndex.TS

```ts
import { ClaixClient } from "claix-ai";
import { createClaixLlamaIndexTools } from "claix-ai/llamaindex";

const tools = await createClaixLlamaIndexTools(new ClaixClient());
```

Tools start with `ask_retrieve_agent` and `check_sql`.

## SDK map

| SDK method | HTTP |
| --- | --- |
| `client.retrieve.ask(agentName, questions)` | `POST /retrieve/{agent_name}` |
| `client.guard.check(sql, { params, connectionId })` | `POST /check-sql` |
| `client.extract.pdf(file, schemaId, { spaceId, isAgentMode })` | `POST /api/pdf-json` or `POST /agent/pdf-json` |
| `client.extract.excel(...)` | `POST /api/excel-json` or `POST /agent/excel-json` |
| `client.extract.document(...)` | `POST /api/doc-json` or `POST /agent/doc-json` |
| `client.extract.image(...)` | `POST /api/img-json` or `POST /agent/img-json` |
| `client.extract.audio(...)` | `POST /api/audio-json` or `POST /agent/audio-json` |
| `client.extract.text(content, schemaId, ...)` | `POST /api/txt-json` or `POST /agent/txt-json` |
| `client.extract.jsonToExcel({ schemaId, data })` | `POST /api/json-excel` |
| `client.context.get(documentId)` | `GET /get-document/{id}` |
| `client.context.ask(documentId, questions)` | `POST /document-context/{id}` |
| `client.context.delete(documentId)` | `DELETE /delete-document/{id}` |
| `client.context.replace(documentId, newContentDocumentId)` | `POST /replace-document` |
| `client.spaces.create(name)` | `POST /create-space` |
| `client.spaces.add(documentId, spaceId)` | `POST /add-space` |
| `client.spaces.ask(spaceId, questions)` | `POST /space-context/{id}` |
| `client.spaces.removeDocument(documentId)` | `DELETE /remove-document-from-space/{id}` |
| `client.spaces.delete(spaceId)` | `DELETE /delete-space/{id}` |
| `client.schemas.list()` | `GET /api/schemas` |
| `client.schemas.get(schemaId)` | `GET /api/get-schema/{schemaId}` |
| `client.schemas.create(body)` | `POST /api/create-schema` |
| `client.schemas.update(schemaId, body)` | `PUT /api/update-schema/{schemaId}` |
| `client.schemas.delete(schemaId)` | `POST /api/delete-schema` |

Auth header: `x-api-key`. Retrieve and Guard use the site origin (`https://claix.dev`). Ingest uploads use `https://claix.dev/api`. Default timeout 120s, with retries on 429/502/503/504.
