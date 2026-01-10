# Synchronization Strategy

## Overview

The Medical Services system implements a hybrid cloud-local architecture with bidirectional synchronization.

## Sync Modes

### 1. Cloud-First (Default for Web App)

- Data primarily stored in cloud PostgreSQL
- Local SQLite for offline cache
- Automatic sync when online

### 2. Local-First (PWA)

- Data stored in IndexedDB
- Background sync to cloud when online
- Conflict resolution on server

## Sync Flow

### Push (Local to Cloud)

```
1. User makes change offline (IndexedDB)
2. Change queued in sync_queue table
3. Service Worker detects online status
4. POST /api/sync/push with changes
5. Server validates and applies changes
6. Server returns confirmation
7. Local storage updated with server IDs
8. Sync log created
```

### Pull (Cloud to Local)

```
1. User logs in or app resumes
2. GET /api/sync/pull?since=<last_sync_timestamp>
3. Server returns changed entities
4. Client updates local storage
5. UI refreshed with new data
```

## Conflict Resolution

### Strategy: Last-Write-Wins with Server Authority

1. **Timestamp Comparison**: Server compares client timestamp with server timestamp
2. **Server Wins**: If server has newer version, client version rejected
3. **Client Notified**: User informed of conflict and can view both versions
4. **Manual Merge**: User can manually reconcile differences

### Example Conflict

```json
{
  "conflict": true,
  "client_version": {
    "id": 123,
    "updated_at": "2024-01-15T10:00:00Z",
    "notes": "Patient reported headache"
  },
  "server_version": {
    "id": 123,
    "updated_at": "2024-01-15T10:05:00Z",
    "notes": "Patient reported headache and nausea"
  },
  "resolution": "server_wins"
}
```

## Sync API Endpoints

### POST /api/sync/push

Push local changes to cloud

**Request**:
```json
{
  "changes": [
    {
      "entity_type": "appointment",
      "entity_id": "local-123",
      "operation": "create",
      "data": { ... }
    }
  ]
}
```

**Response**:
```json
{
  "synced": [
    {
      "local_id": "local-123",
      "server_id": 456
    }
  ],
  "conflicts": []
}
```

### GET /api/sync/pull

Pull cloud changes to local

**Query Parameters**:
- `since`: ISO timestamp of last sync

**Response**:
```json
{
  "changes": [
    {
      "entity_type": "appointment",
      "operation": "update",
      "data": { ... }
    }
  ],
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Sync Logging

All sync operations logged in `sync_logs` table:

```python
class SyncLog:
    entity_type: str  # appointment, patient, etc.
    entity_id: int
    operation: str    # create, update, delete
    direction: str    # cloud_to_local, local_to_cloud
    status: str       # pending, completed, failed
    created_at: datetime
```

## Performance Optimization

1. **Batch Sync**: Group multiple changes into single request
2. **Delta Sync**: Only sync changed fields
3. **Compression**: Gzip compress sync payloads
4. **Pagination**: Limit sync to recent changes
5. **Background Sync**: Use Service Worker background sync API

## Error Handling

- **Network Errors**: Retry with exponential backoff
- **Validation Errors**: Show user, don't retry
- **Conflict Errors**: Prompt user for resolution
- **Server Errors**: Retry up to 3 times, then alert user
