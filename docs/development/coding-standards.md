# Coding Standards

## General Principles

- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **SOLID**: Follow SOLID principles
- **Clean Code**: Write code for humans, not machines
- **Test Coverage**: Aim for 80%+ test coverage

## Python (Backend)

### Style Guide

Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)

### Naming Conventions

- **Variables/Functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private**: `_leading_underscore`

### Imports

```python
# Standard library
import os
import sys

# Third-party
from flask import Flask
from sqlalchemy import Column

# Local
from app.models import User
from app.utils import helpers
```

### Docstrings

```python
def get_user_by_id(user_id):
    """
    Get user by ID

    Args:
        user_id (int): User ID

    Returns:
        User: User object or None

    Raises:
        ValueError: If user_id is invalid
    """
    return User.query.get(user_id)
```

### Type Hints

```python
from typing import List, Optional

def get_appointments(user_id: int) -> List[Appointment]:
    return Appointment.query.filter_by(user_id=user_id).all()
```

## TypeScript/Angular (Frontend)

### Style Guide

Follow [Angular Style Guide](https://angular.io/guide/styleguide)

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private**: `private` keyword

### File Naming

- **Components**: `feature-name.component.ts`
- **Services**: `feature-name.service.ts`
- **Models**: `feature-name.model.ts`
- **Guards**: `feature-name.guard.ts`

### Component Structure

```typescript
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users$: Observable<User[]>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.users$ = this.userService.getUsers();
  }
}
```

### RxJS Best Practices

- Use async pipe in templates
- Unsubscribe in ngOnDestroy
- Use operators for transformation
- Avoid nested subscriptions

## Git Workflow

### Branch Naming

- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/critical-fix`
- `refactor/refactoring-description`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/)

```
feat: add appointment calendar view
fix: resolve patient search bug
docs: update API documentation
refactor: improve error handling
test: add unit tests for auth service
```

### Pull Requests

- Clear title and description
- Link related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Request review from team members

## Testing

### Backend Tests

```python
def test_user_creation():
    """Test user can be created"""
    user = User(email='test@example.com')
    user.set_password('password')
    db.session.add(user)
    db.session.commit()

    assert user.id is not None
    assert user.check_password('password')
```

### Frontend Tests

```typescript
describe('UserListComponent', () => {
  it('should load users on init', () => {
    const fixture = TestBed.createComponent(UserListComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.users$).toBeDefined();
  });
});
```

## Security

- Never commit secrets or API keys
- Use environment variables
- Validate all user input
- Sanitize HTML content
- Use parameterized queries
- Implement rate limiting
- Use HTTPS in production

## Performance

- Lazy load modules
- Use OnPush change detection
- Optimize database queries
- Use pagination for large lists
- Cache frequently accessed data
- Optimize images and assets
