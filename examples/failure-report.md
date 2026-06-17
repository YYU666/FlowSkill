# Frontend Visual QA Missed Mobile Overflow

## Trigger

The skill was applied to a compact dashboard with long labels.

## Symptom

Desktop screenshots passed, but mobile text overlapped controls.

## Root cause

The viewport matrix skipped the narrow mobile breakpoint and did not check text wrapping inside toolbar buttons.

## Avoid next time

Require at least one narrow mobile viewport and inspect toolbar/control text wrapping before accepting visual QA work.
