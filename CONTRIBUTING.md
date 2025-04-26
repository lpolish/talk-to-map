# Contributing to EarthAI

Thank you for your interest in contributing to EarthAI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/earthai.git
   cd earthai
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up the development environment:
   ```bash
   ./manage.sh dev
   ```

## Development Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run tests and linting:
   ```bash
   npm run lint
   npm run type-check
   ```
4. Commit your changes with a descriptive message
5. Push your branch to your fork
6. Create a Pull Request

## Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Write meaningful commit messages
- Keep PRs focused and manageable in size
- Include tests for new features
- Update documentation as needed

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md with a summary of changes
3. The PR must pass all CI checks
4. You may merge the PR once you have the sign-off of at least one other developer

## Testing

- Run the test suite before submitting a PR
- Add tests for new features
- Ensure all tests pass locally

## Documentation

- Keep documentation up to date
- Use clear, concise language
- Include examples where appropriate

## Questions?

Feel free to open an issue if you have any questions about contributing to EarthAI. 