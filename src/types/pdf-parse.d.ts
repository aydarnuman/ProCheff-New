declare module 'pdf-parse' {
  const pdf: (buffer: Buffer) => Promise<{
    text?: string;
    info?: { Title?: string; Author?: string; Producer?: string };
    numpages?: number;
  }>;
  export default pdf;
}
