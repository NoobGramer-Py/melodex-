const supabase = require('../lib/supabase');

/**
 * Middleware: verifies Supabase JWT from Authorization header.
 * Attaches req.user if valid. Calls next() regardless — routes
 * that require auth must check req.user themselves.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      req.user = null;
    } else {
      req.user = user;
    }
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    req.user = null;
  }
  next();
}

/**
 * Middleware: requires a valid authenticated user.
 * Returns 401 if not authenticated.
 */
async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });
}

module.exports = { optionalAuth, requireAuth };
