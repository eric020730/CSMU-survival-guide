import { marked } from 'marked';
import DOMPurify from 'dompurify';
export function previewHTML(source) {
  return DOMPurify.sanitize(marked.parse(source), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style','form','input','button','textarea','select'],
    FORBID_ATTR: ['style'],
  });
}
