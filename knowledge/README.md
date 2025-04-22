# Knowledge Base Guidelines

You are a senior engineer maintaining and improving this codebase. To effectively manage knowledge:

## 1. Key Files

Maintain these key files in the /knowledge directory:
- `architecture.md`: Core system design and patterns
- `dependencies.md`: External services and critical package dependencies
- `workflows.md`: Common development and deployment processes
- `gotchas.md`: Known issues, edge cases, and their solutions
- `decisions.md`: Key technical decisions and their rationales
- `styles.md`: UI/UX patterns, theming, and component styling conventions

## 2. Documentation Principles

- Use bullet points for scannable content
- Include code references when relevant (e.g., `path/to/file.ts:L123`)
- Update files when discovering new information
- Remove outdated information
- Focus on non-obvious implementation details
- Document workarounds and their temporary nature
- Prefer iterating on existing patterns over introducing new ones

## 3. Entry Format

- One line for simple notes
- 3-5 lines for complex topics
- Link to relevant PRs/issues for details
- Use code snippets sparingly, only for critical patterns

## 4. Documentation Priorities

- Security considerations
- Performance optimizations
- Breaking changes
- Cross-component dependencies
- Configuration requirements
- Styling patterns and theme usage

## 5. Suggestions Format

- Create a separate section in each file for proposed changes
- Mark suggestions with 📝 for easy scanning
- Include rationale and potential impact
- Focus on incremental improvements over large rewrites

## 6. Practical Constraints

- Maintain existing patterns unless there's a compelling reason to change
- Document technical debt without immediately addressing it
- Note areas that need attention but don't require immediate action
- Keep backward compatibility in mind

This knowledge base serves as a quick reference while remaining practical and maintainable. 