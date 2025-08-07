/**
 * RAJMAHAL Groom Studio - Google Apps Script
 * This script handles data synchronization between the RAJMAHAL order management system
 * and Google Sheets for backup and reporting purposes.
 */

function doGet(e) {
  const action = e.parameter.action;
  
  switch(action) {
    case 'sync':
      return ContentService.createTextOutput(JSON.stringify({status: 'ready'}))
        .setMimeType(ContentService.MimeType.JSON);
    default:
      return ContentService.createTextOutput(JSON.stringify({error: 'Unknown action'}))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'sync') {
    try {
      // Get the spreadsheet
      const sheet = SpreadsheetApp.getActiveSpreadsheet();
      
      // Sync all data from RAJMAHAL system
      updateOrdersSheet(sheet, data.orders || []);
      updateStaffBookSheet(sheet, data.staffBook || []);
      updateEntryStatusSheet(sheet, data.entryStatuses || []);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'RAJMAHAL data synced successfully',
        timestamp: new Date().toISOString(),
        recordCount: {
          orders: data.orders ? data.orders.length : 0,
          staffBook: data.staffBook ? data.staffBook.length : 0,
          entryStatuses: data.entryStatuses ? data.entryStatuses.length : 0
        }
      })).setMimeType(ContentService.MimeType.JSON);
      
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: 'Unknown action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Updates the Orders sheet with current order data
 */
function updateOrdersSheet(spreadsheet, orders) {
  let sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Orders');
  }
  
  // Clear existing data
  sheet.clear();
  
  // Set headers matching RAJMAHAL system structure
  const headers = [
    'S No', 'Product', 'Additional', 'Link', 'D Date', 
    'Staff Name', 'Delivery Status', 'ID', 'Created At'
  ];
  
  // Style headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#1f4e79');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  
  // Add data
  if (orders.length > 0) {
    const data = orders.map(order => [
      order.sno || '',
      order.product || '',
      order.additional || '',
      order.link || '',
      order.dDate || '',
      order.staffName || '',
      order.deliveryStatus || 'pending',
      order.id || '',
      order.createdAt || ''
    ]);
    
    const dataRange = sheet.getRange(2, 1, data.length, headers.length);
    dataRange.setValues(data);
    
    // Apply alternating row colors for better readability
    for (let i = 0; i < data.length; i++) {
      if (i % 2 === 0) {
        sheet.getRange(i + 2, 1, 1, headers.length).setBackground('#f8f9fa');
      }
    }
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Updates the Staff Book sheet with billbook assignments
 */
function updateStaffBookSheet(spreadsheet, staffBook) {
  let sheet = spreadsheet.getSheetByName('Staff Book');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Staff Book');
  }
  
  // Clear existing data
  sheet.clear();
  
  // Set headers
  const headers = ['Staff Name', 'Billbook Range', 'ID', 'Created At'];
  
  // Style headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#c5504b');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  
  // Add data
  if (staffBook.length > 0) {
    const data = staffBook.map(entry => [
      entry.staffName || '',
      entry.billbookRange || '',
      entry.id || '',
      entry.createdAt || ''
    ]);
    
    const dataRange = sheet.getRange(2, 1, data.length, headers.length);
    dataRange.setValues(data);
    
    // Apply alternating row colors
    for (let i = 0; i < data.length; i++) {
      if (i % 2 === 0) {
        sheet.getRange(i + 2, 1, 1, headers.length).setBackground('#f8f9fa');
      }
    }
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Updates the Entry Status sheet with product completion tracking
 */
function updateEntryStatusSheet(spreadsheet, entryStatuses) {
  let sheet = spreadsheet.getSheetByName('Entry Status');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Entry Status');
  }
  
  // Clear existing data
  sheet.clear();
  
  // Set headers
  const headers = ['S No', 'Product', 'Package Complete', 'ID', 'Created At'];
  
  // Style headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#d4af37');
  headerRange.setFontColor('#000000');
  headerRange.setFontWeight('bold');
  
  // Add data
  if (entryStatuses.length > 0) {
    const data = entryStatuses.map(entry => [
      entry.sno || '',
      entry.product || '',
      entry.packageComplete || 'No',
      entry.id || '',
      entry.createdAt || ''
    ]);
    
    const dataRange = sheet.getRange(2, 1, data.length, headers.length);
    dataRange.setValues(data);
    
    // Apply alternating row colors and conditional formatting for package status
    for (let i = 0; i < data.length; i++) {
      const rowRange = sheet.getRange(i + 2, 1, 1, headers.length);
      
      if (i % 2 === 0) {
        rowRange.setBackground('#f8f9fa');
      }
      
      // Highlight completed packages in green
      if (data[i][2] === 'Yes') {
        sheet.getRange(i + 2, 3, 1, 1).setBackground('#d4edda');
      }
    }
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Optional: Create a summary dashboard sheet
 */
function createSummarySheet(spreadsheet, orders, staffBook, entryStatuses) {
  let sheet = spreadsheet.getSheetByName('RAJMAHAL Dashboard');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('RAJMAHAL Dashboard');
  }
  
  sheet.clear();
  
  // Add title
  sheet.getRange(1, 1).setValue('RAJMAHAL THE GROOM STUDIO - DATA SUMMARY');
  sheet.getRange(1, 1).setFontSize(16).setFontWeight('bold').setBackground('#1f4e79').setFontColor('#ffffff');
  
  // Add summary statistics
  const stats = [
    ['Last Updated:', new Date().toLocaleString()],
    ['Total Orders:', orders.length],
    ['Staff Assignments:', staffBook.length],
    ['Entry Status Records:', entryStatuses.length],
    ['Pending Deliveries:', orders.filter(o => o.deliveryStatus === 'pending').length],
    ['Completed Deliveries:', orders.filter(o => o.deliveryStatus === 'delivered').length]
  ];
  
  sheet.getRange(3, 1, stats.length, 2).setValues(stats);
  sheet.getRange(3, 1, stats.length, 1).setFontWeight('bold');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 2);
}