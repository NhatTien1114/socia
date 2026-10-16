# Group conversations

All endpoints use the existing authentication cookie and CSRF protection for writes.
Paths below are relative to `/socia/v1`.

- `GET /conversations/groups`: all GROUP conversations the current user belongs to,
  newest first. Returns `id`, `name`, `avatar`, `conversationType`, `createdPersonId`,
  `memberCount`, and `createdAt`. Does not expose other users' private groups.
- `POST /conversations/groups`: existing JSON body remains supported. For an uploaded
  avatar, send multipart: `group` is an application/json part containing `name` and
  `participantId`; `avatar` is an optional JPG/PNG file (maximum 4 MB).
- `PUT /conversations/groups/{id}/avatar`: multipart `avatar`; restricted to group admins.

Set `UPLOADTHING_TOKEN` in the backend environment to use the existing image storage
service. The same configuration serves profile and group avatars. Uploads are validated
and re-encoded by `UploadThingStorage`; a failed upload does not create a group.

`Conversation.avatar` now allows URLs up to 2048 characters. With the current
`ddl-auto: update` configuration, restarting the backend updates that column.
For environments managing DDL manually, apply:

```sql
ALTER TABLE conversation MODIFY COLUMN avatar VARCHAR(2048) NULL;
```

Keep `fix-conversation-type-check.sql` for older databases containing the legacy
ordinal CHECK. It was already applied to the local database; do not run it again
unless the old constraint still exists.

Group messaging/history are not implemented by these endpoints; the existing
message endpoints still handle direct conversations only.
