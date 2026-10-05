import fs from 'fs';
import path from 'path';

describe('extension manifest', () => {
  test('opens BTM files with the data mapper by default', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const editor = manifest.contributes.customEditors.find(
      (candidate: { viewType: string }) => candidate.viewType === 'biztalkDataMapper.mapEditor'
    );

    expect(editor).toMatchObject({
      selector: [{ filenamePattern: '*.btm' }],
      priority: 'default',
    });
    expect(manifest.contributes.configurationDefaults['workbench.editorAssociations']).toEqual({
      '*.btm': 'biztalkDataMapper.mapEditor',
    });
    expect(manifest.activationEvents).toContain('onCustomEditor:biztalkDataMapper.mapEditor');
  });
});
