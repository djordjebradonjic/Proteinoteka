/**
 * Serializes data for a <script type="application/ld+json"> tag rendered through
 * dangerouslySetInnerHTML.
 *
 * Plain JSON.stringify leaves "<" untouched, so any string that ends up in the payload
 * (scraped product names, user review text, ...) containing "</script><script>..." would
 * close the tag early and run as HTML. Escaping "<", ">", "&" and the JS line separators as
 * \uXXXX keeps the output valid JSON that parsers decode back to the original characters,
 * while making it impossible to break out of the script element.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

export function safeJsonLd(data: unknown): string {
  return (JSON.stringify(data) ?? "null")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LINE_SEPARATOR).join("\\u2028")
    .split(PARAGRAPH_SEPARATOR).join("\\u2029");
}
