import React from "react";
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

const fontBase = typeof window !== "undefined" ? window.location.origin : "";

Font.register({
  family: "InstrumentSans",
  fonts: [
    { src: `${fontBase}/Instrument_Sans/static/InstrumentSans-Regular.ttf`, fontWeight: 400 },
    { src: `${fontBase}/Instrument_Sans/static/InstrumentSans-SemiBold.ttf`, fontWeight: 600 },
    { src: `${fontBase}/Instrument_Sans/static/InstrumentSans-Bold.ttf`, fontWeight: 700 },
  ],
});

const RED = "#C93A39";
const TEXT = "#1a1917";
const MUTED = "#5a5856";

const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, backgroundColor: "#ffffff", fontFamily: "InstrumentSans", color: TEXT },
  h2: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: TEXT, marginTop: 18, marginBottom: 3 },
  h2Rule: { height: 0.75, backgroundColor: "#d1d0ce", marginBottom: 7 },
  h3: { fontSize: 10.5, fontWeight: 700, color: TEXT, marginTop: 7, marginBottom: 1 },
  body: { fontSize: 10, lineHeight: 1.55, color: MUTED, marginBottom: 1 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1, marginLeft: 4 },
  bulletDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: RED, marginRight: 7, marginTop: 5 },
  bulletText: { fontSize: 10, lineHeight: 1.55, color: MUTED, flex: 1 },
  spacer: { height: 4 },
});

type Segment = { bold: boolean; text: string };

function parseInline(text: string): Segment[] {
  // Strip single asterisks used for italic (no italic font available)
  const cleaned = text.replace(/\*([^*]+)\*/g, '$1');
  const segments: Segment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > last) segments.push({ bold: false, text: cleaned.slice(last, match.index) });
    segments.push({ bold: true, text: match[1] });
    last = regex.lastIndex;
  }
  if (last < cleaned.length) segments.push({ bold: false, text: cleaned.slice(last) });
  return segments;
}

function RichText({ segments, style }: { segments: Segment[]; style: any }) {
  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.bold
          ? <Text key={i} style={{ fontWeight: 700, color: TEXT }}>{seg.text}</Text>
          : seg.text
      )}
    </Text>
  );
}

type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullet"; segments: Segment[] }
  | { type: "body"; segments: Segment[] }
  | { type: "spacer" };

function parse(cv: string): Block[] {
  const hasMarkdown = cv.includes("## ");
  const blocks: Block[] = [];

  for (const raw of cv.split("\n")) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      if (blocks.at(-1)?.type !== "spacer") blocks.push({ type: "spacer" });
      continue;
    }

    // Dividers — skip entirely
    if (/^-{3,}$/.test(trimmed)) continue;

    // Markdown headers
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      continue;
    }
    if (line.startsWith("## ")) { blocks.push({ type: "h2", text: line.slice(3).trim() }); continue; }
    if (line.startsWith("### ")) { blocks.push({ type: "h3", text: line.slice(4).trim() }); continue; }

    // Bullets (markdown or unicode)
    if (/^[-*•]\s+/.test(line)) {
      blocks.push({ type: "bullet", segments: parseInline(trimmed.replace(/^[-*•]\s+/, "")) });
      continue;
    }

    // Fallback for plain-text CVs: ALL-CAPS short lines = section headers
    if (!hasMarkdown && trimmed === trimmed.toUpperCase() && trimmed.length < 55 && /[A-Z]{2,}/.test(trimmed) && !/\d{4}/.test(trimmed)) {
      blocks.push({ type: "h2", text: trimmed });
      continue;
    }

    blocks.push({ type: "body", segments: parseInline(trimmed) });
  }

  return blocks;
}

export function CvRewritePdf({ cvText }: { cvText: string }) {
  const blocks = parse(cvText);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map((block, i) => {
          if (block.type === "spacer") return <View key={i} style={styles.spacer} />;
          if (block.type === "h1") return <Text key={i} style={styles.h2}>{block.text}</Text>;
          if (block.type === "h2") return (
            <View key={i}>
              <Text style={styles.h2}>{block.text}</Text>
              <View style={styles.h2Rule} />
            </View>
          );
          if (block.type === "h3") return <Text key={i} style={styles.h3}>{block.text}</Text>;
          if (block.type === "bullet") return (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <RichText segments={block.segments} style={styles.bulletText} />
            </View>
          );
          return <RichText key={i} segments={block.segments} style={styles.body} />;
        })}
      </Page>
    </Document>
  );
}
