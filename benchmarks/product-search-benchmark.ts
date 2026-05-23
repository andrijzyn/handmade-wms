// Benchmark for /api/products search endpoint
// Sends a configurable number of concurrent GET requests with a sample query.
// Run with: `npx ts-node benchmarks/product-search-benchmark.ts` (ensure ts-node installed)

import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";

// Configuration
const TOTAL_REQUESTS = 5000; // total number of requests to fire
const CONCURRENCY = 50; // how many simultaneous requests
const QUERY = "11212122121%60212121"; // sample query (already URL‑encoded)
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000"; // adjust if needed

let completed = 0;
let failed = 0;
let totalTime = 0;

function makeRequest(): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const url = new URL("/api/products", BASE_URL);
    url.searchParams.set("q", QUERY);
    const lib = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = lib(url, { method: "GET" }, (res) => {
      // consume response body to free the socket
      res.on("data", () => {});
      res.on("end", () => {
        const duration = Date.now() - start;
        if (res.statusCode === 200) {
          resolve(duration);
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.end();
  });
}

async function runBatch(batchSize: number) {
  const promises = [];
  for (let i = 0; i < batchSize; i++) {
    promises.push(
      makeRequest()
        .then((t) => {
          completed++;
          totalTime += t;
        })
        .catch(() => {
          failed++;
        }),
    );
  }
  await Promise.all(promises);
}

(async () => {
  console.log(
    `Starting benchmark: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrency`,
  );
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);
  for (let i = 0; i < batches; i++) {
    const size =
      i === batches - 1 ? TOTAL_REQUESTS - i * CONCURRENCY : CONCURRENCY;
    // eslint-disable-next-line no-await-in-loop
    await runBatch(size);
    process.stdout.write(
      `\rCompleted ${Math.min((i + 1) * CONCURRENCY, TOTAL_REQUESTS)} / ${TOTAL_REQUESTS}`,
    );
  }
  console.log("\nBenchmark finished");
  console.log(`Successful: ${completed}`);
  console.log(`Failed: ${failed}`);
  if (completed > 0) {
    console.log(`Avg response time: ${(totalTime / completed).toFixed(2)} ms`);
  }
})();
