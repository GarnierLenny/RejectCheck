import { Controller, Delete, HttpCode, Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthUser, type AuthUserPayload } from '../auth/auth-user.decorator';
import { DeleteAccountUseCase } from './delete-account.use-case';

@ApiTags('Account')
@Controller('api/account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    private readonly deleteAccount: DeleteAccountUseCase,
    private readonly config: ConfigService,
  ) {}

  /**
   * Delete the CALLER's account. The identity comes from the verified JWT and
   * nothing else: there is deliberately no email parameter, no body and no id in
   * the path, because any of those would turn this into "delete anyone's account
   * by address".
   */
  @Delete()
  @UseGuards(SupabaseGuard)
  @HttpCode(200)
  @ApiOperation({ summary: "Permanently delete the caller's account and data" })
  async remove(@AuthUser() user: AuthUserPayload) {
    const result = await this.deleteAccount.execute(user.email);
    const authDeleted = await this.deleteAuthUser(user.sub);

    return {
      ok: true,
      ...result,
      /**
       * False means the DATA is gone but the Supabase auth record survives, so
       * the person can still sign in and would land on an empty account. Told
       * plainly rather than implied, because "your account is deleted" has to be
       * true when we say it.
       */
      authUserDeleted: authDeleted,
    };
  }

  /**
   * Remove the Supabase auth record. Optional: it needs a service-role key,
   * which this backend has never had (it only verifies JWTs via JWKS). Without
   * SUPABASE_SERVICE_ROLE_KEY the purge still runs and this returns false.
   *
   * Never throws. A failure here must not fail the request: the user's data is
   * already erased at that point, and reporting an error would invite them to
   * press delete again on an account that no longer has anything to delete.
   */
  private async deleteAuthUser(sub: string): Promise<boolean> {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key || !sub) return false;

    try {
      const res = await fetch(`${url}/auth/v1/admin/users/${sub}`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        this.logger.warn(
          `supabase auth user delete failed (${res.status}) — data purged, auth record kept`,
        );
        return false;
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`supabase auth user delete errored: ${msg}`);
      return false;
    }
  }
}
