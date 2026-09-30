# Claix TypeScript SDK

Official TypeScript client for the [Claix](https://www.claix.dev) document intelligence API.

Extract PDFs, Excel, Word, images, audio, and text into schema-validated JSON. Query persisted documents and knowledge spaces. Drop the same client into **LangChain.js**, **CrewAI (TypeScript)** and **LlamaIndex.TS**.

The TypeScript CrewAI tools target [`@crewai-ts/core`](https://www.npmjs.com/package/@crewai-ts/core). The official CrewAI Python runtime still uses [`claix-python`](https://github.com/Gaelproodoos/claix-python) (`pip install 'claix-ai[crewai]'`).

- Docs: https://www.claix.dev/documentation/sdks/typescript
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
const result = await client.extract.pdf("invoice.pdf", "3c7a9f21-4b8e-4d1a-9c6f-2e0d8a5b7c4f");
console.log(result.data);
```

Questions accept a string (sent as `format: "string"`) or `{ question, format }` with `string | int | boolean | timestamp | array`.

```ts
const answers = await client.context.ask(result.document_id as string, [
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

Tools: `claix_extract`, `claix_document_context`, `claix_space_context`, `claix_add_to_space`, `claix_remove_from_space`, `claix_replace_document`.

## CrewAI (TypeScript)

```ts
import { Agent } from "@crewai-ts/core";
import { ClaixClient } from "claix-ai";
import { createClaixCrewTools } from "claix-ai/crewai";

const tools = await createClaixCrewTools(new ClaixClient());
const analyst = new Agent({
  role: "Document auditor",
  goal: "Extract contracts and reconcile them against invoices",
  backstory: "You never guess missing fields; you trust Claix nulls.",
  tools,
});
```

Tools: `claix_document`, `claix_knowledge_space`, `claix_add_to_space`, `claix_remove_from_space`, `claix_replace_document`.

## LlamaIndex.TS

```ts
import { ClaixClient } from "claix-ai";
import { createClaixLlamaIndexTools } from "claix-ai/llamaindex";

const tools = await createClaixLlamaIndexTools(new ClaixClient());
```

## SDK map

| SDK method | HTTP |
| --- | --- |
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

Auth header: `x-api-key`. Default timeout 120s, with retries on 429/502/503/504.
