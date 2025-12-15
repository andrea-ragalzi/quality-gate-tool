import { Finding } from "./types";

export const formatDate = (ts: number) => new Date(ts).toLocaleString();

export const formatRelativeTime = (ts: number) => {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

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
