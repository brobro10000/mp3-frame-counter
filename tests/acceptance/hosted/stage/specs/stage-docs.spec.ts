/**
 * Five literal hosted-v1 stage docs cases apply the unchanged docs-v1 predicates through authenticated adapters.
 * Invoke only with the fixed e2e:stage wrapper; discovery has no target/credential or browser side effects.
 * Helpers receive the owned HTTP adapter/browser lease, check real route/spec/rendering/CSP behavior, discard their
 * finite screenshots and reject any mismatch. Docs browser helpers close/drain before classifying their observation;
 * the automatic fixture separately requires passing finalization. No unauthenticated request or route override is used.
 */
import { createHostedTest } from "../../../lib/hosted-fixtures.ts";
import {
  checkHostedDocsResponses,
  checkHostedServedSpec,
  checkHostedDocsBrowser,
  checkHostedRootPolicy,
} from "../../../lib/hosted-docs.ts";

const test = createHostedTest("stage");

test("HS-18 public docs routes assets errors and headers survive ingress", async ({ hostedHttp }) => {
  await checkHostedDocsResponses(hostedHttp);
});

test("HS-19 served specification retains local transport semantics", async ({ hostedHttp }) => {
  await checkHostedServedSpec(hostedHttp);
});

test("HS-20 desktop docs render and interact under effective CSP", async ({ hostedBrowser, hostedHttp }) => {
  await checkHostedDocsBrowser(await hostedBrowser("desktop"), hostedHttp, "desktop");
});

test("HS-21 narrow docs render and interact under effective CSP", async ({ hostedBrowser, hostedHttp }) => {
  await checkHostedDocsBrowser(await hostedBrowser("narrow"), hostedHttp, "narrow");
});

test("HS-22 upload-page policy remains isolated from docs exceptions", async ({ hostedBrowser, hostedHttp }) => {
  await checkHostedRootPolicy(await hostedBrowser("desktop"), hostedHttp);
});
