export const pageShellStyles = `
  .page-content {
    --background: #f8fafc;
  }

  .panel {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    margin: 12px;
    padding: 14px;
  }

  .panel-title {
    color: #0f172a;
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 4px;
  }

  .panel-text {
    color: #475569;
    font-size: 0.86rem;
    margin: 0;
  }

  .status-chip {
    border-radius: 999px;
    display: inline-flex;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 4px 10px;
    text-transform: uppercase;
  }

  .status-scheduled {
    background: #e0f2fe;
    color: #075985;
  }

  .status-confirmed {
    background: #dcfce7;
    color: #166534;
  }

  .status-completed {
    background: #ede9fe;
    color: #5b21b6;
  }

  .status-cancelled,
  .status-rejected,
  .status-expired,
  .status-no_show {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-sent,
  .status-draft {
    background: #fef3c7;
    color: #92400e;
  }

  .status-accepted {
    background: #dcfce7;
    color: #166534;
  }

  .error-box {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    color: #b91c1c;
    font-size: 0.82rem;
    margin: 12px;
    padding: 10px;
  }
`;
