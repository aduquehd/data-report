// Web Worker for CSV processing

// DateTime detection functions
const DATE_FORMATS = [
  // ISO 8601 formats
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{3})?$/,
  
  // Common date formats
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  /^\d{4}\/\d{2}\/\d{2}$/,
  
  // With time
  /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}(:\d{2})?( [AP]M)?$/i,
  /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}(:\d{2})?$/,
  
  // Unix timestamps (10 or 13 digits)
  /^\d{10}$/,
  /^\d{13}$/,
];

function parseDateTime(value) {
  if (!value) return null;
  
  const strValue = String(value).trim();
  
  // Check for Unix timestamps
  if (/^\d{10}$/.test(strValue)) {
    return new Date(parseInt(strValue) * 1000);
  }
  if (/^\d{13}$/.test(strValue)) {
    return new Date(parseInt(strValue));
  }
  
  // Try standard parsing
  const date = new Date(strValue);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try alternative formats
  // MM/DD/YYYY or M/D/YYYY
  const mmddyyyy = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
  if (mmddyyyy) {
    const [, month, day, year, rest] = mmddyyyy;
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${rest}`;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return null;
}

function isDateTime(value) {
  if (!value) return false;
  
  const strValue = String(value).trim();
  
  // Check against common patterns
  for (const pattern of DATE_FORMATS) {
    if (pattern.test(strValue)) {
      // Try to parse as date to validate
      const parsed = parseDateTime(strValue);
      if (parsed && !isNaN(parsed.getTime())) {
        return true;
      }
    }
  }
  
  // Try parsing directly as a fallback
  const date = new Date(strValue);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
}

function detectDateTimeColumn(headers, rows, sampleSize = 10) {
  if (!rows || rows.length === 0) return null;
  
  const sample = rows.slice(0, Math.min(sampleSize, rows.length));
  
  // Check each column
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    let validDates = 0;
    
    for (const row of sample) {
      if (isDateTime(row[colIndex])) {
        validDates++;
      }
    }
    
    // If at least 80% of sampled values are valid dates, consider it a datetime column
    if (validDates >= sample.length * 0.8) {
      return colIndex;
    }
  }
  
  return null;
}

self.onmessage = function(e) {
  const { csvText, action } = e.data;
  
  if (action === 'parse') {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      // Parse rows first
      const rawRows = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        rawRows.push(values);
      }
      
      // Auto-detect datetime column
      const dateTimeColumnIndex = detectDateTimeColumn(headers, rawRows);
      
      if (dateTimeColumnIndex === null) {
        // Fallback: check for common timestamp column names
        const timestampIndex = headers.findIndex(h => 
          h.toLowerCase().includes('timestamp') || 
          h.toLowerCase().includes('date') || 
          h.toLowerCase().includes('time') ||
          h === '@timestamp'
        );
        
        if (timestampIndex === -1) {
          self.postMessage({ 
            error: 'No datetime column found in the CSV', 
            data: null 
          });
          return;
        }
        dateTimeColumnIndex = timestampIndex;
      }
      
      const dateTimeColumn = headers[dateTimeColumnIndex];
      const data = [];
      const batchSize = 100;
      let processed = 0;
      
      for (const values of rawRows) {
        const timestamp = values[dateTimeColumnIndex];
        
        if (timestamp) {
          const date = parseDateTime(timestamp);
          if (date && !isNaN(date.getTime())) {
            const row = {};
            headers.forEach((header, index) => {
              const value = values[index];
              row[header] = isNaN(value) ? value : parseFloat(value);
            });
            // Store the parsed date in ISO format
            row[dateTimeColumn] = date.toISOString();
            data.push(row);
          }
        }
        
        processed++;
        if (processed % batchSize === 0) {
          self.postMessage({ 
            progress: Math.round((processed / rawRows.length) * 100),
            data: null 
          });
        }
      }
      
      self.postMessage({ 
        complete: true, 
        data: data,
        columns: headers,
        dateTimeColumn: dateTimeColumn
      });
    } catch (error) {
      self.postMessage({ 
        error: error.message, 
        data: null 
      });
    }
  }
};