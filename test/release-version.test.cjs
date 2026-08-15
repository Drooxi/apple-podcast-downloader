const test = require("node:test");
const assert = require("node:assert/strict");
const { validateReleaseTag } = require("../scripts/check-release-version.cjs");

test("validateReleaseTag accepts the package version tag", () => {
  assert.equal(validateReleaseTag("v1.0.0", "1.0.0"), true);
});

test("validateReleaseTag rejects an incompatible tag", () => {
  assert.throws(
    () => validateReleaseTag("v1.0.1", "1.0.0"),
    /does not match package version v1\.0\.0/,
  );
});
