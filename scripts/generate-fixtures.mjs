// Generate small sample.pdf and sample.docx fixtures for smoke testing.
// Run: node scripts/generate-fixtures.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "..", "fixtures");

const sampleText =
  "I spent every Saturday morning at the community garden, pulling weeds alongside retirees who never asked about my GPA. Those quiet hours taught me that growth demands patience.";

// --- Minimal PDF (valid PDF 1.0) ---
function buildMinimalPdf(text) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET`;
  const objs = [];
  const offsets = [];
  let pos = 0;

  function add(s) {
    offsets.push(pos);
    objs.push(s);
    pos += Buffer.byteLength(s, "ascii");
  }

  const header = "%PDF-1.0\n";
  pos = Buffer.byteLength(header, "ascii");

  add(
    `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n`
  );
  add(
    `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n`
  );
  add(
    `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n`
  );
  add(
    `4 0 obj<</Length ${stream.length}>>\nstream\n${stream}\nendstream\nendobj\n`
  );
  add(
    `5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n`
  );

  const xrefOffset = pos;
  const xref = [
    "xref",
    `0 ${objs.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((o) => String(o).padStart(10, "0") + " 00000 n "),
  ].join("\n") + "\n";

  const trailer = `trailer<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return header + objs.join("") + xref + trailer;
}

fs.writeFileSync(path.join(fixturesDir, "sample.pdf"), buildMinimalPdf(sampleText), "ascii");
console.log("Created fixtures/sample.pdf");

// --- Minimal DOCX (valid zip with word/document.xml) ---
import { createWriteStream } from "fs";
import { Writable } from "stream";
import { createDeflateRaw } from "zlib";

// We'll write a bare-minimum zip manually (store, no compression)
function buildDocx(text) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const files = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypesXml) },
    { name: "_rels/.rels", data: Buffer.from(relsXml) },
    { name: "word/document.xml", data: Buffer.from(documentXml) },
  ];

  // Build zip (STORE method, no compression)
  const parts = [];
  const centralEntries = [];
  let offset = 0;

  for (const f of files) {
    const nameB = Buffer.from(f.name);
    // Local file header
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); // sig
    lh.writeUInt16LE(20, 4); // version
    lh.writeUInt16LE(0, 6); // flags
    lh.writeUInt16LE(0, 8); // method STORE
    lh.writeUInt16LE(0, 10); // mod time
    lh.writeUInt16LE(0, 12); // mod date
    // crc32
    const crc = crc32(f.data);
    lh.writeInt32LE(crc, 14);
    lh.writeUInt32LE(f.data.length, 18); // compressed
    lh.writeUInt32LE(f.data.length, 22); // uncompressed
    lh.writeUInt16LE(nameB.length, 26); // name len
    lh.writeUInt16LE(0, 28); // extra len

    const localOffset = offset;
    parts.push(lh, nameB, f.data);
    offset += lh.length + nameB.length + f.data.length;

    // Central directory header
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0, 14);
    ch.writeInt32LE(crc, 16);
    ch.writeUInt32LE(f.data.length, 20);
    ch.writeUInt32LE(f.data.length, 24);
    ch.writeUInt16LE(nameB.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(localOffset, 42);

    centralEntries.push(ch, nameB);
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const e of centralEntries) cdSize += e.length;

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...parts, ...centralEntries, eocd]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) | 0;
}

fs.writeFileSync(path.join(fixturesDir, "sample.docx"), buildDocx(sampleText));
console.log("Created fixtures/sample.docx");
