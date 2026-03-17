const User = require("../models/User");

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function getCookieToken(req) {
  const cookies = req.cookies || {};
  return (
    cookies["__Secure-next-auth.session-token"] ||
    cookies["next-auth.session-token"] ||
    null
  );
}

async function decodeNextAuthToken(token) {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.NEXT_AUTH_SECRET ||
    process.env.JWT_SECRET ||
    null;
  if (!secret) return null;

  // Lazy require so the server can still boot even if jose isn't installed yet.
  // (We'll add it to dependencies, but this avoids hard crashes in odd deploy states.)
  // eslint-disable-next-line global-require
  const { jwtVerify, jwtDecrypt } = require("jose");
  const key = new TextEncoder().encode(secret);

  // NextAuth may use either a signed JWT or an encrypted JWT (JWE) depending on config.
  try {
    const { payload } = await jwtVerify(token, key, {
      // Allow typical HS algorithms; NextAuth commonly uses HS512 for signed JWTs.
      algorithms: ["HS256", "HS384", "HS512"],
    });
    return payload;
  } catch (_) {
    // fallthrough
  }

  try {
    const { payload } = await jwtDecrypt(token, key);
    return payload;
  } catch (_) {
    return null;
  }
}

async function resolveUserFromClaims(claims) {
  if (!claims || typeof claims !== "object") return null;

  const maybeId =
    claims.sub ||
    claims.userId ||
    claims.id ||
    (claims.user && (claims.user.id || claims.user._id)) ||
    null;

  if (maybeId && typeof maybeId === "string") {
    const userById = await User.findById(maybeId);
    if (userById) return userById;
  }

  const maybeEmail =
    claims.email || (claims.user && claims.user.email) || null;
  if (maybeEmail && typeof maybeEmail === "string") {
    return await User.findOne({ email: maybeEmail });
  }

  return null;
}

async function requireAuth(req, res, next) {
  try {
    const userIdHeader = req.headers["x-user-id"];
    if (userIdHeader && typeof userIdHeader === "string") {
      const user = await User.findById(userIdHeader);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      req.user = user;
      return next();
    }

    const token = getBearerToken(req) || getCookieToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const claims = await decodeNextAuthToken(token);
    if (!claims) return res.status(401).json({ error: "Unauthorized" });

    const user = await resolveUserFromClaims(claims);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = user;
    req.auth = { claims };
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };

