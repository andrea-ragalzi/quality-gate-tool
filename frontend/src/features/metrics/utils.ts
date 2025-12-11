import { Finding } from "./types";

export const formatDate = (ts: number) => new Date(ts).toLocaleString();

export const formatISO = (ts: number) => new Date(ts).toISOString();

export const copyToClipboard = (text: string, onSuccess: () => void) => {
  navigator.clipboard.writeText(text).then(() => {
    onSuccess();
  });
};

// --- Serializers ---

export const serializeTable = (data: Finding[]) => {
  return data
    .map(
      (f) =>
        `${f.type};${f.tool};${f.line};${f.filepath};${f.message};${formatDate(
          f.timestamp,
        )}`,
    )
    .join("\n");
};

export const serializeJSON = (data: Finding[]) => JSON.stringify(data, null, 2);

export const serializeYAML = (data: Finding[]) => {
  return data
    .map((f) => {
      return `- id: ${f.id}
  tool: ${f.tool}
  type: ${f.type}
  message: "${f.message}"
  filepath: ${f.filepath}
  line: ${f.line}
  timestamp: ${formatISO(f.timestamp)}`;
    })
    .join("\n");
};

export const serializeTOON = (data: Finding[]) => {
  const header =
    "findings[" +
    data.length +
    "]{id,tool,type,message,filepath,timestamp,line}:";
  const rows = data
    .map(
      (f) =>
        `${f.id},${f.tool},${f.type},'${f.message}',${f.filepath},${formatISO(
          f.timestamp,
        )},${f.line}`,
    )
    .join("\n");
  return `${header}\n${rows}`;
};

export const serializeRAW = (data: Finding[]) => {
  return data
    .map(
      (f) =>
        `[${f.type.toUpperCase()}] [${f.tool}] {${f.filepath}}:{${f.line}} - ${
          f.message
        } (${f.id})`,
    )
    .join("\n");
};
