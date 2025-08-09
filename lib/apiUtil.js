export function json(data, init = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === "number" ? init : init.status,
    headers: { "content-type": "application/json" },
  });
}

export function err(message, status = 400) {
  return json({ error: message }, status);
}
