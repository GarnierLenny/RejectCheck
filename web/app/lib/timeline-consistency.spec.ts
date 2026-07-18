import { describe, expect, it } from "vitest";

import type { CrossProfileInconsistency, TimelineEntry } from "../components/types";
import {
  GAP_MONTHS,
  computeTimelineConsistency,
  computeTimelineDecorations,
  type ConsistencyRow,
} from "./timeline-consistency";

// Frozen "now": July 2026.
const NOW = new Date(2026, 6, 15);

function entry(
  source: TimelineEntry["source"],
  company: string,
  title: string,
  start: string,
  end: string,
): TimelineEntry {
  return { source, company, title, start, end };
}

function row(rows: ConsistencyRow[], id: ConsistencyRow["id"]): ConsistencyRow {
  const found = rows.find((r) => r.id === id);
  if (!found) throw new Error(`row ${id} missing`);
  return found;
}

function inconsistency(field: CrossProfileInconsistency["field"]): CrossProfileInconsistency {
  return {
    severity: "major",
    sources: ["cv", "linkedin"],
    field,
    description: "dates differ",
    recruiter_perception: "sloppy",
    anchor_date: null,
  };
}

describe("computeTimelineConsistency", () => {
  it("single job: no fails, cross-source/progression/tenure are na", () => {
    const rows = computeTimelineConsistency(
      [entry("cv", "Acme", "Software Engineer", "2022-01", "present")],
      undefined,
      NOW,
    );
    expect(row(rows, "unexplained_gaps").status).toBe("pass");
    expect(row(rows, "cross_source_dates").status).toBe("na");
    expect(row(rows, "overlaps").status).toBe("pass");
    expect(row(rows, "forward_progression").status).toBe("na");
    expect(row(rows, "average_tenure").status).toBe("na");
    expect(row(rows, "future_dates").status).toBe("pass");
  });

  it("gap of exactly GAP_MONTHS (3) months passes; 4 months fails", () => {
    expect(GAP_MONTHS).toBe(3);
    // Jul, Aug, Sep 2020 unemployed = exactly 3 months → pass.
    const boundary = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Engineer", "2019-01", "2020-06"),
        entry("cv", "Globex", "Engineer", "2020-10", "present"),
      ],
      undefined,
      NOW,
    );
    expect(row(boundary, "unexplained_gaps").status).toBe("pass");
    expect(row(boundary, "unexplained_gaps").data.gaps).toBe(0);

    // Jul-Oct 2020 unemployed = 4 months → fail.
    const over = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Engineer", "2019-01", "2020-06"),
        entry("cv", "Globex", "Engineer", "2020-11", "present"),
      ],
      undefined,
      NOW,
    );
    expect(row(over, "unexplained_gaps").status).toBe("fail");
    expect(row(over, "unexplained_gaps").data).toEqual({ gaps: 1, longest_months: 4 });
  });

  it("freelance overlap warns, never fails", () => {
    const rows = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Engineer", "2020-01", "2022-12"),
        entry("cv", "Freelance", "Consultant", "2022-01", "present"),
      ],
      undefined,
      NOW,
    );
    const overlaps = row(rows, "overlaps");
    expect(overlaps.status).toBe("warn");
    expect(overlaps.data.overlaps).toBe(1);
    // 2022-01..2022-12 concurrent = 12 months.
    expect(overlaps.data.longest_months).toBe(12);
  });

  it("future date fails beyond the current month", () => {
    const rows = computeTimelineConsistency(
      [entry("cv", "Acme", "Engineer", "2027-01", "2027-06")],
      undefined,
      NOW,
    );
    expect(row(rows, "future_dates").status).toBe("fail");
    expect(row(rows, "future_dates").data.future).toBe(1);
  });

  it("current month is not a future date", () => {
    const rows = computeTimelineConsistency(
      [entry("cv", "Acme", "Engineer", "2024-01", "2026-07")],
      undefined,
      NOW,
    );
    expect(row(rows, "future_dates").status).toBe("pass");
  });

  it("null/unparseable dates exclude the entry instead of guessing", () => {
    const rows = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Engineer", "unknown", "2020-06"),
        entry("cv", "Globex", "Engineer", "2022-01", "present"),
      ],
      undefined,
      NOW,
    );
    // Only one dated role remains: no gap possible, tenure na.
    expect(row(rows, "unexplained_gaps").status).toBe("pass");
    expect(row(rows, "average_tenure").status).toBe("na");
    expect(row(rows, "average_tenure").data.roles).toBe(1);
    expect(row(rows, "future_dates").status).toBe("pass");
  });

  it("end 'present' resolves to now for range math", () => {
    // 2026-01..present (Jul 2026) and 2026-03..present overlap Mar-Jul = 5 months.
    const deco = computeTimelineDecorations(
      [
        entry("cv", "Acme", "Engineer", "2026-01", "present"),
        entry("cv", "Globex", "Engineer", "2026-03", "present"),
      ],
      NOW,
    );
    expect(deco.overlaps).toEqual([{ source: "cv", aIndex: 0, bIndex: 1, months: 5 }]);
  });

  it("cross_source_dates is na single-source, fails on a 'dates' inconsistency, passes otherwise", () => {
    const mono = computeTimelineConsistency(
      [entry("cv", "Acme", "Engineer", "2020-01", "present")],
      [inconsistency("dates")],
      NOW,
    );
    expect(row(mono, "cross_source_dates").status).toBe("na");

    const multi = [
      entry("cv", "Acme", "Engineer", "2020-01", "present"),
      entry("linkedin", "Acme", "Engineer", "2019-06", "present"),
    ];
    const failing = computeTimelineConsistency(multi, [inconsistency("dates")], NOW);
    expect(row(failing, "cross_source_dates").status).toBe("fail");
    expect(row(failing, "cross_source_dates").data.conflicts).toBe(1);

    const clean = computeTimelineConsistency(multi, [inconsistency("job_title")], NOW);
    expect(row(clean, "cross_source_dates").status).toBe("pass");
  });

  it("title regression warns (EN + FR keywords), forward progression passes", () => {
    const regressed = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Senior Engineer", "2018-01", "2021-06"),
        entry("cv", "Globex", "Développeur junior", "2021-09", "present"),
      ],
      undefined,
      NOW,
    );
    const reg = row(regressed, "forward_progression");
    expect(reg.status).toBe("warn");
    expect(reg.data.from).toBe("Senior Engineer");
    expect(reg.data.to).toBe("Développeur junior");

    const forward = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Junior Developer", "2016-01", "2018-12"),
        entry("cv", "Globex", "Senior Developer", "2019-01", "2022-12"),
        entry("cv", "Initech", "Lead Developer", "2023-01", "present"),
      ],
      undefined,
      NOW,
    );
    expect(row(forward, "forward_progression").status).toBe("pass");
    expect(row(forward, "forward_progression").data.ranked).toBe(3);
  });

  it("unrankable titles are skipped, not treated as junior", () => {
    const rows = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Senior Engineer", "2018-01", "2021-06"),
        // No seniority keyword → excluded, must NOT read as a regression.
        entry("cv", "Globex", "Engineering Manager", "2021-07", "present"),
      ],
      undefined,
      NOW,
    );
    expect(row(rows, "forward_progression").status).toBe("na");
  });

  it("average tenure of 12 months over 3 completed roles warns", () => {
    const rows = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Engineer", "2019-01", "2019-12"),
        entry("cv", "Globex", "Engineer", "2020-03", "2021-02"),
        entry("cv", "Initech", "Engineer", "2021-05", "2022-04"),
      ],
      undefined,
      NOW,
    );
    const tenure = row(rows, "average_tenure");
    expect(tenure.status).toBe("warn");
    expect(tenure.data).toEqual({ roles: 3, avg_months: 12 });
  });

  it("healthy tenure passes and ongoing roles are excluded from the average", () => {
    const rows = computeTimelineConsistency(
      [
        entry("cv", "Acme", "Engineer", "2016-01", "2018-12"), // 36 months
        entry("cv", "Globex", "Engineer", "2019-01", "2021-12"), // 36 months
        entry("cv", "Initech", "Engineer", "2022-01", "2023-12"), // 24 months
        entry("cv", "Hooli", "Engineer", "2024-01", "present"), // ongoing, excluded
      ],
      undefined,
      NOW,
    );
    const tenure = row(rows, "average_tenure");
    expect(tenure.status).toBe("pass");
    expect(tenure.data).toEqual({ roles: 3, avg_months: 32 });
  });
});

describe("computeTimelineDecorations", () => {
  it("multi-source fixture: full decorations snapshot", () => {
    const entries: TimelineEntry[] = [
      // CV lane: 6-month gap between Acme and Globex, then Globex overlaps a
      // freelance gig by 7 months.
      entry("cv", "Acme", "Junior Developer", "2018-01", "2019-06"),
      entry("cv", "Globex", "Senior Developer", "2020-01", "present"),
      entry("cv", "Freelance", "Consultant", "2019-12", "2020-07"),
      // LinkedIn lane: same jobs, no gap (dates massaged), no overlap > 1 month.
      entry("linkedin", "Acme", "Junior Developer", "2018-01", "2019-11"),
      entry("linkedin", "Globex", "Senior Developer", "2019-12", "present"),
      // GitHub lane: undated noise, excluded.
      entry("github", "side-project", "Maintainer", "n/a", "present"),
    ];

    // Deep-equality acts as the snapshot: any behavior change must edit this.
    expect(computeTimelineDecorations(entries, NOW)).toEqual({
      gaps: [
        {
          source: "cv",
          start: "2019-07",
          end: "2019-11",
          months: 5,
          afterCompany: "Acme",
          beforeCompany: "Freelance",
        },
      ],
      overlaps: [{ source: "cv", aIndex: 2, bIndex: 1, months: 7 }],
    });
  });

  it("contained short role never fabricates a gap after a longer one", () => {
    const deco = computeTimelineDecorations(
      [
        entry("cv", "Acme", "Engineer", "2018-01", "2022-12"),
        entry("cv", "SideGig", "Advisor", "2019-01", "2019-03"),
        entry("cv", "Globex", "Engineer", "2023-01", "present"),
      ],
      NOW,
    );
    expect(deco.gaps).toEqual([]);
  });
});
