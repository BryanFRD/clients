import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from "@angular/router";
import { of } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { VaultNavItemType, VaultNavService } from "@bitwarden/vault";

import { popupVaultScopeGuard } from "./vault-scope.guard";

describe("popupVaultScopeGuard", () => {
  /** Only a guid parses as an organization segment — see `parseVaultScope`. */
  const ORG_ID = "11111111-1111-4111-8111-111111111111";

  const createUrlTree = jest.fn().mockReturnValue({} as UrlTree);
  let viewModel: { vaults: any[]; organizationDataOwnership: boolean };

  const run = (vaultId: string | null) =>
    TestBed.runInInjectionContext(() =>
      popupVaultScopeGuard(
        {
          paramMap: convertToParamMap(vaultId == null ? {} : { vaultId }),
        } as ActivatedRouteSnapshot,
        {} as any,
      ),
    ) as Promise<boolean | UrlTree>;

  beforeEach(() => {
    createUrlTree.mockClear();
    viewModel = {
      vaults: [
        { id: "user-1", type: VaultNavItemType.Personal, label: "My vault", icon: "bwi-user" },
        { id: ORG_ID, type: VaultNavItemType.Organization, label: "Acme", icon: "bwi-business" },
      ],
      organizationDataOwnership: false,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { createUrlTree } },
        { provide: AccountService, useValue: { activeAccount$: of({ id: "user-1" }) } },
        { provide: VaultNavService, useValue: { viewModel$: () => of(viewModel) } },
      ],
    });
  });

  it("admits an organization the account belongs to", async () => {
    await expect(run(ORG_ID)).resolves.toBe(true);
  });

  it("admits the personal vault when the account has more than one", async () => {
    await expect(run("my-vault")).resolves.toBe(true);
  });

  /** A stale router-cache URL for an organization the user has left. */
  it("turns away an organization the account has left", async () => {
    await run("00000000-0000-4000-8000-000000000000");

    expect(createUrlTree).toHaveBeenCalledWith(["/tabs/vault"]);
  });

  it("turns away a segment that names no vault", async () => {
    await run("not-a-vault");

    expect(createUrlTree).toHaveBeenCalledWith(["/tabs/vault"]);
  });

  /** A lone personal vault already renders at the unscoped route. */
  it("turns away my-vault when it is the account's only vault", async () => {
    viewModel = {
      vaults: [
        { id: "user-1", type: VaultNavItemType.Personal, label: "My vault", icon: "bwi-user" },
      ],
      organizationDataOwnership: false,
    };

    await run("my-vault");

    expect(createUrlTree).toHaveBeenCalledWith(["/tabs/vault"]);
  });

  /** The redirect has to name the popup's path, not the `/vault` root web and desktop use. */
  it("redirects to the popup's vault route", async () => {
    await run("not-a-vault");

    expect(createUrlTree).not.toHaveBeenCalledWith(["/vault"]);
  });
});
