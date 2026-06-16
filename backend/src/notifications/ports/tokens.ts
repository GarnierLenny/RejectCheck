/** DI token for the email sender adapter. Use cases inject the port via
 *  @Inject(EMAIL_SENDER) so they stay provider-agnostic. */
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
