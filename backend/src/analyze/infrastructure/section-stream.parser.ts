/**
 * Incremental parser over a streamed JSON object (Claude tool-use input).
 *
 * Detects the completion of each top-level property and emits it as soon as
 * its value closes — the backbone of progressive section streaming. Not a
 * general JSON parser: it only tracks string/escape state and brace depth,
 * then JSON.parse()es the exact slice of each completed depth-1 value, so a
 * completed section is always full, valid JSON (never a truncated guess).
 *
 * Failure containment: a slice that fails to parse (or a handler that throws)
 * skips that section only, and any internal scan error permanently disables
 * the parser — the final `analysis_done` payload remains the source of truth
 * either way.
 */
export class SectionStreamParser {
  private buffer = '';
  private scanned = 0;
  private depth = 0;
  private inString = false;
  private escape = false;
  private expectKey = false;
  private capturingKey = false;
  private keyChars: string[] = [];
  private currentKey: string | null = null;
  /** Saw `"key":` — the value token hasn't started yet. */
  private awaitingValue = false;
  private inValue = false;
  private valueIsComposite = false;
  private valueStart = -1;
  private disabled = false;

  constructor(
    private readonly handlers: {
      /** Fired once per top-level key, when its value starts generating. */
      onSectionStart?: (key: string) => void;
      /** Fired once per top-level key, with the fully parsed value. */
      onSection: (key: string, value: unknown) => void;
    },
  ) {}

  push(delta: string): void {
    if (this.disabled) return;
    this.buffer += delta;
    try {
      this.scan();
    } catch {
      this.disabled = true;
    }
  }

  private scan(): void {
    const buf = this.buffer;
    for (let i = this.scanned; i < buf.length; i++) {
      const c = buf[i];

      if (this.inString) {
        if (this.escape) {
          this.escape = false;
          continue;
        }
        if (c === '\\') {
          this.escape = true;
          continue;
        }
        if (c === '"') {
          this.inString = false;
          if (this.capturingKey) {
            this.capturingKey = false;
            this.currentKey = this.keyChars.join('');
            this.keyChars = [];
            this.expectKey = false;
          } else if (this.depth === 1 && this.inValue && !this.valueIsComposite) {
            // Top-level string scalar just closed.
            this.completeValue(i);
          }
        } else if (this.capturingKey) {
          this.keyChars.push(c);
        }
        continue;
      }

      switch (c) {
        case '"':
          this.inString = true;
          if (this.depth === 1 && this.expectKey) {
            this.capturingKey = true;
            this.keyChars = [];
          } else if (this.depth === 1 && this.awaitingValue) {
            this.beginValue(i, false);
          }
          break;

        case '{':
        case '[':
          if (this.depth === 0) {
            // Root object opens.
            this.depth = 1;
            this.expectKey = true;
            break;
          }
          if (this.depth === 1 && this.awaitingValue) {
            this.beginValue(i, true);
          }
          this.depth++;
          break;

        case '}':
        case ']':
          if (this.depth === 2 && this.inValue && this.valueIsComposite) {
            // Outermost closer of a top-level composite value.
            this.depth--;
            this.completeValue(i);
            break;
          }
          if (this.depth === 1 && this.inValue && !this.valueIsComposite) {
            // Root object closes right after a bare scalar.
            this.completeValue(i - 1);
          }
          this.depth--;
          break;

        case ':':
          if (this.depth === 1 && this.currentKey !== null && !this.inValue) {
            this.awaitingValue = true;
          }
          break;

        case ',':
          if (this.depth === 1) {
            if (this.inValue && !this.valueIsComposite) {
              this.completeValue(i - 1);
            }
            this.expectKey = true;
          }
          break;

        default:
          // First char of a bare scalar (number / true / false / null).
          if (this.depth === 1 && this.awaitingValue && !/\s/.test(c)) {
            this.beginValue(i, false);
          }
      }
    }
    this.scanned = buf.length;
  }

  private beginValue(index: number, composite: boolean): void {
    this.inValue = true;
    this.valueIsComposite = composite;
    this.valueStart = index;
    this.awaitingValue = false;
    if (this.currentKey !== null) {
      try {
        this.handlers.onSectionStart?.(this.currentKey);
      } catch {
        // Handler errors never break the scan.
      }
    }
  }

  private completeValue(endInclusive: number): void {
    const key = this.currentKey;
    const slice = this.buffer.slice(this.valueStart, endInclusive + 1).trim();
    this.inValue = false;
    this.valueIsComposite = false;
    this.currentKey = null;
    this.valueStart = -1;
    if (key === null || slice === '') return;
    try {
      const value: unknown = JSON.parse(slice);
      this.handlers.onSection(key, value);
    } catch {
      // Malformed slice or throwing handler: skip this section — the final
      // analysis_done payload is the source of truth.
    }
  }
}
