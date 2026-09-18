const [major, minor] = process.versions.node.split(".").map(Number);
if (major !== 22 || minor < 22) {
  console.error("Use Node 22.22 or newer in the Node 22 release line. Run nvm use before starting Mystery Engine.");
  process.exit(1);
}
