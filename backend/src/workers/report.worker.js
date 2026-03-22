const { parentPort, workerData } = require("worker_threads");

function heavyCount(startDate, endDate) {
  const from = new Date(startDate).getTime();
  const to = new Date(endDate).getTime();
  const days = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));

  let checksum = 0;
  for (let i = 0; i < days * 30_000; i += 1) {
    checksum += (i * 13) % 17;
  }

  return {
    totalEntries: days * 230 + (checksum % 50),
    totalInspections: days * 17 + (checksum % 15),
  };
}

try {
  const startedAt = Date.now();
  const stats = heavyCount(workerData.fromDate, workerData.toDate);
  parentPort.postMessage({
    ...stats,
    workerDurationMs: Date.now() - startedAt,
  });
} catch (error) {
  parentPort.postMessage({
    error: error.message || "Worker failed",
  });
}
