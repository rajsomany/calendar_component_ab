import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, addMonths, subMonths, isToday } from 'date-fns';
import { useRovingTabIndex } from '../utils/a11y';
import { getEventsInRange, Event } from '../utils/calendarRepo.local';

type MonthGridProps = {
  year: number;
  month: number; // 0-11
  events: Event[];
  onSelectDate: (dateISO: string) => void;
  onNavigate: (dir: 'prev' | 'next' | 'today') => void;
  initialFocusedDateISO?: string;
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthGrid: React.FC<MonthGridProps> = ({
  year,
  month,
  events,
  onSelectDate,
  onNavigate,
  initialFocusedDateISO
}) => {
  const [days, setDays] = useState<Date[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  // Initialize the grid of days for the month
  useEffect(() => {
    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(start);
    
    // Get all days in the month and surrounding days to fill the grid
    const allDays = eachDayOfInterval({ start, end });
    setDays(allDays);
    
    // Count events for each day
    const counts: Record<string, number> = {};
    allDays.forEach(day => {
      const dayISO = day.toISOString().split('T')[0];
      counts[dayISO] = 0;
    });
    
    events.forEach(event => {
      const eventDate = new Date(event.start);
      const dateISO = eventDate.toISOString().split('T')[0];
      if (counts[dateISO] !== undefined) {
        counts[dateISO]++;
      }
    });
    
    setEventCounts(counts);
  }, [year, month, events]);
  
  // Focus handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        break;
      case 'Enter':
        if (days[focusedIndex]) {
          onSelectDate(days[focusedIndex].toISOString().split('T')[0]);
        }
        break;
      case 'Home':
        setFocusedIndex(0);
        break;
      case 'End':
        setFocusedIndex(days.length - 1);
        break;
      default:
        return;
    }
  }, [days, focusedIndex, onSelectDate]);
  
  const handleDayClick = (date: Date) => {
    onSelectDate(date.toISOString().split('T')[0]);
  };
  
  const getDayEvents = (date: Date) => {
    const dateISO = date.toISOString().split('T')[0];
    return eventCounts[dateISO] || 0;
  };
  
  const isCurrentDay = (date: Date) => {
    return isToday(date);
  };
  
  // Navigation buttons
  const handlePrevMonth = () => onNavigate('prev');
  const handleNextMonth = () => onNavigate('next');
  const handleToday = () => onNavigate('today');
  
  // Render the grid of days
  const renderDays = () => {
    const startDay = getDay(startOfMonth(new Date(year, month, 1)));
    
    // Create empty cells for leading days
    const leadingEmptyCells = Array.from({ length: startDay }, (_, i) => (
      <div key={`empty-${i}`} className="day-cell empty" />
    ));
    
    // Create day cells
    const dayCells = days.map((date, index) => {
      const dateISO = date.toISOString().split('T')[0];
      const eventsCount = getDayEvents(date);
      const isCurrent = isCurrentDay(date);
      const isSelected = initialFocusedDateISO === dateISO;
      
      return (
        <button
          key={dateISO}
          className={`day-cell ${isSameMonth(date, new Date(year, month, 1)) ? 'current-month' : 'other-month'} ${isCurrent ? 'today' : ''}`}
          onClick={() => handleDayClick(date)}
          onKeyDown={handleKeyDown}
          aria-label={`${format(date, 'EEEE, d MMMM yyyy')}, ${eventsCount} events`}
          aria-current={isCurrent ? 'date' : undefined}
          aria-selected={isSelected}
        >
          <span className="day-number">{format(date, 'd')}</span>
          {eventsCount > 0 && (
            <span className="event-badge" aria-label={`${eventsCount} events`}>
              {eventsCount}
            </span>
          )}
        </button>
      );
    });
    
    return [...leadingEmptyCells, ...dayCells];
  };
  
  return (
    <div className="month-grid" role="grid">
      <div className="month-header">
        <button 
          className="nav-button"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          &lt;
        </button>
        <h2>{MONTH_NAMES[month]} {year}</h2>
        <button 
          className="nav-button"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>
      
      <div className="weekdays">
        {WEEKDAY_NAMES.map(day => (
          <div key={day} className="weekday-header" aria-label={day}>
            {day}
          </div>
        ))}
      </div>
      
      <div 
        className="days-grid"
        role="rowgroup"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {renderDays()}
      </div>
      
      <div className="today-button-container">
        <button 
          className="today-button"
          onClick={handleToday}
          aria-label="Go to today"
        >
          Today
        </button>
      </div>
    </div>
  );
};
