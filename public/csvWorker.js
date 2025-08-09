// Web Worker for CSV processing
self.onmessage = function(e) {
  const { csvText, action } = e.data;
  
  if (action === 'parse') {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const timestampIndex = headers.findIndex(h => h === '@timestamp' || h === 'timestamp');
      
      if (timestampIndex === -1) {
        self.postMessage({ 
          error: 'No timestamp column found', 
          data: null 
        });
        return;
      }
      
      const data = [];
      const batchSize = 100;
      let processed = 0;
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const timestamp = values[timestampIndex];
        
        if (timestamp) {
          const date = new Date(timestamp.replace(/"/g, ''));
          if (!isNaN(date.getTime())) {
            const row = {};
            headers.forEach((header, index) => {
              const value = values[index]?.replace(/"/g, '').trim();
              row[header] = isNaN(value) ? value : parseFloat(value);
            });
            row['@timestamp'] = date.toISOString();
            data.push(row);
          }
        }
        
        processed++;
        if (processed % batchSize === 0) {
          self.postMessage({ 
            progress: Math.round((processed / lines.length) * 100),
            data: null 
          });
        }
      }
      
      self.postMessage({ 
        complete: true, 
        data: data,
        columns: headers
      });
    } catch (error) {
      self.postMessage({ 
        error: error.message, 
        data: null 
      });
    }
  }
};