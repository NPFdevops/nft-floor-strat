import React, { useState } from 'react';

const DatePicker = ({ onDateChange, startDate, endDate }) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    console.log('Start date changed:', newStartDate);
    setLocalStartDate(newStartDate);
    onDateChange(newStartDate, localEndDate);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    console.log('End date changed:', newEndDate);
    setLocalEndDate(newEndDate);
    onDateChange(localStartDate, newEndDate);
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    // Set minimum date to 2 years ago
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return twoYearsAgo.toISOString().split('T')[0];
  };

  const setPresetRange = (days) => {
    console.log('Setting preset range:', days, 'days');
    
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const endDateStr = end.toISOString().split('T')[0];
    const startDateStr = start.toISOString().split('T')[0];
    
    console.log('Preset date range:', { startDateStr, endDateStr });
    
    setLocalStartDate(startDateStr);
    setLocalEndDate(endDateStr);
    onDateChange(startDateStr, endDateStr);
  };

  return (
    <div className="date-picker">
      <div className="date-picker-header">
        <h3>Date Range</h3>
        <div className="preset-buttons">
          <button 
            type="button" 
            onClick={() => setPresetRange(7)}
            className="preset-btn"
          >
            7D
          </button>
          <button 
            type="button" 
            onClick={() => setPresetRange(30)}
            className="preset-btn"
          >
            30D
          </button>
          <button 
            type="button" 
            onClick={() => setPresetRange(90)}
            className="preset-btn"
          >
            90D
          </button>
          <button 
            type="button" 
            onClick={() => setPresetRange(365)}
            className="preset-btn"
          >
            1Y
          </button>
        </div>
      </div>

      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">Start Date:</label>
          <input
            id="start-date"
            type="date"
            value={localStartDate}
            onChange={handleStartDateChange}
            min={getMinDate()}
            max={localEndDate || getMaxDate()}
            className="date-input"
          />
        </div>

        <div className="date-input-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            id="end-date"
            type="date"
            value={localEndDate}
            onChange={handleEndDateChange}
            min={localStartDate || getMinDate()}
            max={getMaxDate()}
            className="date-input"
          />
        </div>
      </div>

      {localStartDate && localEndDate && (
        <div className="date-range-info">
          <span className="date-range-text">
            Showing data from {new Date(localStartDate).toLocaleDateString()} to {new Date(localEndDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
