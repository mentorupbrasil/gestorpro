export type OperationalLog = Readonly<{
  durationMs?: number;
  errorCode?: string;
  event: string;
  requestId: string;
  route?: string;
  status?: number;
}>;

type LogSink = (serializedLog: string) => void;

function serialize(log: OperationalLog, level: "error" | "info" | "warn") {
  return JSON.stringify({
    durationMs: log.durationMs,
    errorCode: log.errorCode,
    event: log.event,
    level,
    requestId: log.requestId,
    route: log.route,
    status: log.status,
    timestamp: new Date().toISOString(),
  });
}

export function createOperationalLogger(sink?: LogSink) {
  const write = (level: "error" | "info" | "warn", log: OperationalLog) => {
    const serialized = serialize(log, level);
    if (sink) return sink(serialized);
    if (level === "error") return console.error(serialized);
    if (level === "warn") return console.warn(serialized);
    return console.info(serialized);
  };

  return {
    error: (log: OperationalLog) => write("error", log),
    info: (log: OperationalLog) => write("info", log),
    warn: (log: OperationalLog) => write("warn", log),
  } as const;
}
