import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths, subMonths, startOfMonth, isSameDay } from 'date-fns';
import { MonthGrid } from './components/MonthGrid';
import { DayTimeline } from './components/DayTimeline';
import { EventDialog } from './components/EventDialog';
import { getEventsInRange, createEvent, updateEvent, deleteEvent, Event } from './utils/calendarRepo.local';
import { getDayStart, getDayEnd } from './utils/timeHelpers';

type AppState = {
  view: 'month' | 'day';
  selectedDateISO: string;
  events: Event[];
  tz: string;
};

const AppShell: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'month',
    selectedDateISO: new Date().toISOString().split('T')[0],
    events: [],
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);
  
  const loadEvents = async () => {
    const start = getDayStart(state.selectedDateISO);
    const end = getDayEnd(state.selectedDateISO);
    
    const result = await getEventsInRange(start, end);
    if (result.ok) {
      setState(prev => ({ ...prev, events: result.data }));
    }
  };
  
  // Navigation functions
  const navigateMonth = (dir: 'prev' | 'next' | 'today') => {
    let newDate;
    
    switch (dir) {
      case 'prev':
        newDate = subMonths(parseISO(state.selectedDateISO), 1);
        break;
      case 'next':
        newDate = addMonths(parseISO(state.selectedDateISO), 1);
        break;
      case 'today':
        newDate = new Date();
        break;
      default:
        return;
    }
    
    setState(prev => ({
      ...prev,
      selectedDateISO: newDate.toISOString().split('T')[0]
    }));
  };
  
  const selectDate = (dateISO: string) => {
    setState(prev => ({
      ...prev,
      view: 'day',
      selectedDateISO: dateISO
    }));
    
    loadEvents();
  };
  
  // CRUD operations
  const createEvent = async (event: Omit<Event, 'id'>) => {
    const result = await createEvent(event);
    if (result.ok) {
      setState(prev => ({
        ...prev,
        events: [...prev.events, result.data]
      }));
    }
  };
  
  const updateEvent = async (event: Event) => {
    const result = await updateEvent(event);
    if (result.ok) {
      setState(prev => ({
        ...prev,
        events: prev.events.map(e => e.id === event.id ? result.data : e)
      }));
    }
  };
  
  const deleteEvent = async (id: string) => {
    const result = await deleteEvent(id);
    if (result.ok) {
      setState(prev => ({
        ...prev,
        events: prev.events.filter(e => e.id !== id)
      }));
    }
  };
  
  // Event handlers
  const handleCreateEvent = (draft: Omit<Event, 'id'>) => {
    createEvent(draft);
    setShowEventDialog(false);
  };
  
  const handleUpdateEvent = (event: Event) => {
    updateEvent(event);
    setShowEventDialog(false);
  };
  
  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    setShowEventDialog(false);
  };
  
  // Render the appropriate view
  const renderView = () => {
    if (state.view === 'month') {
      return (
        <MonthGrid
          year={parseInt(state.selectedDateISO.split('-')[0])}
          month={parseInt(state.selectedDateISO.split('-')[1]) - 1}
          events={state.events}
          onSelectDate={selectDate}
          onNavigate={navigateMonth}
          initialFocusedDateISO={state.selectedDateISO}
        />
      );
    } else {
      return (
        <DayTimeline
          dateISO={state.selectedDateISO}
          events={state.events}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      );
    }
  };
  
  // Format the current date for display
  const formatDate = () => {
    return format(parseISO(state.selectedDateISO), 'MMMM d, yyyy');
  };
  
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Calendar</h1>
        
        <div className="header-controls">
          <button 
            onClick={() => setState(prev => ({ ...prev, view: prev.view === 'month' ? 'day' : 'month' }))}
            className="view-toggle"
          >
            {state.view === 'month' ? 'Day View' : 'Month View'}
          </button>
          
          <div className="date-display">
            {formatDate()}
          </div>
          
          <div className="nav-buttons">
            <button 
              onClick={() => navigateMonth('prev')}
              aria-label="Previous month"
            >
              &lt;
            </button>
            
            <button 
              onClick={() => navigateMonth('today')}
              aria-label="Today"
            >
              Today
            </button>
            
            <button 
              onClick={() => navigateMonth('next')}
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {renderView()}
      </main>
      
      <EventDialog
        open={showEventDialog}
        initial={editingEvent}
        onSave={(event) => {
          if (editingEvent) {
            handleUpdateEvent(event);
          } else {
            handleCreateEvent(event);
          }
        }}
        onClose={() => {
          setShowEventDialog(false);
          setEditingEvent(null);
        }}
      />
    </div>
  );
};

export default AppShell;
