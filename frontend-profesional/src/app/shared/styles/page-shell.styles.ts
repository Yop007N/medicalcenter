export const pageShellStyles = `
  .page {
    background: var(--ms-bg-card);
    border: 1px solid var(--ms-border);
    border-radius: 12px;
    padding: 1.25rem;
  }

  h1 {
    color: var(--ms-text-strong);
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.65rem;
  }

  p {
    color: var(--ms-text-secondary);
    margin: 0 0 1rem;
  }

  .grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .card {
    background: var(--ms-bg-soft);
    border: 1px solid var(--ms-border);
    border-radius: 10px;
    padding: 0.9rem;
  }

  .card-title {
    color: var(--ms-text-strong);
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0 0 0.2rem;
  }

  .card-text {
    color: var(--ms-text-muted);
    font-size: 0.82rem;
    margin: 0;
  }
`;
