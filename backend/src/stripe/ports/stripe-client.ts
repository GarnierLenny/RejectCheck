import StripeLib = require('stripe');

/**
 * The port re-exports the Stripe SDK type as-is. Use cases inject this token
 * to get a fully typed client without instantiating the SDK themselves.
 *
 * The Stripe SDK uses CommonJS `export =`, hence the `import = require()`
 * form. `StripeLib.Stripe` is the instance type; nested resource types are
 * accessed via the same path (e.g. `StripeLib.Stripe.Checkout.Session`).
 */
export type StripeClient = StripeLib.Stripe;
export type StripeNamespace = typeof StripeLib;
