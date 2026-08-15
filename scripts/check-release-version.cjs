const packageJson = require("../package.json");

function validateReleaseTag(tag, version = packageJson.version) {
  const expectedTag = `v${version}`;

  if (!tag) {
    throw new Error(`A release tag is required. Expected ${expectedTag}.`);
  }

  if (tag !== expectedTag) {
    throw new Error(`Release tag ${tag} does not match package version ${expectedTag}.`);
  }

  return true;
}

if (require.main === module) {
  const tag = process.env.GITHUB_REF_NAME || process.argv[2];

  try {
    validateReleaseTag(tag);
    console.log(`Release tag ${tag} matches package version ${packageJson.version}.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { validateReleaseTag };
