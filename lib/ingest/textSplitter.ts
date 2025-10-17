export interface Section {
  title: string;
  content: string;
}

export function splitSections(raw: string): Section[] {
  const sections: Section[] = [];
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let current: Section | null = null;

  for (const line of lines) {
    if (/^[A-ZÇĞİÖŞÜ0-9 .-]{4,}$/.test(line)) {
      if (current) sections.push(current);
      current = { title: line, content: "" };
    } else if (current) {
      current.content += (current.content ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  return sections;
}
