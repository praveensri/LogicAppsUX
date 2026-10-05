/* global require */

const { assert, click, createHarness, runScenario } = require('./harness');

runScenario('Target constants are visible in the schema tree', async () => {
  const query = "/*[local-name()='<Schema>']/*[local-name()='Root']/*[local-name()='Value']/*[local-name()='Inner']";
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
    const { messages } = harness;
    await harness.waitFor(
      () =>
        harness.document.querySelector('.tree-node[data-path="/Root/Value/Inner"] .node-constant-value')?.textContent?.trim() === '= true'
    );
    const constant = harness.document.querySelector('.tree-node[data-path="/Root/Value/Inner"] .node-constant-value');
    assert.equal(constant?.getAttribute('title'), 'Constant value: true');

    const targetNode = harness.document.querySelector('.target-tree .tree-node[data-path="/Root/Value/Inner"]');
    targetNode.dispatchEvent(new harness.dom.window.MouseEvent('dblclick', { bubbles: true }));
    await harness.waitFor(() => !!harness.document.querySelector('#schema-constant-value'));
    const input = harness.document.querySelector('#schema-constant-value');
    assert.equal(input.value, 'true');
    const valueSetter = Object.getOwnPropertyDescriptor(harness.dom.window.HTMLInputElement.prototype, 'value').set;
    valueSetter.call(input, 'false');
    input.dispatchEvent(new harness.dom.window.Event('input', { bubbles: true }));
    click(harness, harness.document.querySelector('#schema-constant-save'));
    await harness.waitFor(() => map.targetValues[query] === 'false');
    assert.deepEqual(Object.keys(map.targetValues), [query]);
    await harness.waitFor(
      () =>
        harness.document.querySelector('.tree-node[data-path="/Root/Value/Inner"] .node-constant-value')?.textContent?.trim() === '= false'
    );

    harness.document
      .querySelector('.target-tree .tree-node[data-path="/Root/Value/Inner"]')
      .dispatchEvent(new harness.dom.window.MouseEvent('dblclick', { bubbles: true }));
    await harness.waitFor(() => !!harness.document.querySelector('#schema-constant-remove'));
    click(harness, harness.document.querySelector('#schema-constant-remove'));
    await harness.waitFor(() => !Object.prototype.hasOwnProperty.call(map.targetValues, query));
    assert.equal(harness.document.querySelector('.tree-node[data-path="/Root/Value/Inner"] .node-constant-value'), null);
    assert.equal(messages.at(-1)?.type, 'update');
    assert.deepEqual(harness.browserErrors, []);
  } finally {
    harness.close();
  }
});
