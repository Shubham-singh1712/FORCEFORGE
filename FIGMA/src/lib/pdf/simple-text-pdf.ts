type PDFPage = {
  title: string;
  lines: string[];
};

function sanitizeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function wrapLine(value: string, maxLength = 88) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function pageStream(page: PDFPage) {
  const rows = [
    "BT",
    "/F1 18 Tf",
    "50 770 Td",
    `(${sanitizeText(page.title)}) Tj`,
    "0 -24 Td",
    "/F1 11 Tf",
  ];

  for (const line of page.lines) {
    rows.push(`(${sanitizeText(line)}) Tj`);
    rows.push("0 -16 Td");
  }

  rows.push("ET");
  return rows.join("\n");
}

export function createSimpleTextPdf(pages: PDFPage[]) {
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const kidsRefs: string[] = [];
  let nextObjectNumber = 3;

  for (const _page of pages) {
    const pageObjectNumber = nextObjectNumber++;
    const contentObjectNumber = nextObjectNumber++;
    pageObjectNumbers.push(pageObjectNumber);
    contentObjectNumbers.push(contentObjectNumber);
    kidsRefs.push(`${pageObjectNumber} 0 R`);
  }

  const fontObjectNumber = nextObjectNumber++;

  objects.push(`<< /Type /Pages /Kids [${kidsRefs.join(" ")}] /Count ${pages.length} >>`);

  pages.forEach((page, index) => {
    const content = pageStream(page);
    const pageObjectNumber = pageObjectNumbers[index];
    const contentObjectNumber = contentObjectNumbers[index];

    objects[pageObjectNumber - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber - 1] =
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  objects[fontObjectNumber - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((objectBody, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objectBody}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}

export function paginateTextSections(sections: PDFPage[]) {
  const pages: PDFPage[] = [];

  for (const section of sections) {
    const wrappedLines = section.lines.flatMap((line) => wrapLine(line));

    if (wrappedLines.length === 0) {
      pages.push({ title: section.title, lines: ["No data available."] });
      continue;
    }

    const linesPerPage = 40;

    for (let start = 0; start < wrappedLines.length; start += linesPerPage) {
      const slice = wrappedLines.slice(start, start + linesPerPage);
      const suffix =
        wrappedLines.length > linesPerPage
          ? ` (${Math.floor(start / linesPerPage) + 1}/${Math.ceil(wrappedLines.length / linesPerPage)})`
          : "";

      pages.push({
        title: `${section.title}${suffix}`,
        lines: slice,
      });
    }
  }

  return pages;
}
