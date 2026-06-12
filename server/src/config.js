const weakSecrets = new Set([
  "development-secret",
  "replace-this-with-a-long-random-secret"
]);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getConfig() {
  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const jwtSecret = required("JWT_SECRET");
  if (process.env.NODE_ENV === "production" && (jwtSecret.length < 32 || weakSecrets.has(jwtSecret))) {
    throw new Error("JWT_SECRET must be a unique value of at least 32 characters in production");
  }

  return {
    port,
    mongoUri: required("MONGO_URI"),
    jwtSecret,
    clientOrigins: (process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  };
}
