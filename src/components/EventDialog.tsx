import React, { useState, useEffect } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';

type EventDialogProps = {
  open: boolean;
  initial?: {
    dateISO: string;
    startLocal: string;
    endLocal: string;
  } | Event;
  onSave: (event: Event) => void;
  onClose: () => void;
};

export const EventDialog: React.FC<EventDialogProps> = ({
  open,
  initial,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [notes, setNotes] = useState('');
  
  // Initialize form based on initial data
  useEffect(() => {
    if (open && initial) {
      if ('dateISO' in initial) {
        // Create new event
        setTitle('New Event');
        setStart(initial.startLocal);
        setEnd(initial.endLocal);
        setColor('#3b82f6');
        setNotes('');
      } else {
        // Edit existing event
        setTitle(initial.title);
        setStart(format(parseISO(initial.start), 'yyyy-MM-dd\'T\'HH:mm'));
        setEnd(format(parseISO(initial.end), 'yyyy-MM-dd\'T\'HH:mm'));
        setColor(initial.color || '#3b82f6');
        setNotes(initial.notes || '');
      }
    }
  }, [open, initial]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!title.trim()) return;
    
    // Create or update the event
    const newEvent: Event = {
      id: crypto.randomUUID(),
      title: title.trim(),
      start,
      end,
      color,
      notes: notes.trim()
    };
    
    onSave(newEvent);
  };
  
  const handleDelete = () => {
    if (initial && !('dateISO' in initial)) {
      // Only delete if editing an existing event
      // We'll call onClose here since we don't have a delete handler in props
      onClose();
    }
  };
  
  if (!open) return null;
  
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div 
        className="event-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{initial && 'dateISO' in initial ? 'Create Event' : 'Edit Event'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start">Start</label>
              <input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="end">End</label>
              <input
                id="end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <div className="dialog-actions">
            {initial && !('dateISO' in initial) && (
              <button 
                type="button" 
                className="delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            
            <div className="action-buttons">
              <button 
                type="button" 
                onClick={onClose}
              >
                Cancel
              </button>
              
              <button 
                type="submit"
                className="save-button"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
