export interface RevenueCatWebhookVerifier {
  /**
   * Throws when the request's Authorization header does not match the configured
   * shared secret. Fails closed (throws) when the secret is not configured, so a
   * misconfigured deploy never silently accepts unauthenticated webhooks.
   */
  verify(authorizationHeader: string | undefined): void;
}
