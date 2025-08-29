import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO, addMinutes, isSameDay, startOfDay } from 'date-fns';
import { useLiveRegion } from '../utils/a11y';
import { Event, toLocal, formatRange } from '../utils/timeHelpers';
import { getEventsInRange } from '../utils/calendarRepo.local';

type DayTimelineProps = {
  dateISO: string;
  events: Event[];
  onCreate: (draft: Omit<Event, 'id'>) => void;
  onUpdate: (event: Event) => void;
  onDelete: (id: string) => void;
  startHour?: number; // Default 5
  endHour?: number;   // Default 23
  slotMinutes?: 5 | 10 | 15 | 30; // Default 15
};

export const DayTimeline: React.FC<DayTimelineProps> = ({
  dateISO,
  events,
  onCreate,
  onUpdate,
  onDelete,
  startHour = 5,
  endHour = 23,
  slotMinutes = 15
}) => {
  const [eventSlots, setEventSlots] = useState<Event[][]>([]);
  const [dragging, setDragging] = useState<{ 
    id?: string; 
    type: 'move' | 'resize-top' | 'resize-bottom';
    originalStart: Date;
    originalEnd: Date;
    initialY: number;
  } | null>(null);
  const [ghostEvent, setGhostEvent] = useState<Event | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { announce } = useLiveRegion();
  
  // Initialize event slots
  useEffect(() => {
    // Sort events by start time ascending, then duration descending
    const sortedEvents = [...events].sort((a, b) => {
      const startA = new Date(a.start).getTime();
      const startB = new Date(b.start).getTime();
      if (startA !== startB) return startA - startB;
      
      const durationA = new Date(a.end).getTime() - new Date(a.start).getTime();
      const durationB = new Date(b.end).getTime() - new Date(b.start).getTime();
      return durationB - durationA; // Descending duration
    });
    
    // Stack events
    const stacks: Event[][] = [];
    let currentStack: Event[] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if this event overlaps with the last event in the current stack
      if (currentStack.length > 0) {
        const lastEvent = currentStack[currentStack.length - 1];
        const lastEnd = new Date(lastEvent.end);
        
        if (eventStart < lastEnd) {
          // Overlaps, add to current stack
          currentStack.push(event);
        } else {
          // No overlap, start a new stack
          stacks.push(currentStack);
          currentStack = [event];
        }
      } else {
        // First event in the list
        currentStack.push(event);
      }
    });
    
    // Add the last stack if it exists
    if (currentStack.length > 0) {
      stacks.push(currentStack);
    }
    
    setEventSlots(stacks);
  }, [events]);
  
  // Scroll to first event or 9:00 AM
  useEffect(() => {
    const scrollToTime = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const firstEvent = events.length > 0 ? 
        new Date(events[0].start) : null;
      
      // Calculate scroll position for the first event or 9:00 AM
      const targetTime = firstEvent || new Date(dateISO);
      targetTime.setHours(9, 0, 0, 0);
      
      const startOfDayDate = startOfDay(targetTime);
      const minutesFromStart = Math.max(0, 
        (targetTime.getTime() - startOfDayDate.getTime()) / (1000 * 60)
      );
      
      const pixelPosition = (minutesFromStart / slotMinutes) * 40; // 40px per slot
      container.scrollTop = pixelPosition;
    };
    
    scrollToTime();
  }, [events, dateISO, slotMinutes]);
  
  // Handle mouse/touch events for drag and resize
  const handleMouseDown = (e: React.MouseEvent, event: Event) => {
    if (e.button !== 0) return; // Only left click
    
    e.preventDefault();
    setDragging({
      id: event.id,
      type: 'move',
      originalStart: new Date(event.start),
      originalEnd: new Date(event.end),
      initialY: e.clientY
    });
    
    // Create ghost event for visual feedback
    const ghostEvent = {
      ...event,
      start: event.start,
      end: event.end
    };
    setGhostEvent(ghostEvent);
  };
  
  const handleResizeTop = (e: React.MouseEvent, event: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragging({
      id: event.id,
      type: 'resize-top',
      originalStart: new Date(event.start),
      originalEnd: new Date(event.end),
      initialY: e.clientY
    });
    
    const ghostEvent = {
      ...event,
      start: event.start,
      end: event.end
    };
    setGhostEvent(ghostEvent);
  };
  
  const handleResizeBottom = (e: React.MouseEvent, event: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragging({
      id: event.id,
      type: 'resize-bottom',
      originalStart: new Date(event.start),
      originalEnd: new Date(event.end),
      initialY: e.clientY
    });
    
    const ghostEvent = {
      ...event,
      start: event.start,
      end: event.end
    };
    setGhostEvent(ghostEvent);
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !ghostEvent || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Calculate time offset
    const minutesPerPixel = slotMinutes / 40; // 40px per slot
    const minutesFromTop = Math.max(0, Math.min(
      (y / 40) * slotMinutes,
      (endHour - startHour) * 60
    ));
    
    const newDate = new Date(dateISO);
    newDate.setHours(startHour, 0, 0, 0);
    newDate.setMinutes(minutesFromTop);
    
    let updatedGhostEvent = { ...ghostEvent };
    
    if (dragging.type === 'move') {
      // Calculate the duration of the original event
      const duration = (dragging.originalEnd.getTime() - dragging.originalStart.getTime()) / (1000 * 60);
      updatedGhostEvent.start = newDate.toISOString();
      updatedGhostEvent.end = addMinutes(newDate, duration).toISOString();
    } else if (dragging.type === 'resize-top') {
      // Ensure the new start is not after the end
      const newStart = newDate;
      if (newStart < new Date(ghostEvent.end)) {
        updatedGhostEvent.start = newStart.toISOString();
      }
    } else if (dragging.type === 'resize-bottom') {
      // Ensure the new end is not before the start
      const newEnd = newDate;
      if (newEnd > new Date(ghostEvent.start)) {
        updatedGhostEvent.end = newEnd.toISOString();
      }
    }
    
    setGhostEvent(updatedGhostEvent);
  }, [dragging, ghostEvent, dateISO, slotMinutes, startHour, endHour]);
  
  const handleMouseUp = useCallback(() => {
    if (!dragging || !ghostEvent) return;
    
    // Commit the changes
    const updatedEvent = { ...ghostEvent };
    onUpdate(updatedEvent);
    
    setDragging(null);
    setGhostEvent(null);
    announce(`Moved to ${format(new Date(ghostEvent.start), 'h:mm a')}`);
  }, [dragging, ghostEvent, onUpdate, announce]);
  
  // Set up event listeners for drag operations
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);
  
  // Handle empty space clicks for creating events
  const handleEmptySpaceClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const y = e.clientY - rect.top;
    
    // Calculate time offset
    const minutesPerPixel = slotMinutes / 40;
    const minutesFromTop = Math.max(0, Math.min(
      (y / 40) * slotMinutes,
      (endHour - startHour) * 60
    ));
    
    const newDate = new Date(dateISO);
    newDate.setHours(startHour, 0, 0, 0);
    newDate.setMinutes(minutesFromTop);
    
    // Create a new event with 30-minute duration
    const endDate = addMinutes(newDate, 30);
    
    onCreate({
      title: 'New Event',
      start: newDate.toISOString(),
      end: endDate.toISOString()
    });
  };
  
  // Render the timeline grid
  const renderGrid = () => {
    const gridLines = [];
    const totalMinutes = (endHour - startHour) * 60;
    
    for (let i = 0; i <= totalMinutes; i += slotMinutes) {
      const hour = Math.floor(i / 60);
      const minute = i % 60;
      const timeString = format(new Date().setHours(startHour + hour, minute), 'h:mm a');
      
      gridLines.push(
        <div 
          key={i} 
          className="time-slot"
          style={{ height: `${40}px` }}
        >
          {minute === 0 && (
            <span className="hour-label">{timeString}</span>
          )}
        </div>
      );
    }
    
    return gridLines;
  };
  
  // Render events in their slots
  const renderEvents = () => {
    return eventSlots.map((stack, stackIndex) => (
      <div 
        key={stackIndex} 
        className="event-stack"
        style={{ 
          left: `${stackIndex * 100}px`,
          width: '100px'
        }}
      >
        {stack.map(event => {
          const eventStart = toLocal(event.start);
          const eventEnd = toLocal(event.end);
          
          // Calculate position and height
          const startMinutes = (eventStart.getHours() * 60 + eventStart.getMinutes()) - (startHour * 60);
          const endMinutes = (eventEnd.getHours() * 60 + eventEnd.getMinutes()) - (startHour * 60);
          
          const top = (startMinutes / slotMinutes) * 40;
          const height = ((endMinutes - startMinutes) / slotMinutes) * 40;
          
          // Determine if this is the ghost event
          const isGhost = ghostEvent?.id === event.id;
          
          return (
            <div
              key={event.id}
              className={`event-card ${isGhost ? 'ghost' : ''}`}
              style={{
                top: `${top}px`,
                height: `${Math.max(40, height)}px`,
                left: isGhost ? 0 : undefined,
                zIndex: isGhost ? 100 : 1
              }}
              onClick={() => {
                setEditingEvent(event);
                setShowDialog(true);
              }}
              onMouseDown={(e) => handleMouseDown(e, event)}
              role="button"
              aria-label={`${event.title}, ${formatRange(event.start, event.end)}${isGhost ? ' (dragging)' : ''}`}
            >
              <div className="event-header">
                <span className="event-title">{event.title}</span>
              </div>
              
              <div className="event-time">
                {formatRange(event.start, event.end)}
              </div>
              
              {/* Resize handles */}
              <div 
                className="resize-handle resize-top"
                onMouseDown={(e) => handleResizeTop(e, event)}
              />
              <div 
                className="resize-handle resize-bottom"
                onMouseDown={(e) => handleResizeBottom(e, event)}
              />
            </div>
          );
        })}
      </div>
    ));
  };
  
  // Render the ghost event
  const renderGhost = () => {
    if (!ghostEvent) return null;
    
    const eventStart = toLocal(ghostEvent.start);
    const eventEnd = toLocal(ghostEvent.end);
    
    // Calculate position and height
    const startMinutes = (eventStart.getHours() * 60 + eventStart.getMinutes()) - (startHour * 60);
    const endMinutes = (eventEnd.getHours() * 60 + eventEnd.getMinutes()) - (startHour * 60);
    
    const top = (startMinutes / slotMinutes) * 40;
    const height = ((endMinutes - startMinutes) / slotMinutes) * 40;
    
    return (
      <div
        className="event-card ghost"
        style={{
          top: `${top}px`,
          height: `${Math.max(40, height)}px`,
          left: '0',
          zIndex: 100
        }}
      >
        <div className="event-header">
          <span className="event-title">{ghostEvent.title}</span>
        </div>
        
        <div className="event-time">
          {formatRange(ghostEvent.start, ghostEvent.end)}
        </div>
      </div>
    );
  };
  
  return (
    <div 
      ref={containerRef}
      className="day-timeline"
      onClick={handleEmptySpaceClick}
      role="region"
      aria-label={`Schedule for ${format(parseISO(dateISO), 'EEEE, MMMM d, yyyy')}`}
    >
      <div className="timeline-header">
        <h2>{format(parseISO(dateISO), 'EEEE, MMMM d, yyyy')}</h2>
      </div>
      
      <div className="time-grid">
        <div className="gutter">
          {renderGrid()}
        </div>
        
        <div className="content">
          {renderEvents()}
          {renderGhost()}
        </div>
      </div>
      
      {/* Live region for announcements */}
      <div 
        role="alert" 
        aria-live="polite" 
        className="sr-only"
        ref={(el) => el?.setAttribute('aria-label', '')}
      />
    </div>
  );
};
