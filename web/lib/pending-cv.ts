let _file: File | null = null;
let _jd: string = "";

export function setPendingCv(file: File, jd: string) {
  _file = file;
  _jd = jd;
}

export function consumePendingCv(): { file: File; jd: string } | null {
  if (!_file) return null;
  const out = { file: _file, jd: _jd };
  _file = null;
  _jd = "";
  return out;
}
