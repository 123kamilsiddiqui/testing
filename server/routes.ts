import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertStaffBookSchema, insertEntryStatusSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:sno", async (req, res) => {
    try {
      const order = await storage.getOrderBySno(req.params.sno);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Auto-assign staff based on billbook range
      const staffBooks = await storage.getStaffBook();
      const sno = parseInt(orderData.sno);
      let assignedStaff = "";
      
      for (const sb of staffBooks) {
        const [from, to] = sb.billbookRange.split("-").map(Number);
        if (sno >= from && sno <= to) {
          assignedStaff = sb.staffName;
          break;
        }
      }
      
      const order = await storage.createOrder({
        ...orderData,
        staffName: assignedStaff
      });
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/orders/:sno", async (req, res) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.sno, orderData);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/orders/:sno", async (req, res) => {
    try {
      await storage.deleteOrder(req.params.sno);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Staff Book routes
  app.get("/api/staff-book", async (req, res) => {
    try {
      const staffBooks = await storage.getStaffBook();
      res.json(staffBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff book" });
    }
  });

  app.post("/api/staff-book", async (req, res) => {
    try {
      const staffBookData = insertStaffBookSchema.parse(req.body);
      const staffBook = await storage.createStaffBook(staffBookData);
      res.status(201).json(staffBook);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/staff-book/:billbookRange", async (req, res) => {
    try {
      await storage.deleteStaffBook(req.params.billbookRange);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete staff book entry" });
    }
  });

  // Entry Status routes
  app.get("/api/entry-status", async (req, res) => {
    try {
      const entryStatuses = await storage.getEntryStatuses();
      res.json(entryStatuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch entry statuses" });
    }
  });

  app.get("/api/entry-status/:sno", async (req, res) => {
    try {
      const entryStatuses = await storage.getEntryStatusesBySno(req.params.sno);
      res.json(entryStatuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch entry statuses" });
    }
  });

  app.post("/api/entry-status", async (req, res) => {
    try {
      const entryStatusData = insertEntryStatusSchema.parse(req.body);
      
      // Check if order exists
      const order = await storage.getOrderBySno(entryStatusData.sno);
      if (!order) {
        return res.status(404).json({ message: `Order with S No ${entryStatusData.sno} not found. Please add the order first.` });
      }
      
      const entryStatus = await storage.createEntryStatus(entryStatusData);
      res.status(201).json(entryStatus);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/entry-status/:id", async (req, res) => {
    try {
      await storage.deleteEntryStatus(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete entry status" });
    }
  });

  // Google Sheets sync endpoints
  app.post("/api/sync/google-sheets", async (req, res) => {
    try {
      const SHEET_URL = process.env.GOOGLE_SHEETS_URL;
      if (!SHEET_URL) {
        return res.status(400).json({ message: "Google Sheets URL not configured. Please set GOOGLE_SHEETS_URL environment variable." });
      }

      const orders = await storage.getOrders();
      const staffBook = await storage.getStaffBook();
      const entryStatuses = await storage.getEntryStatuses();

      const response = await fetch(SHEET_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          action: "sync",
          orders,
          staffBook,
          entryStatuses
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      res.json({ message: "Data synced to Google Sheets successfully", result });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to sync to Google Sheets: ${error.message}` });
    }
  });

  app.get("/api/sync/status", async (req, res) => {
    try {
      const SHEET_URL = process.env.GOOGLE_SHEETS_URL;
      res.json({
        configured: !!SHEET_URL,
        url: SHEET_URL ? "Configured" : "Not configured",
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get sync status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
