import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, Copy, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SyncStatus {
  configured: boolean;
  url: string;
  lastSync: string;
}

export default function GoogleSheetsPage() {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Check sync status
  const { data: syncStatus, isLoading } = useQuery<SyncStatus>({
    queryKey: ["/api/sync/status"],
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => apiRequest("/api/sync/google-sheets", "POST"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data synced to Google Sheets successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sync/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync data to Google Sheets",
        variant: "destructive",
      });
    },
  });

  const googleAppsScriptCode = `function doGet(e) {
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
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  if (action === 'sync') {
    try {
      // Get the spreadsheet
      const sheet = SpreadsheetApp.getActiveSpreadsheet();
      
      // Clear existing data and add new data
      updateOrdersSheet(sheet, data.orders || []);
      updateStaffBookSheet(sheet, data.staffBook || []);
      updateEntryStatusSheet(sheet, data.entryStatuses || []);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Data synced successfully',
        timestamp: new Date().toISOString()
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

function updateOrdersSheet(spreadsheet, orders) {
  let sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Orders');
  }
  
  sheet.clear();
  
  // Headers
  const headers = ['S No', 'Product', 'Additional', 'Link', 'D Date', 'Staff Name', 'Delivery Status', 'Created At'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Data
  if (orders.length > 0) {
    const data = orders.map(order => [
      order.sno,
      order.product,
      order.additional || '',
      order.link || '',
      order.dDate,
      order.staffName || '',
      order.deliveryStatus,
      order.createdAt
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
}

function updateStaffBookSheet(spreadsheet, staffBook) {
  let sheet = spreadsheet.getSheetByName('Staff Book');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Staff Book');
  }
  
  sheet.clear();
  
  // Headers
  const headers = ['Staff Name', 'Billbook Range', 'Created At'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Data
  if (staffBook.length > 0) {
    const data = staffBook.map(entry => [
      entry.staffName,
      entry.billbookRange,
      entry.createdAt
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
}

function updateEntryStatusSheet(spreadsheet, entryStatuses) {
  let sheet = spreadsheet.getSheetByName('Entry Status');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Entry Status');
  }
  
  sheet.clear();
  
  // Headers
  const headers = ['S No', 'Product', 'Package Complete', 'Created At'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Data
  if (entryStatuses.length > 0) {
    const data = entryStatuses.map(entry => [
      entry.sno,
      entry.product,
      entry.packageComplete,
      entry.createdAt
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    toast({
      title: "Code Copied",
      description: "Google Apps Script code copied to clipboard",
    });
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gold mb-2">Google Sheets Integration</h1>
          <p className="text-gray-600">Sync your RAJMAHAL order data with Google Sheets</p>
        </div>
        
        {syncStatus?.configured && (
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="btn-action"
          >
            {syncMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        )}
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connection Status
            {syncStatus?.configured ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading status...</p>
          ) : syncStatus?.configured ? (
            <div className="space-y-2">
              <p className="text-green-600">
                ✓ Google Sheets integration is configured and ready
              </p>
              <p className="text-sm text-gray-600">
                Last checked: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
          ) : (
            <p className="text-red-600">
              Google Sheets integration is not configured. Follow the setup instructions below.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold text-white text-sm flex items-center justify-center font-semibold">1</div>
              <div>
                <h3 className="font-semibold">Create a Google Sheet</h3>
                <p className="text-gray-600">Create a new Google Spreadsheet where your order data will be stored.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://sheets.google.com', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Sheets
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold text-white text-sm flex items-center justify-center font-semibold">2</div>
              <div>
                <h3 className="font-semibold">Create Google Apps Script</h3>
                <p className="text-gray-600">Go to Extensions → Apps Script in your Google Sheet and replace the default code with this:</p>
                <div className="mt-3 relative">
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-40">
                    <code>{googleAppsScriptCode}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyCode}
                  >
                    {copiedUrl ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold text-white text-sm flex items-center justify-center font-semibold">3</div>
              <div>
                <h3 className="font-semibold">Deploy the Script</h3>
                <p className="text-gray-600">
                  Click "Deploy" → "New deployment" → Choose "Web app" → Set execute as "Me" and access to "Anyone" → Deploy
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold text-white text-sm flex items-center justify-center font-semibold">4</div>
              <div>
                <h3 className="font-semibold">Add the Web App URL</h3>
                <p className="text-gray-600">
                  Copy the Web App URL from the deployment and add it as the GOOGLE_SHEETS_URL environment variable in your Replit secrets.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://replit.com/~', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Replit Secrets
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Google Sheets Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Backup your order data to Google Sheets</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Share data with team members easily</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Create reports and analytics using Google Sheets</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Access your data from anywhere</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}