# -*- coding: utf-8 -*-
"""Service layer for frontend diagnostic logs."""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any

from app.services.exceptions import ValidationError


class LogsService:
    """Encapsulates frontend log persistence/read operations."""

    def __init__(self, log_file_path: str, os_module=os):
        self.log_file_path = log_file_path
        self.os = os_module

    def store_frontend_logs(self, payload: Any) -> int:
        """Validate payload and append logs to file."""
        logs = self._extract_logs(payload)
        with open(self.log_file_path, "a", encoding="utf-8") as log_file:
            for raw_log in logs:
                normalized = self._normalize_log_entry(raw_log)
                log_file.write(self._format_log_line(normalized))
        return len(logs)

    def get_frontend_logs(self, lines: int = 100) -> dict[str, Any]:
        """Return the latest log lines and metadata."""
        if not self.os.path.exists(self.log_file_path):
            return {"logs": [], "msg": "No logs yet"}

        safe_lines = max(lines, 1)
        with open(self.log_file_path, "r", encoding="utf-8") as log_file:
            all_lines = log_file.readlines()

        last_lines = all_lines[-safe_lines:] if len(all_lines) > safe_lines else all_lines
        return {
            "logs": [line.strip() for line in last_lines],
            "total_lines": len(all_lines),
            "returned_lines": len(last_lines),
        }

    def clear_frontend_logs(self) -> None:
        """Delete persisted frontend logs file if present."""
        if self.os.path.exists(self.log_file_path):
            self.os.remove(self.log_file_path)

    @staticmethod
    def _extract_logs(payload: Any) -> list[Any]:
        if payload is None:
            raise ValidationError("Invalid JSON body")
        if not isinstance(payload, dict):
            raise ValidationError("Request body must be an object")

        logs = payload.get("logs", [])
        if not isinstance(logs, list):
            raise ValidationError("logs must be an array")
        if not logs:
            raise ValidationError("No logs provided")
        return logs

    @staticmethod
    def _normalize_log_entry(raw_log: Any) -> dict[str, Any]:
        if isinstance(raw_log, dict):
            return raw_log
        return {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO",
            "source": "UNKNOWN",
            "message": str(raw_log),
        }

    @staticmethod
    def _format_log_line(log_entry: dict[str, Any]) -> str:
        timestamp = log_entry.get("timestamp", datetime.now().isoformat())
        level = log_entry.get("level", "INFO")
        source = log_entry.get("source", "UNKNOWN")
        message = log_entry.get("message", "")
        data = log_entry.get("data")

        data_suffix = ""
        if data:
            try:
                data_suffix = f" | DATA: {json.dumps(data, default=str)}"
            except Exception:
                data_suffix = f" | DATA: {str(data)}"

        return f"[{timestamp}] [{level}] [{source}] {message}{data_suffix}\n"
