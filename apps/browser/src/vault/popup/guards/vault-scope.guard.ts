import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import {
  isPersonalOnly,
  parseVaultScope,
  VaultNavItemType,
  VaultNavService,
  VaultScopeType,
} from "@bitwarden/vault";

/** The popup mounts the vault under its tab shell rather than at the root. */
const POPUP_VAULT_ROUTE = "/tabs/vault";

/**
 * Guards the popup's `:vaultId` route, turning away a segment that names no vault the account can
 * reach — a stale router-cache URL from an organization the user has left, or `my-vault` on an
 * account whose only vault is already the unscoped route.
 *
 * A popup-local twin of `libs/vault`'s `vaultScopeGuard` rather than that guard itself: the shared
 * one redirects to the `/vault` paths web and desktop mount at their root, which match nothing
 * here. The membership rules are the shared ones; only the redirect target differs.
 *
 * The popup has no shared-folder drill-in, so a `:collectionId` segment never arrives and the
 * collection half of the shared guard has no counterpart here.
 */
export const popupVaultScopeGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const vaultNavService = inject(VaultNavService);
  const accountService = inject(AccountService);

  const unscoped = () => router.createUrlTree([POPUP_VAULT_ROUTE]);

  const scope = parseVaultScope(route.paramMap.get("vaultId"));
  if (scope == null) {
    return unscoped();
  }

  if (scope.type !== VaultScopeType.MyVault && scope.type !== VaultScopeType.Organization) {
    return true;
  }

  const userId = await firstValueFrom(accountService.activeAccount$.pipe(getUserId));
  const nav = await firstValueFrom(vaultNavService.viewModel$(userId));

  if (scope.type === VaultScopeType.MyVault) {
    return isPersonalOnly(nav) ? unscoped() : true;
  }

  const isMember = nav.vaults.some(
    ({ id, type }) => type !== VaultNavItemType.Personal && id === scope.organizationId,
  );

  return isMember ? true : unscoped();
};
