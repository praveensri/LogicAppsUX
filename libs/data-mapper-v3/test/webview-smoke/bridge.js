/* global require, setTimeout */

const { assert, click, createHarness, runScenario } = require('./harness');

runScenario('Toolbar, schema, and palette bridge events work', async () => {
  const harness = await createHarness();
  try {
    const { document, dom, messages } = harness;

    click(harness, document.querySelector('#btn-validate-compile'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(messages.at(-1)?.type, 'compile');

    click(harness, document.querySelector('#btn-test-map'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(messages.at(-1)?.type, 'generateInstance');

    const schemaButtons = document.querySelectorAll('biztalk-schema-tree .schema-edit-btn');
    assert.equal(schemaButtons.length, 2);
    click(harness, schemaButtons[0]);
    assert.equal(messages.at(-1)?.type, 'loadSchema');
    assert.equal(messages.at(-1)?.side, 'source');
    click(harness, schemaButtons[1]);
    assert.equal(messages.at(-1)?.type, 'loadSchema');
    assert.equal(messages.at(-1)?.side, 'target');

    const sourceTree = document.querySelector('biztalk-schema-tree.source-tree');
    const targetTree = document.querySelector('biztalk-schema-tree.target-tree');
    const sourceEmpty = document.querySelector('biztalk-empty-schema.source-tree');
    const targetEmpty = document.querySelector('biztalk-empty-schema.target-tree');
    const notification = document.querySelector('biztalk-mapper-notification');
    const targetTreeContainer = targetTree.parentElement;
    assert.equal(sourceEmpty.hidden, true);
    assert.equal(targetEmpty.hidden, true);
    assert.equal(dom.window.getComputedStyle(sourceEmpty).display, 'none');
    assert.equal(dom.window.getComputedStyle(targetEmpty).display, 'none');
    assert.equal(dom.window.getComputedStyle(targetTreeContainer).overflow, 'hidden');
    assert.equal(dom.window.getComputedStyle(targetTree).overflowY, 'auto');
    assert.equal(notification.hidden, true);
    assert.equal(dom.window.getComputedStyle(notification).display, 'none');
    assert.equal(notification.childElementCount, 0);
    const targetExpandCollapse = targetTree.querySelector('.schema-expand-collapse-btn');
    assert.equal(targetExpandCollapse.getAttribute('title'), 'Collapse All');
    click(harness, targetExpandCollapse);
    await harness.waitFor(() => targetTree.querySelectorAll('.tree-node').length === 1);
    assert.ok(sourceTree.querySelectorAll('.tree-node').length > 1);
    assert.equal(targetTree.querySelector('.schema-expand-collapse-btn').getAttribute('title'), 'Expand All');
    click(harness, targetTree.querySelector('.schema-expand-collapse-btn'));
    await harness.waitFor(() => targetTree.querySelectorAll('.tree-node').length >= 3);

    const paletteItem = document.querySelector('biztalk-functoid-palette .palette-item');
    assert.equal(paletteItem.querySelector('.item-name')?.textContent, 'Concatenate');
    assert.equal(dom.window.getComputedStyle(paletteItem).height, '30px');

    const cumulativeCategory = Array.from(document.querySelectorAll('.palette-category')).find(
      (category) => category.querySelector('.category-name')?.textContent === 'Cumulative'
    );
    click(harness, cumulativeCategory.querySelector('.category-header'));
    await harness.waitFor(() => cumulativeCategory.querySelector('.item-name')?.textContent === 'Sum');
    assert.deepEqual(harness.browserErrors, []);
  } finally {
    harness.close();
  }
});
