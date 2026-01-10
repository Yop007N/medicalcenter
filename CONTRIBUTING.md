# Contributing to Medical Services

Thank you for considering contributing to Medical Services! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, versions)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** and **rationale**
- **Proposed solution** or implementation ideas
- **Alternatives considered**

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**:
   - Follow the [Coding Standards](docs/development/coding-standards.md)
   - Write tests for new features
   - Update documentation as needed
4. **Test your changes**:
   ```bash
   # Backend
   cd backend && pytest

   # Frontend
   cd frontend-web && npm test
   ```
5. **Commit** with conventional commit messages:
   ```
   feat: add appointment calendar view
   fix: resolve patient search bug
   docs: update API documentation
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** against `develop` branch

### Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: Explain what and why, not how
- **Link issues**: Reference related issues
- **Screenshots**: Include for UI changes
- **Tests**: Ensure all tests pass
- **Documentation**: Update if needed
- **Code review**: Be responsive to feedback

## Development Setup

See [Development Setup Guide](docs/development/setup.md) for detailed instructions.

## Coding Standards

Follow the project's [Coding Standards](docs/development/coding-standards.md):

### Python (Backend)
- Follow PEP 8
- Use type hints
- Write docstrings for functions
- Maintain test coverage above 80%

### TypeScript/Angular (Frontend)
- Follow Angular style guide
- Use TypeScript strict mode
- Use RxJS best practices
- Write unit tests for components

### Git Commits
- Use conventional commits
- Keep commits focused and atomic
- Write clear commit messages

## Testing

### Backend Tests

```bash
cd backend
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend-web
npm test -- --code-coverage
```

## Documentation

- Update README.md for major changes
- Document API changes in docs/api/
- Add examples for new features
- Keep documentation up to date

## Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least one maintainer
3. **Testing** on staging environment
4. **Approval** from project maintainers
5. **Merge** to develop branch

## Release Process

1. Changes merged to `develop`
2. Create release branch: `release/v1.x.x`
3. Update version numbers
4. Update CHANGELOG.md
5. Merge to `main` and tag release
6. Deploy to production

## Questions?

- Check [Documentation](docs/)
- Search [Issues](https://github.com/yourorg/medical-services/issues)
- Ask in [Discussions](https://github.com/yourorg/medical-services/discussions)

Thank you for contributing!
