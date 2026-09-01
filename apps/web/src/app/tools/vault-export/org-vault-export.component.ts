import { Component, OnInit } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";

import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { isId, OrganizationId } from "@bitwarden/common/types/guid";
import { BreadcrumbsModule } from "@bitwarden/components";
import { ExportComponent } from "@bitwarden/vault-export-ui";


import { HeaderModule } from "../../layouts/header/header.module";
import { SharedModule } from "../../shared";

// FIXME(https://bitwarden.atlassian.net/browse/CL-764): Migrate to OnPush
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  templateUrl: "org-vault-export.component.html",
  imports: [BreadcrumbsModule, SharedModule, ExportComponent, HeaderModule],
})
export class OrganizationVaultExportComponent implements OnInit {
  protected routeOrgId: OrganizationId | undefined = undefined;
  protected loading = false;
  protected disabled = false;

  constructor(
    private route: ActivatedRoute,
    private configService: ConfigService,
  ) {}

  protected readonly showBreadcrumbs = toSignal(
    this.configService.getFeatureFlag$(FeatureFlag.VFO1Foundation),
    { initialValue: false },
  );

  async ngOnInit() {
    const orgIdParam = this.route.snapshot.paramMap.get("organizationId");
    if (orgIdParam === undefined) {
      throw new Error("`organizationId` is a required route parameter");
    }

    if (!isId<OrganizationId>(orgIdParam)) {
      throw new Error("Invalid OrganizationId provided in route parameter `organizationId`");
    }

    this.routeOrgId = orgIdParam;
  }

  /**
   * Callback that is called after a successful export.
   */
  protected async onSuccessfulExport(organizationId: OrganizationId): Promise<void> {}
}
