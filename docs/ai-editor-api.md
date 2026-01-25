# AI Editor API Contract

## Endpoint
`POST /api/ai-editor`

## Request
- Content-Type: `multipart/form-data`
- Fields:
  - `prompt` (string, required): Editing instructions for the AI editor.
  - `file` (file, required): Essay document to parse.

### Supported file types
- PDF (`application/pdf`)
- DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- TXT (`text/plain`)

### Limits
- Maximum file size: 10MB

## Success Response (200)
```json
{
  "prompt": "Highlight the strongest moments and suggest what to trim.",
  "filename": "draft.docx",
  "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text": "Parsed essay text..."
}
```

## Error Responses
- **400 Bad Request**
  - Missing prompt or file
  - Unsupported file type
  - Empty/unreadable document
- **413 Payload Too Large**
  - File exceeds 10MB

```json
{
  "error": "File too large. Please upload a file smaller than 10MB."
}
```
