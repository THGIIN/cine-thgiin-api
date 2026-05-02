import type { NextFunction, Request, Response } from 'express';

/**
 * Subconjunto de políticas do **Helmet** sem dependência extra:
 * reduz clickjacking, MIME sniffing e vazamento de referrer.
 * (Com `helmet` instalado, pode substituir esta função por `app.use(helmet({ ... }))`.)
 */
export function applyBasicSecurityMiddleware(expressApp: {
  use: (fn: (req: Request, res: Response, next: NextFunction) => void) => void;
}): void {
  expressApp.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}
