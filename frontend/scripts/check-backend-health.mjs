const backendUrl = process.env.BACKEND_HEALTHCHECK_URL || "http://127.0.0.1:8000/health";

async function main() {
  try {
    const response = await fetch(backendUrl, { method: "GET" });
    if (!response.ok) {
      console.error(
        `[precheck] Backend healthcheck failed at ${backendUrl} (status ${response.status}).`,
      );
      console.error("[precheck] Start backend first (for example: `docker compose up --build`).");
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[precheck] Backend is not reachable at ${backendUrl}: ${message}`);
    console.error("[precheck] Start backend first (for example: `docker compose up --build`).");
    process.exit(1);
  }

  console.log(`[precheck] Backend is healthy at ${backendUrl}`);
}

await main();

