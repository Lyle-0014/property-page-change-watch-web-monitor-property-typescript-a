import test from "node:test";
import assert from "node:assert/strict";
import { pageChanged } from "./property_watch.ts";

test("whitespace-only page updates do not trigger a business alert", () => {
  assert.equal(pageChanged("inspection: 10am\n", " inspection: 10am "), false);
  assert.equal(pageChanged("inspection: 10am", "inspection: 11am"), true);
});
