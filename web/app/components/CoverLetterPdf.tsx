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

const TEXT = "#1a1917";
const MUTED = "#3d3b39";

const styles = StyleSheet.create({
  page: { paddingVertical: 64, paddingHorizontal: 72, backgroundColor: "#ffffff", fontFamily: "InstrumentSans", color: TEXT },
  paragraph: { fontSize: 11.5, lineHeight: 1.75, color: MUTED, marginBottom: 14 },
  bold: { fontWeight: 700, color: TEXT },
});

type Segment = { bold: boolean; text: string };

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\*\*(.+?)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) segments.push({ bold: false, text: text.slice(last, match.index) });
    segments.push({ bold: !!match[1], text: match[1] ?? match[2] });
    last = regex.lastIndex;
  }
  if (last < text.length) segments.push({ bold: false, text: text.slice(last) });
  return segments;
}

export function CoverLetterPdf({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {paragraphs.map((p, i) => {
          const segments = parseInline(p);
          return (
            <Text key={i} style={styles.paragraph}>
              {segments.map((seg, j) =>
                seg.bold
                  ? <Text key={j} style={styles.bold}>{seg.text}</Text>
                  : seg.text
              )}
            </Text>
          );
        })}
      </Page>
    </Document>
  );
}
