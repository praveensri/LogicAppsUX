/* global require */

const { assert, click, createHarness, runScenario } = require('./harness');

function findNode(document, side, path) {
  return Array.from(document.querySelectorAll(`biztalk-schema-tree.${side}-tree .tree-node`)).find((node) => node.dataset.path === path);
}

runScenario('Schema links and functoids render on the canvas', async () => {
  const harness = await createHarness();
  try {
    const { document, map } = harness;
    await harness.waitFor(
      () =>
        !!findNode(document, 'source', '/Root')?.querySelector('.node-connector') &&
        !!findNode(document, 'target', '/Root')?.querySelector('.node-connector')
    );
    const sourceConnector = findNode(document, 'source', '/Root')?.querySelector('.node-connector');
    const targetConnector = findNode(document, 'target', '/Root')?.querySelector('.node-connector');

    click(harness, sourceConnector);
    click(harness, targetConnector);
    await harness.waitFor(() => map.pages[0].links.length === 1 && !!document.querySelector('.mapping-links-overlay [data-link-id]'));
    const linkPath = document.querySelector('.mapping-links-overlay [data-link-id] .mapping-link');
    assert.match(linkPath.getAttribute('d'), /^M .+ L .+$/);
    assert.doesNotMatch(linkPath.getAttribute('d'), / C /);
    assert.ok(findNode(document, 'source', '/Root')?.querySelector('.node-connector')?.classList.contains('connected'));
    assert.ok(findNode(document, 'target', '/Root')?.querySelector('.node-connector')?.classList.contains('connected'));

    click(harness, document.querySelector('biztalk-functoid-palette .palette-item'));
    await harness.waitFor(() => map.pages[0].functoids.length === 1 && !!document.querySelector('.functoid-node'));
    const functoidNode = document.querySelector('.functoid-node');
    const paletteIcon = document.querySelector('biztalk-functoid-palette .palette-item .item-icon');
    const functoidBody = functoidNode.querySelector('.functoid-body');
    const functoidText = functoidNode.querySelector('text');
    assert.equal(functoidNode.querySelector('text')?.textContent.trim(), 'Conc');
    assert.equal(paletteIcon.style.background, 'rgb(76, 175, 80)');
    assert.equal(paletteIcon.style.color, 'rgb(0, 0, 0)');
    assert.equal(functoidBody.getAttribute('fill'), '#4caf50');
    assert.equal(functoidText.getAttribute('fill'), '#000000');

    functoidNode.dispatchEvent(new harness.dom.window.MouseEvent('dblclick', { bubbles: true }));
    await harness.waitFor(() => !!document.querySelector('.functoid-dialog-tabs'));
    const propertiesPanel = document.querySelector('.functoid-properties-panel');
    const dialogContent = propertiesPanel.querySelector('.functoid-dialog-content');
    const dialogActions = propertiesPanel.querySelector('.config-actions');
    const propertiesPanelStyles = harness.dom.window.getComputedStyle(propertiesPanel);
    assert.equal(propertiesPanel.lastElementChild, dialogActions);
    assert.ok(dialogContent);
    assert.equal(propertiesPanelStyles.width, '100%');
    assert.equal(propertiesPanelStyles.minWidth, '0');
    assert.ok(dialogActions.querySelector('#properties-save'));
    assert.ok(harness.messages.some((message) => message.type === 'update'));
    assert.deepEqual(harness.browserErrors, []);
  } finally {
    harness.close();
  }
});
