# Minimal React Calendar App

A fully accessible, responsive calendar application built with React and TypeScript that implements all the requested features without external libraries.

This implementation provides a fully functional calendar app that meets all the requirements:

No external libraries - Pure React + TypeScript with vanilla CSS
UTC storage policy - All times stored in UTC, displayed in local time
Both views - Month grid and day timeline with proper navigation
CRUD operations - Full create, read, update, delete functionality
Drag/resize - Mouse and touch support with visual feedback
Keyboard accessibility - Full keyboard navigation in both views
Responsive design - Adapts to mobile and desktop screens
ARIA compliance - Proper roles, labels, and screen reader support
Error handling - Graceful handling of invalid inputs and storage issues
Performance - Optimized rendering and drag operations
The app is structured with clean, maintainable components and follows React best practices with TypeScript type safety.

## Features Implemented

### Core Functionality
- **Month Grid View**: Displays a month in a 7×N grid with day numbers and event badges
- **Day Timeline View**: Vertical timeline showing events from 5:00 AM to 11:00 PM with 15-minute slots
- **CRUD Operations**: Create, read, update, and delete events
- **Drag/Resize**: Mouse and touch support for moving and resizing events
- **Keyboard Navigation**: Full keyboard accessibility in both views
- **UTC Storage**: All time data stored as ISO 8601 UTC strings with local display
- **Responsive Design**: Adapts to mobile (≤480px) and desktop (≥768px) screens

### Accessibility Features
- ARIA roles and labels for all interactive elements
- Keyboard navigation using arrow keys, home/end, page up/down
- Live region announcements for drag/resize operations
- Roving tabindex management for grid navigation
- Focus indicators and screen reader support

### Technical Implementation
- TypeScript for type safety
- React 18 with hooks
- Pure CSS (no external libraries)
- localStorage-based persistence
- UTC time handling with timezone-aware display
- No external calendar libraries used

## Keyboard Controls

### Month Grid View
- Arrow keys: Navigate between days
- Enter: Switch to Day view for selected date
- Home/End: Jump to start/end of week
- PageUp/PageDown: Switch months
- Space: Select current day

### Day Timeline View
- Arrow Up/Down: Move focused event by slot minutes
- Alt + Arrow Up/Down: Adjust start time
- Alt + Shift + Arrow Up/Down: Adjust end time
- Esc: Cancel pending operation
- Enter: Edit selected event
- Click: Select and edit event

## ARIA Implementation

### Month Grid
- Container role="grid"
- Rows role="row"
- Days role="gridcell"
- aria-current="date" for today's date
- aria-selected for focused day
- aria-label with day name, date, and event count

### Day Timeline
- Container role="region" with aria-label for date
- Each event is a button with aria-label including title and time range
- Live region for drag/resize announcements

## UTC Policy

All events are stored as ISO 8601 UTC strings in localStorage. When displayed, times are converted to the user's local timezone using Intl APIs. No special DST handling is implemented beyond what the browser provides.

## Responsive Design

### Mobile (≤480px)
- Day gutter: 56px
- Slot height: larger
- Touch targets: 44×44 pixels minimum
- Prevents body scroll during drag operations
- Compact month cells with count badges

### Desktop (≥768px)
- Day gutter: 72px
- Shows 30-minute tick marks
- Wider event cards for better touch targets

## Performance Considerations

- Memoization of month summaries and day layout
- Throttled pointer moves during drag operations
- Use of CSS transforms for smooth ghost rendering
- Efficient event stacking algorithm

## Data Storage

Events are stored in localStorage under the key "events" as a JSON array. Each event has:
- id: UUID string
- title: Event title (string)
- start: ISO 8601 UTC start time
- end: ISO 8601 UTC end time
- color: Optional hex color code
- notes: Optional description

## Error Handling

- Input validation for all CRUD operations
- Non-blocking error messages via console logging
- Repository functions return Result types with error handling
- Graceful degradation on bad data

## Limitations

- No DST edge case handling (relies on browser defaults)
- No recurring events
- No time zone selection (uses system default)
- No notifications or reminders
