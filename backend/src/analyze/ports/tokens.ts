/**
 * NestJS DI tokens for the analyze module ports. Use these strings in
 * @Inject() so use cases never depend on concrete adapter classes.
 */
export const ANALYSIS_REPOSITORY = Symbol('AnalysisRepository');
export const PROFILE_REPOSITORY = Symbol('ProfileRepository');
export const SAVED_CV_REPOSITORY = Symbol('SavedCvRepository');
export const CLAUDE_PROVIDER = Symbol('ClaudeProvider');
export const GITHUB_PROVIDER = Symbol('GithubProvider');
export const PDF_PARSER = Symbol('PdfParser');
// SUBSCRIPTION_GATE is project-wide — re-export it from common/ports so
// callers in this module keep a single import path. Module bindings live
// in StripeModule (provider) and AnalyzeModule (consumer via its export).
export { SUBSCRIPTION_GATE } from '../../common/ports/tokens';
