import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  FluentProvider,
  Input,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
// biome-ignore lint/style/useImportType: The classic JSX transform requires React at runtime.
import React, { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getVsCodeFluentTheme, useTypographyStyles } from '../fluentTheme';

export interface SchemaNodePropertyRow {
  label: string;
  value: string;
  isXPath?: boolean;
}

export interface SchemaNodePropertiesViewModel {
  title: string;
  nodeName: string;
  rows: SchemaNodePropertyRow[];
  description?: string;
  canEditConstant?: boolean;
  constantValue?: string;
}

export interface SchemaNodePropertiesCallbacks {
  onClose(): void;
  onSaveConstant?(value: string): void;
  onRemoveConstant?(): void;
}

const useStyles = makeStyles({
  surface: { width: '480px', maxWidth: '90vw' },
  nodeName: { fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase400, marginBottom: tokens.spacingVerticalS },
  list: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS, margin: 0 },
  row: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: tokens.spacingHorizontalM, alignItems: 'baseline' },
  term: { color: tokens.colorNeutralForeground3 },
  value: { color: tokens.colorNeutralForeground1, overflowWrap: 'anywhere' },
  xpath: { fontFamily: tokens.fontFamilyMonospace },
  description: { color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  constantField: { marginTop: tokens.spacingVerticalM },
});

interface SchemaNodePropertiesDialogViewProps extends SchemaNodePropertiesCallbacks {
  model: SchemaNodePropertiesViewModel;
}

function SchemaNodePropertiesDialogView({
  model,
  onClose,
  onSaveConstant,
  onRemoveConstant,
}: SchemaNodePropertiesDialogViewProps): React.ReactElement {
  const styles = useStyles();
  const typographyStyles = useTypographyStyles();
  const [constantValue, setConstantValue] = useState(model.constantValue ?? '');
  return (
    <FluentProvider theme={getVsCodeFluentTheme()} style={{ display: 'contents' }}>
      <Dialog
        open
        modalType="modal"
        onOpenChange={(_event, data) => {
          if (!data.open) {
            onClose();
          }
        }}
      >
        <DialogSurface className={`${styles.surface} ${typographyStyles.base}`}>
          <DialogBody>
            <DialogTitle>{model.title}</DialogTitle>
            <DialogContent>
              <div className="schema-properties-panel">
                <div className={`schema-property-name ${styles.nodeName}`}>{model.nodeName}</div>
                <dl className={`schema-property-list ${styles.list}`}>
                  {model.rows.map((row) => (
                    <div className={styles.row} key={row.label}>
                      <dt className={styles.term}>{row.label}</dt>
                      <dd className={`${styles.value} ${row.isXPath ? `schema-property-xpath ${styles.xpath}` : ''}`}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {model.description ? (
                  <Field label="Description">
                    <div className={styles.description}>{model.description}</div>
                  </Field>
                ) : null}
                {model.canEditConstant ? (
                  <Field
                    className={styles.constantField}
                    label="Constant value"
                    hint="This value is written directly to the selected target node. An empty value is preserved as an explicit empty constant."
                  >
                    <Input id="schema-constant-value" value={constantValue} onChange={(_event, data) => setConstantValue(data.value)} />
                  </Field>
                ) : null}
              </div>
            </DialogContent>
            <DialogActions>
              <Button id="schema-properties-close" appearance={model.canEditConstant ? undefined : 'primary'} onClick={onClose}>
                Close
              </Button>
              {model.canEditConstant && model.constantValue !== undefined ? (
                <Button id="schema-constant-remove" onClick={onRemoveConstant}>
                  Remove Constant
                </Button>
              ) : null}
              {model.canEditConstant ? (
                <Button id="schema-constant-save" appearance="primary" onClick={() => onSaveConstant?.(constantValue)}>
                  Save Constant
                </Button>
              ) : null}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </FluentProvider>
  );
}

export class SchemaNodePropertiesDialog extends HTMLElement {
  private reactRoot: Root | null = null;
  private model: SchemaNodePropertiesViewModel | null = null;
  private callbacks: SchemaNodePropertiesCallbacks | null = null;
  private renderVersion = 0;

  public configure(model: SchemaNodePropertiesViewModel, callbacks: SchemaNodePropertiesCallbacks): void {
    this.model = model;
    this.callbacks = callbacks;
    this.renderVersion++;
    this.renderReact();
  }

  public connectedCallback(): void {
    this.renderReact();
  }

  public disconnectedCallback(): void {
    this.reactRoot?.unmount();
    this.reactRoot = null;
  }

  public clear(): void {
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.model = null;
    this.callbacks = null;
  }

  private renderReact(): void {
    if (!this.isConnected || !this.model || !this.callbacks) {
      return;
    }
    this.reactRoot ??= createRoot(this);
    this.reactRoot.render(<SchemaNodePropertiesDialogView key={this.renderVersion} model={this.model} {...this.callbacks} />);
  }
}

customElements.define('biztalk-schema-node-properties-dialog', SchemaNodePropertiesDialog);

declare global {
  interface HTMLElementTagNameMap {
    'biztalk-schema-node-properties-dialog': SchemaNodePropertiesDialog;
  }
}
