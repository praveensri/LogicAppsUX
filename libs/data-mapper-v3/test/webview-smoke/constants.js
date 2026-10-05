/* global require */

const { assert, createHarness, runScenario } = require('./harness');

runScenario('Target constants are visible in the schema tree', async () => {
  const query = "/*[local-name()='<Schema>']/*[local-name()='Root']/*[local-name()='Value']";
  const map = {
    name: 'Constant smoke map',
    sourceSchema: { location: 'source.xsd' },
    targetSchema: { location: 'target.xsd' },
    targetValues: { [query]: 'true' },
    options: {},
    pages: [{ id: 'page1', name: 'Page 1', links: [], functoids: [] }],
  };
  const harness = await createHarness({ map });
  try {
    await harness.waitFor(
      () => harness.document.querySelector('.tree-node[data-path="/Root/Value"] .node-constant-value')?.textContent?.trim() === '= true'
    );
    const constant = harness.document.querySelector('.tree-node[data-path="/Root/Value"] .node-constant-value');
    assert.equal(constant?.getAttribute('title'), 'Constant value: true');
    assert.deepEqual(harness.browserErrors, []);
  } finally {
    harness.close();
  }
});
