import { matchKeywords, missingRequired } from './keyword-match';

/** Grab a single keyword entry by canonical name, or undefined. */
function term(result: ReturnType<typeof matchKeywords>, name: string) {
  return result.keywords.find((k) => k.term === name);
}

describe('matchKeywords', () => {
  describe('extraction scope', () => {
    it('only surfaces skills the JD actually mentions', () => {
      const r = matchKeywords(
        'We need a React and TypeScript engineer.',
        'I know React, TypeScript and Python.',
      );
      const names = r.keywords.map((k) => k.term).sort();
      // Python is in the CV but not the JD → out of scope.
      expect(names).toEqual(['React', 'TypeScript']);
    });

    it('returns an empty, null-coverage result for a JD with no known skills', () => {
      const r = matchKeywords(
        'Looking for a warm, empathetic barista who loves people.',
        'I make great coffee and smile a lot.',
      );
      expect(r.keywords).toEqual([]);
      expect(r.totalCount).toBe(0);
      expect(r.matchedCount).toBe(0);
      expect(r.coverageScore).toBeNull();
    });
  });

  describe('word boundaries (the precision guarantee)', () => {
    it('does not match "Java" inside "JavaScript"', () => {
      const r = matchKeywords('Strong JavaScript skills required.', 'javascript dev');
      expect(term(r, 'Java')).toBeUndefined();
      expect(term(r, 'JavaScript')).toBeDefined();
    });

    it('does not match "React" inside "reactive"', () => {
      const r = matchKeywords('Experience with React.', 'I write reactive streams but never touched the library');
      const react = term(r, 'React');
      expect(react).toBeDefined();
      expect(react?.presentInCv).toBe(false); // "reactive" must not count as React
    });

    it('does not match "Go" inside "go to market"', () => {
      const r = matchKeywords('Own the go to market motion.', 'go getter');
      expect(term(r, 'Go')).toBeUndefined();
    });
  });

  describe('symbol-bearing tech terms', () => {
    it('matches C++ and C# without matching bare C', () => {
      const r = matchKeywords('C++ and C# roles.', 'Built engines in C++ and tools in C#.');
      expect(term(r, 'C++')?.presentInCv).toBe(true);
      expect(term(r, 'C#')?.presentInCv).toBe(true);
      expect(term(r, 'C')).toBeUndefined();
    });

    it('matches Node.js across "node.js", "nodejs" and "node js"', () => {
      expect(term(matchKeywords('node.js', 'x'), 'Node.js')).toBeDefined();
      expect(term(matchKeywords('nodejs', 'x'), 'Node.js')).toBeDefined();
      expect(term(matchKeywords('node js', 'x'), 'Node.js')).toBeDefined();
    });

    it('matches CI/CD across slash, hyphen and spaced forms', () => {
      expect(term(matchKeywords('ci/cd pipelines', 'x'), 'CI/CD')).toBeDefined();
      expect(term(matchKeywords('ci-cd pipelines', 'x'), 'CI/CD')).toBeDefined();
      expect(term(matchKeywords('continuous integration', 'x'), 'CI/CD')).toBeDefined();
    });

    it('does not match ".NET" inside "asp.net" as a false bare hit', () => {
      const r = matchKeywords('ASP.NET shop', 'asp.net core');
      // Both spellings collapse to the same ".NET" entry — the point is it's
      // recognised, once, not double-counted as two separate skills.
      expect(term(r, '.NET')?.presentInCv).toBe(true);
    });
  });

  describe('multi-word separator flexibility', () => {
    it('matches "Machine Learning" with a hyphen', () => {
      const r = matchKeywords('machine-learning platform', 'built machine learning models');
      const ml = term(r, 'Machine Learning');
      expect(ml).toBeDefined();
      expect(ml?.presentInCv).toBe(true);
    });
  });

  describe('normalization', () => {
    it('is case- and accent-insensitive', () => {
      const r = matchKeywords('KUBERNETES and Kafka', 'kubernetes, kafká');
      expect(term(r, 'Kubernetes')?.presentInCv).toBe(true);
      expect(term(r, 'Kafka')?.presentInCv).toBe(true);
    });
  });

  describe('required detection', () => {
    it('flags a skill framed as required', () => {
      const r = matchKeywords('TypeScript is required. Redis is a nice-to-have.', 'x');
      expect(term(r, 'TypeScript')?.required).toBe(true);
    });

    it('flags "5+ years of Python" as required', () => {
      const r = matchKeywords('5+ years of Python experience.', 'x');
      expect(term(r, 'Python')?.required).toBe(true);
    });

    it('leaves a plainly-listed skill optional', () => {
      const r = matchKeywords('Bonus points for Grafana.', 'x');
      expect(term(r, 'Grafana')?.required).toBe(false);
    });
  });

  describe('frequency', () => {
    it('counts JD and CV mentions per skill', () => {
      const r = matchKeywords('React React React', 'react');
      const react = term(r, 'React');
      expect(react?.jdFrequency).toBe(3);
      expect(react?.cvFrequency).toBe(1);
    });
  });

  describe('coverage score', () => {
    it('is 100 when every JD skill is present', () => {
      const r = matchKeywords('React and TypeScript', 'react typescript');
      expect(r.coverageScore).toBe(100);
      expect(r.matchedCount).toBe(2);
      expect(r.totalCount).toBe(2);
    });

    it('is 0 when no JD skill is present', () => {
      const r = matchKeywords('React and TypeScript', 'I only know cobol');
      expect(r.coverageScore).toBe(0);
    });

    it('weights required skills 2x', () => {
      // JD: TypeScript required (weight 2), Redis optional (weight 1).
      // CV has only Redis → matched weight 1 / total weight 3 = 33.
      const r = matchKeywords(
        'TypeScript is required. Redis is a plus.',
        'I use redis daily.',
      );
      expect(term(r, 'TypeScript')?.required).toBe(true);
      expect(term(r, 'Redis')?.required).toBe(false);
      expect(r.coverageScore).toBe(33);
    });
  });

  describe('sorting', () => {
    it('orders missing-required first, then missing, then present', () => {
      const r = matchKeywords(
        'TypeScript is required. Docker required. React is nice. Redis a plus.',
        'I only know React.',
      );
      // Missing-required (TypeScript, Docker) come before present (React).
      const ranks = r.keywords.map((k) =>
        !k.presentInCv && k.required ? 0 : !k.presentInCv ? 1 : 2,
      );
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(ranks).toEqual(sorted);
    });
  });

  describe('determinism', () => {
    it('returns identical output for identical input', () => {
      const jd = 'Senior Go engineer: Kubernetes, Terraform, PostgreSQL required. React a plus.';
      const cv = 'Golang, k8s and postgres experience. Some terraform.';
      expect(matchKeywords(jd, cv)).toEqual(matchKeywords(jd, cv));
    });
  });

  describe('missingRequired helper', () => {
    it('returns only required skills absent from the CV', () => {
      const r = matchKeywords(
        'TypeScript required. Docker required. Redis a plus.',
        'I use docker and redis.',
      );
      const missing = missingRequired(r).map((k) => k.term);
      expect(missing).toEqual(['TypeScript']);
    });
  });
});
