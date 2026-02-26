export const pageShellStyles = `
  :host {
    display: block;
  }

  .page-content {
    --background: var(--patient-bg);
    --padding-bottom: 28px;
    --padding-end: 12px;
    --padding-start: 12px;
    --padding-top: 10px;
  }

  .panel {
    background: var(--patient-surface);
    border: 1px solid var(--patient-border);
    border-radius: var(--patient-radius);
    box-shadow: var(--patient-shadow);
    margin: 0 0 12px;
    padding: 14px;
  }

  .panel-title {
    color: var(--ion-color-dark);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0 0 6px;
  }

  .panel-text {
    color: var(--ion-color-medium);
    font-size: 0.84rem;
    line-height: 1.45;
    margin: 0;
  }

  .panel-text + .panel-text {
    margin-top: 6px;
  }

  .sub-title {
    color: var(--ion-color-dark);
    font-size: 0.82rem;
    font-weight: 700;
    margin: 12px 0 6px;
  }

  .item-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  ion-list[inset='true'] {
    background: var(--patient-surface);
    border: 1px solid var(--patient-border);
    border-radius: var(--patient-radius);
    box-shadow: var(--patient-shadow-sm);
    margin: 0 0 12px;
    overflow: hidden;
  }

  ion-list[inset='true'] ion-item {
    --background: transparent;
    --padding-start: 14px;
    --inner-padding-end: 14px;
    --inner-border-width: 0 0 1px 0;
    --inner-border-color: var(--patient-border);
    border-radius: 0;
    margin-bottom: 0;
  }

  ion-list[inset='true'] ion-item:last-child {
    --inner-border-width: 0;
  }

  .status-chip {
    align-items: center;
    border-radius: 999px;
    display: inline-flex;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    padding: 4px 9px;
    text-transform: uppercase;
  }

  .status-scheduled {
    background: rgba(var(--ion-color-primary-rgb), 0.12);
    color: var(--ion-color-primary-shade);
  }

  .status-confirmed {
    background: rgba(var(--ion-color-success-rgb), 0.14);
    color: var(--ion-color-success-shade);
  }

  .status-completed {
    background: rgba(var(--ion-color-secondary-rgb), 0.14);
    color: var(--ion-color-secondary-shade);
  }

  .status-cancelled,
  .status-rejected,
  .status-expired,
  .status-no_show {
    background: rgba(var(--ion-color-danger-rgb), 0.14);
    color: var(--ion-color-danger-shade);
  }

  .status-sent,
  .status-pending,
  .status-draft {
    background: rgba(var(--ion-color-warning-rgb), 0.14);
    color: var(--ion-color-warning-shade);
  }

  .status-accepted,
  .status-signed {
    background: rgba(var(--ion-color-success-rgb), 0.14);
    color: var(--ion-color-success-shade);
  }

  .error-box {
    background: rgba(var(--ion-color-danger-rgb), 0.1);
    border: 1px solid rgba(var(--ion-color-danger-rgb), 0.24);
    border-radius: 10px;
    color: var(--ion-color-danger-shade);
    font-size: 0.82rem;
    margin: 0 0 12px;
    padding: 10px;
  }

  .success-box {
    background: rgba(var(--ion-color-success-rgb), 0.1);
    border: 1px solid rgba(var(--ion-color-success-rgb), 0.24);
    border-radius: 10px;
    color: var(--ion-color-success-shade);
    font-size: 0.82rem;
    margin: 0 0 12px;
    padding: 10px;
  }

  .warning-box {
    background: rgba(var(--ion-color-warning-rgb), 0.1);
    border: 1px solid rgba(var(--ion-color-warning-rgb), 0.24);
    border-radius: 10px;
    color: var(--ion-color-warning-shade);
    font-size: 0.82rem;
    margin: 0 0 12px;
    padding: 10px;
  }

  @media (min-width: 768px) {
    .page-content {
      --padding-end: 20px;
      --padding-start: 20px;
      --padding-top: 16px;
    }

    .panel {
      padding: 16px;
    }
  }
`;
