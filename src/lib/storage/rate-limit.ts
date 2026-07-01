import type { StorageContext } from "./shared";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitRule {
  identifier: string;
  windowSeconds: number;
  maxAttempts: number;
}

// Per-username: tight, since a single account being brute-forced is
// the main threat. Per-IP: loose, so a shared office/VPN address
// doesn't get blocked from normal use.
const USERNAME_RULE = { windowSeconds: 60, maxAttempts: 5 };
const IP_RULE = { windowSeconds: 300, maxAttempts: 20 };

function buildRules(ip: string | null, username: string): RateLimitRule[] {
  const rules: RateLimitRule[] = [
    { identifier: `user:${username.toLowerCase()}`, ...USERNAME_RULE },
  ];

  if (ip) {
    rules.push({ identifier: `ip:${ip}`, ...IP_RULE });
  }

  return rules;
}

export function createRateLimitStorage(ctx: StorageContext) {
  return {
    // Rate limiting is a defense layer, not the core login function —
    // if the check itself fails (e.g. migration not applied yet), we
    // fail open and let the login proceed rather than lock everyone out.
    async checkLoginRateLimit(
      ip: string | null,
      username: string,
    ): Promise<RateLimitResult> {
      const rules = buildRules(ip, username);

      for (const rule of rules) {
        try {
          const { data, error } = await ctx
            .db()
            .rpc("count_recent_login_attempts", {
              p_identifier: rule.identifier,
              p_window_seconds: rule.windowSeconds,
            });

          if (error) throw error;

          if (((data as number) ?? 0) >= rule.maxAttempts) {
            return { allowed: false, retryAfterSeconds: rule.windowSeconds };
          }
        } catch (err) {
          console.error("Login rate limit check failed, failing open", err);
        }
      }

      return { allowed: true, retryAfterSeconds: 0 };
    },

    async recordFailedLoginAttempt(
      ip: string | null,
      username: string,
    ): Promise<void> {
      const rules = buildRules(ip, username);

      await Promise.all(
        rules.map(async (rule) => {
          try {
            const { error } = await ctx
              .db()
              .rpc("record_failed_login_attempt", {
                p_identifier: rule.identifier,
              });

            if (error) throw error;
          } catch (err) {
            console.error("Failed to record login attempt", err);
          }
        }),
      );
    },
  };
}
