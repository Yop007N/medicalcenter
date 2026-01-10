# Shared Code

Shared TypeScript types, constants, and utilities used across frontend applications.

## Structure

```
shared/
├── types/              # TypeScript type definitions
│   ├── user.types.ts
│   ├── appointment.types.ts
│   └── medical-record.types.ts
├── constants/          # Shared constants
│   ├── roles.ts
│   ├── appointment-status.ts
│   └── medical-record-types.ts
└── utils/              # Utility functions
    ├── validators.ts
    └── formatters.ts
```

## Usage

Import shared types and utilities in your frontend applications:

```typescript
// Import types
import { User, Professional, Patient } from '../../shared/types/user.types';
import { Appointment } from '../../shared/types/appointment.types';

// Import constants
import { ROLE_ADMIN, ROLE_PROFESSIONAL } from '../../shared/constants/roles';

// Import utilities
import { isValidEmail, formatCurrency } from '../../shared/utils';
```

## Benefits

- **Type Safety**: Consistent types across frontend and backend
- **DRY Principle**: Don't repeat constants and utilities
- **Maintainability**: Single source of truth for shared code
