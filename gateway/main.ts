// Wingport gateway entry point.
// Ticket T2 will implement the HTTP handlers and provider adapters.

console.log("Wingport gateway scaffold");

if (import.meta.main) {
  Deno.serve({ port: 8000 }, () => new Response("Wingport"));
}
