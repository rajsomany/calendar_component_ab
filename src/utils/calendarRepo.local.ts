import { Event } from './timeHelpers';

type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string };

const EVENTS_KEY = 'events';

/**
 * Get events in a date range
 */
export async function getEventsInRange(
  startISO: string,
  endISO: string
): Promise<Result<Event[]>> {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    if (!stored) return { ok: true, data: [] };
    
    const events: Event[] = JSON.parse(stored);
    
    // Filter events that overlap with the range
    const filtered = events.filter(event => {
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      const rangeStart = new Date(startISO).getTime();
      const rangeEnd = new Date(endISO).getTime();
      
      // Check if the event overlaps with the range
      return eventStart < rangeEnd && eventEnd > rangeStart;
    });
    
    return { ok: true, data: filtered };
  } catch (error) {
    console.error('Error reading events from localStorage:', error);
    return { ok: false, error: 'Failed to read events' };
  }
}

/**
 * Create a new event
 */
export async function createEvent(event: Omit<Event, 'id'>): Promise<Result<Event>> {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    const events: Event[] = stored ? JSON.parse(stored) : [];
    
    // Validate inputs
    if (new Date(event.start).getTime() >= new Date(event.end).getTime()) {
      return { ok: false, error: 'End time must be after start time' };
    }
    
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID()
    };
    
    events.push(newEvent);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    return { ok: true, data: newEvent };
  } catch (error) {
    console.error('Error creating event:', error);
    return { ok: false, error: 'Failed to create event' };
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(event: Event): Promise<Result<Event>> {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    if (!stored) return { ok: false, error: 'No events found' };
    
    const events: Event[] = JSON.parse(stored);
    
    // Validate inputs
    if (new Date(event.start).getTime() >= new Date(event.end).getTime()) {
      return { ok: false, error: 'End time must be after start time' };
    }
    
    const index = events.findIndex(e => e.id === event.id);
    if (index === -1) {
      return { ok: false, error: 'Event not found' };
    }
    
    events[index] = event;
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    return { ok: true, data: event };
  } catch (error) {
    console.error('Error updating event:', error);
    return { ok: false, error: 'Failed to update event' };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<Result<void>> {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    if (!stored) return { ok: true, data: undefined };
    
    const events: Event[] = JSON.parse(stored);
    const filtered = events.filter(event => event.id !== id);
    
    localStorage.setItem(EVENTS_KEY, JSON.stringify(filtered));
    
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { ok: false, error: 'Failed to delete event' };
  }
}
